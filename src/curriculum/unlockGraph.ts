import type { UnlockGraph } from './types'

// Each key unlocks the listed skill ids once it reaches UNLOCK_THRESHOLD.
// Unlocks are one-way — a falling score never re-locks a downstream skill.

export const UNLOCK_GRAPH: UnlockGraph = {
  'add_1_2_within_5':  ['add_3_4_within_5', 'add_1_2_within_10'],
  'add_3_4_within_5':  ['add_3_4_within_10'],
  'add_1_2_within_10': ['add_3_4_within_10'],
  'add_3_4_within_10': ['add_5_within_10'],
  'add_5_within_10':   ['add_any_within_10'],
  'add_any_within_10': [],
}
