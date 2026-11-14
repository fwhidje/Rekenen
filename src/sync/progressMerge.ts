import type { AppState, Profile, SkillState } from '../state/types'
import { createProfile, applyEvaluations } from '../state/storage'
import type { ChildRow, ProgressRow } from './rows'

// ─── Progress merge (pure) ────────────────────────────────────────────────────
// Sync rule: last write wins PER SKILL, by the device time of the change
// (`SkillState.updatedAt`). The server enforces the same rule with a trigger,
// so a stale device can never roll progress back. Events are never merged —
// they are append-only and only ever added.

const sameState = (a: SkillState | undefined, b: SkillState): boolean =>
  !!a && a.score === b.score && a.unlocked === b.unlocked && a.archived === b.archived

// Stamp `updatedAt` on every skill that differs from the previous profile.
// Applied at the single point where the app commits a state change, so every
// path (play, cascade, admin override) is covered without touching the engine.
export function stampChanges(prev: Profile | undefined, next: Profile, now: number): Profile {
  if (!prev || prev === next) return next
  let skills: Record<string, SkillState> | null = null
  for (const [id, state] of Object.entries(next.skills)) {
    if (sameState(prev.skills[id], state)) continue
    skills ??= { ...next.skills }
    skills[id] = { ...state, updatedAt: now }
  }
  return skills ? { ...next, skills } : next
}

export function stampState(prev: AppState, next: AppState, now: number): AppState {
  const before = new Map(prev.profiles.map(p => [p.id, p]))
  let changed = false
  const profiles = next.profiles.map(p => {
    const stamped = stampChanges(before.get(p.id), p, now)
    if (stamped !== p) changed = true
    return stamped
  })
  return changed ? { ...next, profiles } : next
}

// First upload of a profile that predates sync: its progress has no change
// times, so everything that isn't a pristine default is stamped "now".
export function stampAll(profile: Profile, now: number): Profile {
  const skills: Record<string, SkillState> = {}
  for (const [id, s] of Object.entries(profile.skills)) {
    const pristine = s.score === 0 && !s.unlocked && !s.archived
    skills[id] = s.updatedAt !== undefined || pristine ? s : { ...s, updatedAt: now }
  }
  return { ...profile, skills }
}

const iso = (ms: number | undefined): string | null => (ms === undefined ? null : new Date(ms).toISOString())
const ms = (s: string | null): number | undefined => (s === null ? undefined : Date.parse(s))

// Rows for the skills changed after `since` (ms). Unstamped skills never push.
export function progressRows(profile: Profile, since: number): ProgressRow[] {
  const rows: ProgressRow[] = []
  for (const [skillId, s] of Object.entries(profile.skills)) {
    if (s.updatedAt === undefined || s.updatedAt <= since) continue
    rows.push({
      child_id: profile.id,
      skill_id: skillId,
      score: s.score,
      unlocked: s.unlocked,
      archived: s.archived,
      unlocked_at: iso(s.unlockedAt),
      archived_at: iso(s.archivedAt),
      updated_at: new Date(s.updatedAt).toISOString(),
    })
  }
  return rows
}

// Take every remote skill row that is newer than the local state, then re-run
// the unlock/archive cascade (idempotent) so a mixed result is self-consistent.
export function mergeRemoteProgress(profile: Profile, rows: ProgressRow[]): Profile {
  let skills: Record<string, SkillState> | null = null
  for (const row of rows) {
    if (row.child_id !== profile.id) continue
    const local = profile.skills[row.skill_id]
    if (!local) continue // a skill this build doesn't know — leave it on the server
    const remoteAt = Date.parse(row.updated_at)
    if (remoteAt <= (local.updatedAt ?? 0)) continue
    skills ??= { ...profile.skills }
    skills[row.skill_id] = {
      score: row.score,
      unlocked: row.unlocked,
      archived: row.archived,
      unlockedAt: ms(row.unlocked_at),
      archivedAt: ms(row.archived_at),
      updatedAt: remoteAt,
    }
  }
  return skills ? applyEvaluations({ ...profile, skills }) : profile
}

export function profileFromRemote(child: ChildRow, rows: ProgressRow[]): Profile {
  const fresh = createProfile(child.name)
  return mergeRemoteProgress({ ...fresh, id: child.id, createdAt: child.createdAt }, rows)
}

export interface RemoteSnapshot {
  children: ChildRow[]
  progress: ProgressRow[]
}

// Fold what the account holds into the device state: known children get their
// newer progress (and name); children new to this device are added. Profiles
// that exist only on this device are left alone.
export function applySnapshot(state: AppState, snap: RemoteSnapshot): AppState {
  const remote = new Map(snap.children.map(c => [c.id, c]))
  const local = new Set(state.profiles.map(p => p.id))
  let changed = false

  const profiles = state.profiles.map(p => {
    const child = remote.get(p.id)
    if (!child) return p
    let next = mergeRemoteProgress(p, snap.progress)
    if (next.name !== child.name) next = { ...next, name: child.name }
    if (next !== p) changed = true
    return next
  })

  for (const child of snap.children) {
    if (local.has(child.id)) continue
    profiles.push(profileFromRemote(child, snap.progress))
    changed = true
  }

  if (!changed) return state
  return { ...state, profiles, activeProfileId: state.activeProfileId ?? profiles[0]?.id ?? null }
}
