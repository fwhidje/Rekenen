import { describe, it, expect, beforeEach } from 'vitest'
import type { AppState, Profile } from '../state/types'
import type { AnswerRecord } from '../engine/diagnostics'
import { createProfile, recordAnswer } from '../state/storage'
import { SKILLS } from '../curriculum/skills'
import {
  applySnapshot, mergeRemoteProgress, progressRows, stampAll, stampChanges, stampState,
} from './progressMerge'
import { fromEventRow, legacyEventId, toEventRow, PRE_SYNC_VERSION } from './rows'
import { isPermanentCode } from './remote'
import type { AnswerEventRow, ChildRow, ProgressEventRow, ProgressRow } from './rows'
import { SyncEngine, OUTBOX_CAP } from './engine'
import type { SyncState, SyncStore } from './engine'
import { SyncError } from './remote'
import type { Remote } from './remote'

const ROOT = SKILLS.find(s => s.unlockedBy.length === 0 && !s.disabled)!.id

const record = (profileId: string, over: Partial<AnswerRecord> = {}): AnswerRecord => ({
  id: crypto.randomUUID(), timestamp: 1_700_000_000_000, profileId, sessionId: crypto.randomUUID(),
  appVersion: 'abc123', skillId: ROOT, exerciseId: 'choice', tierId: 't', op: '+',
  problem: { op: '+', terms: [1, 2] }, operandA: 1, operandB: 2, correctAnswer: 3, givenAnswer: 4,
  correct: false, errorType: 'off-by-one', scoreBefore: 12, responseTimeMs: 2100.4,
  meta: { options: [2, 3, 4, 5] }, ...over,
})

// ─── Progress merge ───────────────────────────────────────────────────────────

describe('stamping', () => {
  it('stamps only the skills that changed', () => {
    const before = createProfile('a')
    const after = recordAnswer(before, ROOT, true)
    const stamped = stampChanges(before, after, 5000)
    expect(stamped.skills[ROOT].updatedAt).toBe(5000)
    const untouched = Object.entries(stamped.skills).filter(([id]) => id !== ROOT)
    expect(untouched.every(([, s]) => s.updatedAt === undefined)).toBe(true)
  })

  it('returns the same object when nothing changed', () => {
    const p = createProfile('a')
    expect(stampChanges(p, { ...p }, 1)).toEqual(p)
    const state: AppState = { profiles: [p], activeProfileId: p.id }
    expect(stampState(state, state, 1)).toBe(state)
  })

  it('stampAll marks existing progress but leaves pristine skills alone', () => {
    const p = stampAll(recordAnswer(createProfile('a'), ROOT, true), 7000)
    expect(p.skills[ROOT].updatedAt).toBe(7000)
    const locked = Object.values(p.skills).filter(s => !s.unlocked && s.score === 0)
    expect(locked.length).toBeGreaterThan(0)
    expect(locked.every(s => s.updatedAt === undefined)).toBe(true)
  })
})

describe('progress rows + merge (last write wins per skill)', () => {
  const base = () => stampChanges(createProfile('a'), recordAnswer(createProfile('a'), ROOT, true), 1000)

  it('only pushes skills changed after the last push', () => {
    const p = base()
    expect(progressRows(p, 0).map(r => r.skill_id)).toEqual([ROOT])
    expect(progressRows(p, 1000)).toEqual([])
  })

  const remoteRow = (p: Profile, score: number, at: number): ProgressRow => ({
    child_id: p.id, skill_id: ROOT, score, unlocked: true, archived: false,
    unlocked_at: null, archived_at: null, updated_at: new Date(at).toISOString(),
  })

  it('takes a newer remote skill', () => {
    const p = base()
    const merged = mergeRemoteProgress(p, [remoteRow(p, 40, 2000)])
    expect(merged.skills[ROOT].score).toBe(40)
    expect(merged.skills[ROOT].updatedAt).toBe(2000)
  })

  it('keeps the local skill when the remote is older or equal', () => {
    const p = base()
    expect(mergeRemoteProgress(p, [remoteRow(p, 40, 999)])).toBe(p)
    expect(mergeRemoteProgress(p, [remoteRow(p, 40, 1000)])).toBe(p)
  })

  it('re-runs the unlock cascade after taking remote scores', () => {
    const p = createProfile('a')
    const child = SKILLS.find(s => !s.disabled && s.unlockedBy.length > 0 &&
      s.unlockedBy.every(id => SKILLS.find(k => k.id === id)!.unlockedBy.length === 0 && !SKILLS.find(k => k.id === id)!.disabled))!
    expect(p.skills[child.id].unlocked).toBe(false)
    const rows = child.unlockedBy.map(id => ({ ...remoteRow(p, 80, 2000), skill_id: id }))
    expect(mergeRemoteProgress(p, rows).skills[child.id].unlocked).toBe(true)
  })

  it('ignores rows of other children and unknown skills', () => {
    const p = base()
    expect(mergeRemoteProgress(p, [{ ...remoteRow(p, 40, 2000), child_id: 'other' }])).toBe(p)
    expect(mergeRemoteProgress(p, [{ ...remoteRow(p, 40, 2000), skill_id: 'no-such-skill' }])).toBe(p)
  })
})

