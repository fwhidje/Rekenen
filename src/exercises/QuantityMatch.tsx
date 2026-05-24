import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but NOT
// imported in index.ts — it never registers and the selector skips it. See
// CLAUDE.md → Blueprint. TODO: build generateMeta + Component.

const TIERS: ExerciseTier[] = [
  { id: 'choose', minScore: 0,  label: 'kiezen', description: 'A target quantity shown in one representation; four options shown in different representations (dot pattern, finger pattern, ten-frame, numeral). Kid picks the option with the same quantity.' },
  { id: 'pairs',  minScore: 50, label: 'memory', description: 'Six tiles, three pairs hidden — kid taps to reveal and matches each quantity to its alternate representation. Memory format; raises the working-memory demand.' },
]

interface QuantityMatchMeta {
  tierId: string
}

function QuantityMatchComponent(_props: ExerciseComponentProps<QuantityMatchMeta>) {
  return <div>TODO: quantity-match</div>
}

const QuantityMatch: ExerciseDefinition<QuantityMatchMeta> = {
  id: 'quantity-match',
  label: 'Welke hoort erbij?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Tests transfer across representations directly — the §11 diagnostic ("a kid who can read 3 from dots but freezes on a finger pattern has the concept but not the abstraction"). The only exercise that exercises this transfer as its central thing.',
    pitfalls: [
      'Surface-level visual matching — picks the option that looks similar (round shapes, similar colour) regardless of count.',
      'Counts the target, then counts every option until something matches — doesn\'t use the structure of either side.',
      'Stuck at one representation — can read the dot pattern but freezes on the finger-pattern option.',
    ],
    progression: 'choose (single-shot, all options visible) → pairs (memory game, holding multiple representations in working memory at once). Cognitive demand shifts from match-now to match-with-recall.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: QuantityMatchComponent,
}

registerExercise(QuantityMatch)
