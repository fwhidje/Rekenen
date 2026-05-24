import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but NOT
// imported in index.ts — it never registers and the selector skips it. See
// CLAUDE.md → Blueprint. TODO: build generateMeta + Component.

const TIERS: ExerciseTier[] = [
  { id: 'choice', minScore: 0,  label: 'kiezen',   description: 'Number line with one cell highlighted; kid picks the numeral from a strip of 4 options.' },
  { id: 'typed',  minScore: 50, label: 'intikken', description: 'Same prompt, but kid types the numeral on the numpad — no choice scaffold.' },
]

interface NumberlineReadMeta {
  tierId: string
}

function NumberlineReadComponent(_props: ExerciseComponentProps<NumberlineReadMeta>) {
  return <div>TODO: numberline-read</div>
}

const NumberlineRead: ExerciseDefinition<NumberlineReadMeta> = {
  id: 'numberline-read',
  label: 'Welk getal staat hier?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Reverse of numberline-place: given a position, identify the numeral. Position → numeral direction of the bidirectional fluency claim.',
    pitfalls: [
      'Off-by-one — counts cells from 1 instead of 0 to read the position.',
      'At typed tier, freezes or guesses wildly when the choice strip is no longer there to constrain the answer.',
      'On sparse-label number lines, counts from the wrong anchor.',
    ],
    progression: 'choice (constrained answer set) → typed (full numpad, free production). The standard choice → production scaffolding fade.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: NumberlineReadComponent,
}

registerExercise(NumberlineRead)