describe('applySnapshot', () => {
  it('adds account children that are new to this device, keeps device-only profiles', () => {
    const local = createProfile('lokaal')
    const state: AppState = { profiles: [local], activeProfileId: local.id }
    const child: ChildRow = { id: crypto.randomUUID(), name: 'Vos', createdAt: 123 }
    const next = applySnapshot(state, {
      children: [child],
      progress: [{ child_id: child.id, skill_id: ROOT, score: 33, unlocked: true, archived: false,
        unlocked_at: null, archived_at: null, updated_at: new Date(2000).toISOString() }],
    })
    expect(next.profiles.map(p => p.name)).toEqual(['lokaal', 'Vos'])
    expect(next.profiles[1].id).toBe(child.id)
    expect(next.profiles[1].skills[ROOT].score).toBe(33)
    expect(next.activeProfileId).toBe(local.id)
  })

  it('is a no-op (same object) when the account has nothing new', () => {
    const local = createProfile('a')
    const state: AppState = { profiles: [local], activeProfileId: local.id }
    expect(applySnapshot(state, { children: [{ id: local.id, name: 'a', createdAt: local.createdAt }], progress: [] })).toBe(state)
  })
})

// ─── Event rows ───────────────────────────────────────────────────────────────

describe('event rows', () => {
  it('round-trips a record (minus meta), with integer columns', () => {
    const r = record('11111111-2222-3333-4444-555555555555')
    const row = toEventRow(r)
    expect(row.response_time_ms).toBe(2100)
    expect(row.meta).toEqual({ options: [2, 3, 4, 5] })
    const { meta: _m, flag: _f, scene_theme: _st, scene_background: _sb, scene_counter: _sc,
      viewport_w: _vw, viewport_h: _vh, ...lean } = row
    const back = fromEventRow(lean)
    const { meta: _meta, responseTimeMs: _rt, ...expected } = r
    expect(back).toMatchObject(expected)
    expect(back.meta).toBeUndefined()
  })

  it('every row has the same keys, whatever the record leaves out', () => {
    const full = Object.keys(toEventRow(record('p'))).sort()
    const bare = Object.keys(toEventRow({
      timestamp: 1, profileId: 'p', skillId: 's', exerciseId: 'e', op: '+',
      operandA: 1, operandB: 1, correctAnswer: 2, correct: true, errorType: null,
    })).sort()
    expect(bare).toEqual(full)
  })

  it('gives pre-sync records a stable id and version', () => {
    const old: AnswerRecord = { ...record('11111111-2222-3333-4444-555555555555'), id: undefined, appVersion: undefined }
    const a = toEventRow(old), b = toEventRow(old)
    expect(a.id).toBe(b.id)
    expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(a.app_version).toBe(PRE_SYNC_VERSION)
    expect(legacyEventId(old.profileId, old.timestamp + 1)).not.toBe(a.id)
  })

  it('carries the review flag, scene and viewport as their own columns', () => {
    const row = toEventRow(record('p', {
      flag: 'flagged',
      scene: { theme: 'space', background: 1, counter: 4 },
      viewport: { w: 390.4, h: 844 },
    }))
    expect(row.flag).toBe('flagged')
    expect([row.scene_theme, row.scene_background, row.scene_counter]).toEqual(['space', 1, 4])
    expect([row.viewport_w, row.viewport_h]).toEqual([390, 844])
    const plain = toEventRow(record('p'))
    expect([plain.flag, plain.scene_theme, plain.viewport_w]).toEqual([null, null, null])
  })

  it('keeps rows queued when the server is behind a migration', () => {
    expect(isPermanentCode('42703')).toBe(false)    // undefined column
    expect(isPermanentCode('PGRST204')).toBe(false) // column not in schema cache
    expect(isPermanentCode('23514')).toBe(true)     // check constraint
    expect(isPermanentCode('42501')).toBe(true)     // access rule
  })

  it('drops oversized meta but keeps the answer', () => {
    const row = toEventRow(record('p', { meta: { blob: 'x'.repeat(20_000) } }))
    expect(row.meta).toBeNull()
    expect(row.correct).toBe(false)
  })
})

