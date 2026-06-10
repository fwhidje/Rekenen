import { UNLOCK_THRESHOLD } from './scoring'
import type { SkillDefinition } from '../curriculum/types'
import type { Profile } from '../state/types'

// Returns the set of skill ids that should now be unlocked given the current
// profile state. A skill unlocks when ALL of its `unlockedBy` prerequisites
// are unlocked AND have a score ≥ UNLOCK_THRESHOLD. Empty `unlockedBy`
// means the skill is a root and unlocks immediately.
//
// Archived skills satisfy implicitly — archival requires a capped score (100).
// The dynamic per-exercise weight factor (weightFactors.ts) protects this
// gate from weak-exercise masking: an exercise that keeps producing errors
// recruits more airtime until its misses dominate the score drift, so the
// score cannot cross the threshold while a weakness is live.
export function evaluateUnlocks(profile: Profile, skills: SkillDefinition[]): string[] {
  const newlyUnlocked: string[] = []
  const byId = new Map(skills.map(s => [s.id, s]))

  for (const skill of skills) {
    if (skill.disabled) continue
    const state = profile.skills[skill.id]
    if (state?.unlocked) continue

    const allMet = skill.unlockedBy.length === 0 || skill.unlockedBy.every(prereqId => {
      const prereqDef = byId.get(prereqId)
      if (!prereqDef || prereqDef.disabled) return false
      const prereq = profile.skills[prereqId]
      return prereq?.unlocked && prereq.score >= UNLOCK_THRESHOLD
    })

    if (allMet) newlyUnlocked.push(skill.id)
  }

  return newlyUnlocked
}
