import { UNLOCK_THRESHOLD } from './scoring'
import type { SkillDefinition } from '../curriculum/types'
import type { Profile } from '../state/types'

// Returns the set of skill ids that should now be unlocked given the current
// profile state. A skill unlocks when ALL of its `unlockedBy` prerequisites
// are unlocked AND have a score ≥ UNLOCK_THRESHOLD. Empty `unlockedBy`
// means the skill is a root and unlocks immediately.
//
// Archived skills still count as unlocked for prerequisite purposes — the
// learning happened, the rotation just dropped the skill.
export function evaluateUnlocks(profile: Profile, skills: SkillDefinition[]): string[] {
  const newlyUnlocked: string[] = []

  for (const skill of skills) {
    const state = profile.skills[skill.id]
    if (state?.unlocked) continue

    const allMet = skill.unlockedBy.length === 0 || skill.unlockedBy.every(prereqId => {
      const prereq = profile.skills[prereqId]
      return prereq?.unlocked && prereq.score >= UNLOCK_THRESHOLD
    })

    if (allMet) newlyUnlocked.push(skill.id)
  }

  return newlyUnlocked
}
