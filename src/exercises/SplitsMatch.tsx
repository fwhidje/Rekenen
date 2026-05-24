import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but with NO
// program reference: not in the EX map, not in any skill's applicableExercises,
// not imported in index.ts. A pure design artifact. See CLAUDE.md → Parked.
// TODO: build generateMeta + Component (cross-representation match).

const TIERS: ExerciseTier[] = [
  { id: 'choose', minScore: 0,  label: 'kiezen', description: 'Target split in one representation (e.g. colour-coded die-pattern 2+3). Four option tiles in different representations (finger pattern split 2-and-3, ten-frame top-2 bottom-3, splitshuisje "2 | 3", one distractor). Kid picks the match.' },
  { id: 'pairs',  minScore: 50, label: 'memory', description: 'Six tiles, three pairs hidden — kid taps to reveal and matches each split to its cross-representation twin. Memory format; raises working-memory demand.' },
]

interface SplitsMatchMeta {
  tierId: string
}

function SplitsMatchComponent(_props: ExerciseComponentProps<SplitsMatchMeta>) {
  return <div>TODO: splits-match</div>
}

const SplitsMatch: ExerciseDefinition<SplitsMatchMeta> = {
  id: 'splits-match',
  label: 'Welke splitsing past?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Cross-representation matching at the split level — the §11 transfer diagnostic ("a kid who reads a 2+3 split from dots but can\'t recognise it in a splitshuisje has the perception but not the abstraction"). Sibling exercise to quantity-match in getalbegrip, half a step up.',
    pitfalls: [
      'Surface visual matching — picks the option that looks similar (same colours, same shape) regardless of the split.',
      'Matches by total instead of by split — gets the total right but the split wrong, possible when distractors share the total.',
      'Locked into one representation — reads the dot-pattern target but freezes on the finger-pattern option.',
    ],
    progression: 'choose (single-shot, all options visible) → pairs (memory format, holds multiple splits in working memory at once). Cognitive demand shifts from match-now to match-with-recall.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: SplitsMatchComponent,
}

registerExercise(SplitsMatch)