// ─── Engine ───────────────────────────────────────────────────────────────────

class FakeRemote implements Remote {
  children = new Map<string, ChildRow>()
  progress: ProgressRow[] = []
  events = new Map<string, AnswerEventRow>()
  overrides: ProgressEventRow[] = []
  fail: 'offline' | null = null
  refuse = new Set<string>()   // event ids the server rejects outright
  calls: string[] = []

  private gate(name: string) {
    this.calls.push(name)
    if (this.fail) throw new SyncError('Failed to fetch', false)
  }
  async pull() { this.gate('pull'); return { children: [...this.children.values()], progress: [...this.progress] } }
  async upsertChild(c: ChildRow) { this.gate('upsertChild'); this.children.set(c.id, c) }
  async deleteChild(id: string) { this.gate('deleteChild'); this.children.delete(id) }
  async pushProgress(rows: ProgressRow[]) { this.gate('pushProgress'); this.progress.push(...rows) }
  async pushEvents(rows: AnswerEventRow[]) {
    this.gate('pushEvents')
    if (rows.some(r => this.refuse.has(r.id))) throw new SyncError('violates check constraint', true)
    rows.forEach(r => { if (!this.events.has(r.id)) this.events.set(r.id, r) })
  }
  async pushProgressEvents(rows: ProgressEventRow[]) { this.gate('pushProgressEvents'); this.overrides.push(...rows) }
  async recentEvents(childId: string, limit: number) {
    this.gate('recentEvents')
    return [...this.events.values()].filter(e => e.child_id === childId).slice(-limit)
  }
}

const memoryStore = (): SyncStore & { saved: SyncState | null } => ({
  saved: null,
  load() { return this.saved },
  save(s) { this.saved = JSON.parse(JSON.stringify(s)) },
})

