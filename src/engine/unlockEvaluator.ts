import type { SkillDefinition } from '../curriculum/types'
import type { Profile } from '../state/types'
import type { AnswerRecord } from './diagnostics'
import { meetsMilestone } from './mastery'

// Returns the set of skill ids that should now be unlocked given the current
// profile state. A skill unlocks when ALL of its `unlockedBy` prerequisites
// are unlocked AND mastered at the 'par' milestone (family-width predicate
// over the answer stream — see mastery.ts). Empty `unlockedBy` means the
// skill is a root and unlocks immediately.
//
// Archived prerequisites count as satisfied without a milestone check: they
// capped the scalar at 100 and left rotation, so they can no longer produce
// records — and for profiles that predate record persistence, the evidence
// never existed. The learning happened; the rotation just dropped the skill.
export function evaluateUnlocks(
  profile: Profile,
  skills: SkillDefinition[],
  records: AnswerRecord[],
): string[] {
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
      if (!prereq?.unlocked) return false
      return prereq.archived || meetsMilestone(records, prereqDef, 'par')
    })

    if (allMet) newlyUnlocked.push(skill.id)
  }

  return newlyUnlocked
}
