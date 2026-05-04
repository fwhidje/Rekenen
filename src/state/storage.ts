import type { AppState, Profile, SkillState } from './types'
import { SKILLS, ROOT_SKILL_IDS } from '../curriculum/skills'
import { UNLOCK_GRAPH } from '../curriculum/unlockGraph'
import { UNLOCK_THRESHOLD } from '../engine/scoring'

const STORAGE_KEY = 'rekenen_v2'

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultSkillStates(): Record<string, SkillState> {
  const states: Record<string, SkillState> = {}
  for (const skill of SKILLS) {
    states[skill.id] = {
      score: 0,
      unlocked: ROOT_SKILL_IDS.includes(skill.id),
    }
  }
  return states
}

export function createProfile(name: string): Profile {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    skills: defaultSkillStates(),
  }
}

function defaultAppState(): AppState {
  return { profiles: [], activeProfileId: null }
}

// ─── Load / save ──────────────────────────────────────────────────────────────

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppState()
    return JSON.parse(raw) as AppState
  } catch {
    return defaultAppState()
  }
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

export function updateSkillScore(
  profile: Profile,
  skillId: string,
  correct: boolean,
  applyCorrect: (s: number) => number,
  applyWrong: (s: number) => number,
): Profile {
  const current = profile.skills[skillId] ?? { score: 0, unlocked: false }
  const newScore = correct ? applyCorrect(current.score) : applyWrong(current.score)

  const updatedSkills: Record<string, SkillState> = {
    ...profile.skills,
    [skillId]: { ...current, score: newScore },
  }

  // Unlock successors if threshold reached
  if (newScore >= UNLOCK_THRESHOLD) {
    const successors = UNLOCK_GRAPH[skillId] ?? []
    for (const sId of successors) {
      if (!updatedSkills[sId]?.unlocked) {
        updatedSkills[sId] = { ...(updatedSkills[sId] ?? { score: 0 }), unlocked: true, unlockedAt: Date.now() }
      }
    }
  }

  return { ...profile, skills: updatedSkills }
}
