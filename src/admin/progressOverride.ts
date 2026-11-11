import type { SkillDefinition } from '../curriculum/types'
import type { Profile, SkillState } from '../state/types'
import { SKILLS } from '../curriculum/skills'
import { UNLOCK_THRESHOLD } from '../engine/scoring'
import { applyEvaluations } from '../state/storage'

// ─── Progress override (admin tool) ───────────────────────────────────────────
// Lets a parent put a child's profile at a chosen point in the skill tree —
// recovery after lost localStorage, or starting a child who is already ahead.
// Deliberately outside the engine: this module reads the curriculum graph and
// reuses the storage cascade, but nothing in engine/ or the play loop imports it.
//
// Two actions on a skill T (see CLAUDE.md → Progress override):
//
//   'open'      T → unlocked, score 0 (un-archived). The child starts T fresh.
//               Direct prereqs (T.unlockedBy) → 60, deeper ancestors → 90.
//   'mastered'  T → 90. Every ancestor → 90.
//
// Prereq scores are RAISE-ONLY (max(current, rule)): the tool never takes away
// progress the child earned on a prerequisite. Only an 'open' target can go
// down (that is the point of 'open'); the preview shows that drop in red.
//
// After writing, the normal unlock + archive cascade runs (applyEvaluations),
// so siblings whose prereqs are now met open at their current score — the
// engine's own rule, intended. 90 < SCORE_MAX, so nothing written here
// archives directly; prereqs finish (and archive) after ~10 correct answers.

export type OverrideMode = 'open' | 'mastered'

export const OPEN_TARGET_SCORE = 0
export const DIRECT_PREREQ_SCORE = UNLOCK_THRESHOLD  // 60 — basic mastery, keeps deepening in rotation
export const DEEP_PREREQ_SCORE = 90                  // nearly done, caps at 100 quickly
export const MASTERED_SCORE = 90

// 'target'  — the skill acted on
// 'direct'  — in target.unlockedBy
// 'deeper'  — further ancestor
// 'cascade' — not written by the rule; changed by the unlock/archive pass
export type ChangeRole = 'target' | 'direct' | 'deeper' | 'cascade'

export interface SkillChange {
  skillId: string
  role: ChangeRole
  before: SkillState
  after: SkillState
}

export interface OverridePlan {
  skillId: string
  mode: OverrideMode
  profile: Profile          // the profile after applying — hand this to storage
  changes: SkillChange[]    // only skills whose score / unlocked / archived differ
}

// Ancestors of a skill split into direct prereqs and the rest. If a skill is
// both (a direct prereq that is also an ancestor of another prereq — absent
// from today's graph), it counts as direct.
export function prerequisites(
  skillId: string,
  skills: SkillDefinition[] = SKILLS,
): { direct: string[]; deeper: string[] } {
  const byId = new Map(skills.map(s => [s.id, s]))
  const direct = [...(byId.get(skillId)?.unlockedBy ?? [])]
  const all = new Set<string>()
  const walk = (id: string) => {
    for (const p of byId.get(id)?.unlockedBy ?? []) {
      if (all.has(p)) continue
      all.add(p)
      walk(p)
    }
  }
  walk(skillId)
  const directSet = new Set(direct)
  return { direct, deeper: [...all].filter(id => !directSet.has(id)) }
}

// The disabled skills (the target itself or an ancestor) that keep this skill
// from ever being reachable. Non-empty → the skill cannot be overridden: the
// engine would never serve it nor let it satisfy downstream prereqs.
export function blockedBy(skillId: string, skills: SkillDefinition[] = SKILLS): string[] {
  const byId = new Map(skills.map(s => [s.id, s]))
  const { direct, deeper } = prerequisites(skillId, skills)
  return [skillId, ...direct, ...deeper].filter(id => byId.get(id)?.disabled)
}

export function canOverride(skillId: string, skills: SkillDefinition[] = SKILLS): boolean {
  return skills.some(s => s.id === skillId) && blockedBy(skillId, skills).length === 0
}

const EMPTY: SkillState = { score: 0, unlocked: false, archived: false }

function differs(a: SkillState, b: SkillState): boolean {
  return a.score !== b.score || a.unlocked !== b.unlocked || a.archived !== b.archived
}

function raiseTo(state: SkillState, score: number, now: number): SkillState {
  return {
    ...state,
    score: Math.max(state.score, score),
    unlocked: true,
    unlockedAt: state.unlocked ? state.unlockedAt : now,
  }
}

// Pure: computes the resulting profile and the per-skill diff without saving.
// The UI shows `changes` as the preview and saves `profile` on confirm.
// Runs over the real curriculum, like the cascade it reuses.
export function planOverride(
  profile: Profile,
  skillId: string,
  mode: OverrideMode,
  now: number = Date.now(),
): OverridePlan {
  if (!canOverride(skillId)) {
    throw new Error(`progressOverride: '${skillId}' is disabled or behind a disabled prerequisite`)
  }

  const { direct, deeper } = prerequisites(skillId)
  const roles = new Map<string, ChangeRole>()
  roles.set(skillId, 'target')
  for (const id of direct) roles.set(id, 'direct')
  for (const id of deeper) roles.set(id, 'deeper')

  const next: Record<string, SkillState> = { ...profile.skills }
  const get = (id: string) => next[id] ?? EMPTY

  // Ancestors first. Raise-only, so an archived prereq (score 100) stays archived.
  const directScore = mode === 'open' ? DIRECT_PREREQ_SCORE : MASTERED_SCORE
  for (const id of direct) next[id] = raiseTo(get(id), directScore, now)
  for (const id of deeper) next[id] = raiseTo(get(id), DEEP_PREREQ_SCORE, now)

  // Target.
  const t = get(skillId)
  if (mode === 'open') {
    const { archivedAt: _dropped, ...rest } = t
    next[skillId] = {
      ...rest,
      score: OPEN_TARGET_SCORE,
      unlocked: true,
      archived: false,
      unlockedAt: t.unlocked ? t.unlockedAt : now,
    }
  } else {
    next[skillId] = raiseTo(t, MASTERED_SCORE, now)
  }

  const after = applyEvaluations({ ...profile, skills: next })

  const ids = new Set([...Object.keys(profile.skills), ...Object.keys(after.skills)])
  const changes: SkillChange[] = []
  for (const id of ids) {
    const before = profile.skills[id] ?? EMPTY
    const afterState = after.skills[id] ?? EMPTY
    if (!differs(before, afterState)) continue
    changes.push({ skillId: id, role: roles.get(id) ?? 'cascade', before, after: afterState })
  }
  const order: ChangeRole[] = ['target', 'direct', 'deeper', 'cascade']
  changes.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role))

  return { skillId, mode, profile: after, changes }
}
