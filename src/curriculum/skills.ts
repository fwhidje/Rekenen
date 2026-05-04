import type { SkillDefinition } from './types'

// Placeholder skill graph — 6 addition skills, roughly progressive.
// This will be expanded as the curriculum design is finalised.
// Adding a new skill = add an entry here and wire it in unlockGraph.ts.

export const SKILLS: SkillDefinition[] = [
  { id: 'add_1_2_within_5',  label: '+1/+2 binnen 5',  minA: 1, maxA: 3, minB: 1, maxB: 2, maxSum: 5  },
  { id: 'add_3_4_within_5',  label: '+3/+4 binnen 5',  minA: 1, maxA: 2, minB: 3, maxB: 4, maxSum: 5  },
  { id: 'add_1_2_within_10', label: '+1/+2 binnen 10', minA: 1, maxA: 8, minB: 1, maxB: 2, maxSum: 10 },
  { id: 'add_3_4_within_10', label: '+3/+4 binnen 10', minA: 1, maxA: 7, minB: 3, maxB: 4, maxSum: 10 },
  { id: 'add_5_within_10',   label: '+5 binnen 10',    minA: 1, maxA: 5, minB: 5, maxB: 5, maxSum: 10 },
  { id: 'add_any_within_10', label: 'Optellen t/m 10', minA: 1, maxA: 9, minB: 1, maxB: 9, maxSum: 10 },
]

export const ROOT_SKILL_IDS: string[] = ['add_1_2_within_5']

export const SKILLS_BY_ID: Record<string, SkillDefinition> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
)
