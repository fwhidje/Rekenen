import { SCORE_MAX } from './scoring'
import type { SkillDefinition } from '../curriculum/types'
import type { Profile } from '../state/types'

// Returns the set of skill ids that should now be archived. Archive rule:
//   skill.score == SCORE_MAX
//   AND skill.subsumedBy != null
//   AND profile.skills[skill.subsumedBy].unlocked
//
// Archived skills keep their score but leave rotation. There is no
// auto-resurrection. Skills with subsumedBy === null (typically fact-recall
// drills) are never archived.
export function evaluateSubsumes(profile: Profile, skills: SkillDefinition[]): string[] {
  const toArchive: string[] = []

  for (const skill of skills) {
    if (!skill.subsumedBy) continue
    const state = profile.skills[skill.id]
    if (!state || state.archived) continue
    if (state.score < SCORE_MAX) continue
    const parent = profile.skills[skill.subsumedBy]
    if (parent?.unlocked) toArchive.push(skill.id)
  }

  return toArchive
}
