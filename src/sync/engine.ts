import type { Profile } from '../state/types'
import type { AnswerRecord } from '../engine/diagnostics'
import type { OverridePlan } from '../admin/progressOverride'
import { APP_VERSION } from '../engine/answerRecord'
import { progressRows, stampAll } from './progressMerge'
import type { RemoteSnapshot } from './progressMerge'
import { fromEventRow, toEventRow } from './rows'
import type { AnswerEventRow, ProgressEventRow } from './rows'
import { SyncError } from './remote'
import type { Remote } from './remote'

// ─── Sync engine ──────────────────────────────────────────────────────────────
// Offline-first: localStorage stays the working copy; this engine moves data to
// and from the account when it can. It never blocks or breaks the play loop —
// every failure leaves the data queued locally for the next attempt.
//
// What it holds (persisted, per device):
//   linked     ids of the profiles that live in the account
//   outbox     answer events waiting to upload (full records, incl. meta)
//   overrides  admin-override events waiting to upload
//   pushedAt   per child: the newest progress change already uploaded

export interface SyncState {
  userId: string | null
  linked: string[]
  pushedAt: Record<string, number>
  outbox: AnswerEventRow[]
  overrides: ProgressEventRow[]
  lastSyncAt: number | null
}

export interface SyncStore {
  load(): SyncState | null
  save(state: SyncState): void
}

export interface SyncView {
  signedIn: boolean
  phase: 'idle' | 'syncing' | 'error'
  error: string | null
  pending: number            // events waiting to upload
  lastSyncAt: number | null
  linked: ReadonlyArray<string>
}

const emptyState = (userId: string | null = null): SyncState =>
  ({ userId, linked: [], pushedAt: {}, outbox: [], overrides: [], lastSyncAt: null })

export const OUTBOX_CAP = 2000      // oldest events are dropped beyond this
export const UPLOAD_BATCH = 200
export const SEED_EVENTS = 300      // recent events pulled for a child new to this device

export class SyncEngine {
  private state: SyncState
  private signedIn = false
  private phase: SyncView['phase'] = 'idle'
  private error: string | null = null
  private view: SyncView | null = null
  private listeners = new Set<() => void>()
  private queue: Promise<unknown> = Promise.resolve()

  constructor(private remote: Remote | null, private store: SyncStore) {
    this.state = { ...emptyState(), ...(store.load() ?? {}) }
  }

  get available(): boolean { return this.remote !== null }

