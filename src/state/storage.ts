import type { AppState, Profile, SkillState } from './types'
import { SKILLS } from '../curriculum/skills'
import { applyCorrect, applyWrong } from '../engine/scoring'
import { evaluateUnlocks } from '../engine/unlockEvaluator'
import { evaluateSubsumes } from '../engine/subsumeEvaluator'
import { diagnostics } from '../engine/diagnostics'

const STORAGE_KEY = 'rekenen_v2'

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultSkillStates(): Record<string, SkillState> {
  const states: Record<string, SkillState> = {}
  for (const skill of SKILLS) {
    states[skill.id] = { score: 0, unlocked: false, archived: false }
  }
  return states
}

export function createProfile(name: string): Profile {
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    skills: defaultSkillStates(),
  }
  // Apply initial unlocks (root skills with empty unlockedBy)
  return applyEvaluations(profile)
}

function defaultAppState(): AppState {
  return { profiles: [], activeProfileId: null }
}

// ─── Load / save ──────────────────────────────────────────────────────────────

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppState()
    const parsed = JSON.parse(raw) as AppState
    return { ...parsed, profiles: parsed.profiles.map(migrateProfile) }
  } catch {
    return defaultAppState()
  }
}

// Migrates an older profile to the current skill set: backfills any missing
// skill states and carries forward score from the pre-split `splitsen-tot-5`
// into `splitsen-herken-5` (recognition is the prereq for the +/- track).
function migrateProfile(profile: Profile): Profile {
  const skills: Record<string, SkillState> = { ...profile.skills }

  const legacy = skills['splitsen-tot-5']
  if (legacy && !skills['splitsen-herken-5']) {
    skills['splitsen-herken-5'] = { ...legacy }
  }

  for (const skill of SKILLS) {
    if (!skills[skill.id]) {
      skills[skill.id] = { score: 0, unlocked: false, archived: false }
    }
  }

  return applyEvaluations({ ...profile, skills })
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ─── Score updates with unlock + subsume cascade ──────────────────────────────

export function recordAnswer(profile: Profile, skillId: string, correct: boolean): Profile {
  const current = profile.skills[skillId]
  if (!current) return profile

  const newScore = correct ? applyCorrect(current.score) : applyWrong(current.score)

  const next: Profile = {
    ...profile,
    skills: {
      ...profile.skills,
      [skillId]: { ...current, score: newScore },
    },
  }

  return applyEvaluations(next)
}

// Walks unlock then subsume evaluators and applies their effects to the profile.
// Done after any score change. Idempotent — safe to call multiple times.
function applyEvaluations(profile: Profile): Profile {
  const now = Date.now()
  let updated = profile

  const unlocks = evaluateUnlocks(updated, SKILLS, diagnostics.getAll(updated.id))
  if (unlocks.length > 0) {
    const newSkills = { ...updated.skills }
    for (const id of unlocks) {
      newSkills[id] = { ...newSkills[id], unlocked: true, unlockedAt: now }
    }
    updated = { ...updated, skills: newSkills }
  }

  const archives = evaluateSubsumes(updated, SKILLS)
  if (archives.length > 0) {
    const newSkills = { ...updated.skills }
    for (const id of archives) {
      newSkills[id] = { ...newSkills[id], archived: true, archivedAt: now }
    }
    updated = { ...updated, skills: newSkills }
  }

  return updated
}
