import { UNLOCK_THRESHOLD } from './scoring'
import type { UnlockGraph } from '../curriculum/types'
import type { Profile } from '../state/types'

// Returns the set of skill ids that should now be unlocked given the current
// profile state and the unlock graph. Handles first-unlock initialization.
export function evaluateUnlocks(
  profile: Profile,
  graph: UnlockGraph,
  rootSkillIds: string[],
): string[] {
  const toUnlock: string[] = []

  // Root skills are always unlocked
  for (const id of rootSkillIds) {
    if (!profile.skills[id]?.unlocked) toUnlock.push(id)
  }

  // Walk graph: if a skill is unlocked and at threshold, unlock its successors
  for (const [skillId, successors] of Object.entries(graph)) {
    const state = profile.skills[skillId]
    if (!state?.unlocked) continue
    if (state.score < UNLOCK_THRESHOLD) continue
    for (const successor of successors) {
      if (!profile.skills[successor]?.unlocked) toUnlock.push(successor)
    }
  }

  return toUnlock
}