  // ── Observation (useSyncExternalStore) ──
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb)
    return () => { this.listeners.delete(cb) }
  }

  getView = (): SyncView => {
    this.view ??= {
      signedIn: this.signedIn,
      phase: this.phase,
      error: this.error,
      pending: this.state.outbox.length,
      lastSyncAt: this.state.lastSyncAt,
      linked: this.state.linked,
    }
    return this.view
  }

  private changed(persist = true): void {
    if (persist) this.persist()
    this.view = null
    this.listeners.forEach(l => l())
  }

  private persist(): void {
    try {
      this.store.save(this.state)
    } catch {
      // Storage full: keep the answers, give up "what was shown" for the backlog.
      this.state.outbox = this.state.outbox.map(e => ({ ...e, meta: null }))
      try { this.store.save(this.state) } catch { /* in memory only */ }
    }
  }

  // ── Account ──
  // A different account on this device starts from a clean slate: the previous
  // account's queue could never be accepted under the new login.
  setUser(userId: string | null): void {
    if (userId && this.state.userId !== userId) this.state = emptyState(userId)
    this.signedIn = userId !== null
    this.error = null
    this.phase = 'idle'
    this.changed()
  }

  isLinked(profileId: string): boolean {
    return this.state.linked.includes(profileId)
  }

  // ── Capture (called from the play loop — synchronous, never throws) ──
  onAnswer(record: AnswerRecord): void {
    if (!this.remote || !this.isLinked(record.profileId)) return
    this.state.outbox.push(toEventRow(record))
    if (this.state.outbox.length > OUTBOX_CAP) this.state.outbox.splice(0, this.state.outbox.length - OUTBOX_CAP)
    this.changed()
  }

  onOverride(plan: OverridePlan, now = Date.now()): void {
    const childId = plan.profile.id
    if (!this.remote || !this.isLinked(childId)) return
    this.state.overrides.push({
      id: crypto.randomUUID(),
      child_id: childId,
      occurred_at: new Date(now).toISOString(),
      app_version: APP_VERSION,
      kind: plan.mode === 'open' ? 'override-open' : 'override-mastered',
      skill_id: plan.skillId,
      detail: plan.changes.map(c => ({
        skill: c.skillId, role: c.role,
        before: { score: c.before.score, unlocked: c.before.unlocked, archived: c.before.archived },
        after: { score: c.after.score, unlocked: c.after.unlocked, archived: c.after.archived },
      })),
    })
    this.changed()
  }

  // ── Network work — serialised, so two triggers never interleave ──
  private run<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      this.phase = 'syncing'
      this.changed(false)
      try {
        const result = await job()
        this.phase = 'idle'
        this.error = null
        return result
      } catch (e) {
        this.phase = 'error'
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.changed()
      }
    })
    this.queue = next.catch(() => {})
    return next
  }

  private ready(): Remote {
    if (!this.remote) throw new SyncError('Synchronisatie is niet ingesteld', true)
    if (!this.signedIn) throw new SyncError('Niet ingelogd', true)
    return this.remote
  }

  // Upload everything waiting: events, override events, changed progress.
  push(profiles: Profile[]): Promise<void> {
    return this.run(async () => {
      const remote = this.ready()
      await this.drain(this.state.outbox, rows => remote.pushEvents(rows))
      await this.drain(this.state.overrides, rows => remote.pushProgressEvents(rows))
      for (const profile of profiles) {
        if (!this.isLinked(profile.id)) continue
        const rows = progressRows(profile, this.state.pushedAt[profile.id] ?? 0)
        if (rows.length === 0) continue
        await remote.pushProgress(rows)
        this.state.pushedAt[profile.id] = Math.max(...rows.map(r => Date.parse(r.updated_at)))
      }
      this.state.lastSyncAt = Date.now()
    })
  }

  // Upload a queue in batches. A batch the server refuses outright is retried
  // row by row, and only the refused rows are dropped — one bad row must not
  // block the queue forever. Network failures keep everything and rethrow.
  private async drain<R extends { id: string }>(queue: R[], send: (rows: R[]) => Promise<void>): Promise<void> {
    while (queue.length > 0) {
      const batch = queue.slice(0, UPLOAD_BATCH)
      const done = new Set<string>()
      try {
        await send(batch)
        batch.forEach(r => done.add(r.id))
      } catch (e) {
        if (!(e instanceof SyncError) || !e.permanent) throw e
        for (const row of batch) {
          try {
            await send([row])
          } catch (inner) {
            if (!(inner instanceof SyncError) || !inner.permanent) throw inner
            console.warn('[sync] dropped a refused row', row.id, inner.message)
          }
          done.add(row.id)
          this.remove(queue, done)
        }
      }
      this.remove(queue, done)
    }
  }

  // Remove by id, in place: new rows may have been queued while we awaited.
  private remove<R extends { id: string }>(queue: R[], ids: Set<string>): void {
    for (let i = queue.length - 1; i >= 0; i--) if (ids.has(queue[i].id)) queue.splice(i, 1)
    this.persist()
  }

  // Read what the account holds and update the link set: account children
  // become linked; a linked profile that is gone from the account (deleted on
  // another device) is unlinked and stays as a device-only profile.
  pull(): Promise<RemoteSnapshot> {
    return this.run(async () => {
      const snap = await this.ready().pull()
      this.state.linked = snap.children.map(c => c.id)
      for (const id of Object.keys(this.state.pushedAt)) {
        if (!this.state.linked.includes(id)) delete this.state.pushedAt[id]
      }
      // What the account already holds needs no re-upload.
      for (const row of snap.progress) {
        const at = Date.parse(row.updated_at)
        if (at > (this.state.pushedAt[row.child_id] ?? 0)) this.state.pushedAt[row.child_id] = at
      }
      this.state.outbox = this.state.outbox.filter(e => this.state.linked.includes(e.child_id))
      this.state.overrides = this.state.overrides.filter(e => this.state.linked.includes(e.child_id))
      this.state.lastSyncAt = Date.now()
      return snap
    })
  }

  // Put a device-only profile into the account, with its stored history.
  // Returns the profile to keep locally (its progress now carries change times).
  upload(profile: Profile, history: AnswerRecord[]): Promise<Profile> {
    return this.run(async () => {
      const remote = this.ready()
      await remote.upsertChild({ id: profile.id, name: profile.name, createdAt: profile.createdAt })
      const stamped = stampAll(profile, Date.now())
      const rows = progressRows(stamped, 0)
      await remote.pushProgress(rows)
      if (!this.isLinked(profile.id)) this.state.linked = [...this.state.linked, profile.id]
      if (rows.length > 0) this.state.pushedAt[profile.id] = Math.max(...rows.map(r => Date.parse(r.updated_at)))
      const queued = new Set(this.state.outbox.map(e => e.id))
      const backlog = history.map(toEventRow).filter(e => !queued.has(e.id))
      this.state.outbox.unshift(...backlog)
      this.persist()
      await this.drain(this.state.outbox, r => remote.pushEvents(r))
      return stamped
    })
  }

  // Remove a child and all its data from the account.
  deleteChild(childId: string): Promise<void> {
    return this.run(async () => {
      await this.ready().deleteChild(childId)
      this.state.linked = this.state.linked.filter(id => id !== childId)
      delete this.state.pushedAt[childId]
      this.state.outbox = this.state.outbox.filter(e => e.child_id !== childId)
      this.state.overrides = this.state.overrides.filter(e => e.child_id !== childId)
    })
  }

  // Recent history of a child that is new to this device.
  seedRecords(childId: string): Promise<AnswerRecord[]> {
    return this.run(async () => (await this.ready().recentEvents(childId, SEED_EVENTS)).map(fromEventRow))
  }
}