describe('SyncEngine', () => {
  let remote: FakeRemote
  let store: ReturnType<typeof memoryStore>
  let engine: SyncEngine
  let kid: Profile

  beforeEach(async () => {
    remote = new FakeRemote()
    store = memoryStore()
    engine = new SyncEngine(remote, store)
    engine.setUser('user-1')
    kid = await engine.upload(recordAnswer(createProfile('Vos'), ROOT, true), [])
  })

  it('upload creates the child, pushes its progress and links it', () => {
    expect(remote.children.get(kid.id)?.name).toBe('Vos')
    expect(remote.progress.some(r => r.child_id === kid.id && r.skill_id === ROOT && r.score === 1)).toBe(true)
    expect(engine.isLinked(kid.id)).toBe(true)
  })

  it('upload sends the stored history once, even when repeated', async () => {
    const other = createProfile('Das')
    const history = [record(other.id), record(other.id, { id: undefined, appVersion: undefined, timestamp: 5 })]
    await engine.upload(other, history)
    await engine.upload(other, history)
    expect([...remote.events.values()].filter(e => e.child_id === other.id)).toHaveLength(2)
    expect(engine.getView().pending).toBe(0)
  })

  it('queues answers of linked profiles only, and uploads them on push', async () => {
    engine.onAnswer(record(kid.id))
    engine.onAnswer(record('not-linked'))
    expect(engine.getView().pending).toBe(1)
    await engine.push([kid])
    expect(remote.events.size).toBe(1)
    expect(engine.getView().pending).toBe(0)
  })

  it('keeps everything queued when offline, and survives a reload', async () => {
    remote.fail = 'offline'
    engine.onAnswer(record(kid.id))
    await expect(engine.push([kid])).rejects.toThrow()
    expect(engine.getView()).toMatchObject({ phase: 'error', pending: 1 })

    const reloaded = new SyncEngine(remote, store)
    reloaded.setUser('user-1')
    remote.fail = null
    await reloaded.push([kid])
    expect(remote.events.size).toBe(1)
    expect(reloaded.getView()).toMatchObject({ phase: 'idle', pending: 0, error: null })
  })

  it('drops only the rows the server refuses, the rest still arrives', async () => {
    const good1 = record(kid.id), bad = record(kid.id), good2 = record(kid.id)
    remote.refuse.add(bad.id!)
    ;[good1, bad, good2].forEach(r => engine.onAnswer(r))
    await engine.push([kid])
    expect([...remote.events.keys()].sort()).toEqual([good1.id, good2.id].sort())
    expect(engine.getView().pending).toBe(0)
  })

  it('pushes progress only when it changed since the last push', async () => {
    await engine.push([kid])
    const before = remote.calls.filter(c => c === 'pushProgress').length
    await engine.push([kid])
    expect(remote.calls.filter(c => c === 'pushProgress').length).toBe(before)

    const played = stampChanges(kid, recordAnswer(kid, ROOT, true), Date.now() + 10)
    await engine.push([played])
    expect(remote.calls.filter(c => c === 'pushProgress').length).toBe(before + 1)
    expect(remote.progress[remote.progress.length - 1]).toMatchObject({ skill_id: ROOT, score: 2 })
  })

  it('caps the offline queue, dropping the oldest', async () => {
    // A store that doesn't copy: the deep-copying test store makes 2000 saves slow.
    const quick = new SyncEngine(remote, { load: () => null, save: () => {} })
    quick.setUser('user-1')
    await quick.pull() // links the child that is already in the account
    const first = record(kid.id)
    quick.onAnswer(first)
    for (let i = 0; i < OUTBOX_CAP + 4; i++) quick.onAnswer(record(kid.id))
    expect(quick.getView().pending).toBe(OUTBOX_CAP)
    await quick.push([])
    expect(remote.events.has(first.id!)).toBe(false)
  })

  it('pull links account children and unlinks profiles deleted elsewhere', async () => {
    const elsewhere: ChildRow = { id: crypto.randomUUID(), name: 'Uil', createdAt: 1 }
    remote.children.set(elsewhere.id, elsewhere)
    remote.children.delete(kid.id)
    engine.onAnswer(record(kid.id))
    await engine.pull()
    expect(engine.isLinked(elsewhere.id)).toBe(true)
    expect(engine.isLinked(kid.id)).toBe(false)
    expect(engine.getView().pending).toBe(0) // its queue could never be accepted
  })

  it('deleteChild removes the child from the account and unlinks it', async () => {
    engine.onAnswer(record(kid.id))
    await engine.deleteChild(kid.id)
    expect(remote.children.has(kid.id)).toBe(false)
    expect(engine.isLinked(kid.id)).toBe(false)
    expect(engine.getView().pending).toBe(0)
  })

  it('a different account starts clean; signing out keeps the queue', () => {
    engine.onAnswer(record(kid.id))
    engine.setUser(null)
    expect(engine.getView()).toMatchObject({ signedIn: false, pending: 1 })
    engine.setUser('user-2')
    expect(engine.getView()).toMatchObject({ signedIn: true, pending: 0, linked: [] })
  })

  it('refuses network work when signed out, without touching the remote', async () => {
    engine.setUser(null)
    remote.calls = []
    await expect(engine.push([kid])).rejects.toThrow()
    expect(remote.calls).toEqual([])
  })

  it('without a backend it is inert', async () => {
    const local = new SyncEngine(null, memoryStore())
    expect(local.available).toBe(false)
    local.onAnswer(record(kid.id))
    expect(local.getView().pending).toBe(0)
  })

  it('seeds a new device with the recent history as lean records', async () => {
    engine.onAnswer(record(kid.id))
    await engine.push([kid])
    const seeded = await engine.seedRecords(kid.id)
    expect(seeded).toHaveLength(1)
    expect(seeded[0]).toMatchObject({ profileId: kid.id, skillId: ROOT, correct: false })
  })
})
