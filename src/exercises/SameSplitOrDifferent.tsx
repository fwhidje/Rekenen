import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but with NO
// program reference: not in the EX map, not in any skill's applicableExercises,
// not imported in index.ts. A pure design artifact. See CLAUDE.md → Parked.
// TODO: build generateMeta + Component (compare two splits, ja/nee).

const TIERS: ExerciseTier[] = [
  { id: 'aligned',   minScore: 0,  label: 'zelfde stijl', description: 'Two visual splits side by side in matching representation styles (both die-patterns, similar colour scheme). Order-equivalent cases (2+3 vs 3+2) and genuinely different cases (2+3 vs 1+4) are mixed.' },
  { id: 'cross-rep', minScore: 50, label: 'andere stijl', description: 'Two splits shown in different representations (dots one side, splitshuisje the other; finger pattern vs ten-frame). Tests order-independence across representation as well.' },
]

interface SameSplitOrDifferentMeta {
  tierId: string
}

function SameSplitOrDifferentComponent(_props: ExerciseComponentProps<SameSplitOrDifferentMeta>) {
  return <div>TODO: same-split-or-different</div>
}

const SameSplitOrDifferent: ExerciseDefinition<SameSplitOrDifferentMeta> = {
  id: 'same-split-or-different',
  label: 'Zelfde of anders?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Forces explicit commitment to order-independence — "is this the same split or different?" — instead of letting the kid skate past it by always reading the unknown. Tests the equivalence relation the skill goal claims (2 + 3 = 3 + 2).',
    pitfalls: [
      'Sees different colours or different orientations and says "anders" — equivalence not yet abstracted from surface features.',
      'Sees the same digits in different positions (2-left + 3-right vs 3-left + 2-right) and says "anders" — order-dependence pitfall in its binary form.',
      'At cross-rep tier, defaults to "anders" whenever the representation differs, regardless of whether the split is actually the same.',
    ],
    progression: 'aligned (same representation, equivalence visible from visual similarity) → cross-rep (different representations, equivalence has to be derived through abstraction). Surface similarity falls away as score rises.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: SameSplitOrDifferentComponent,
}

registerExercise(SameSplitOrDifferent)
