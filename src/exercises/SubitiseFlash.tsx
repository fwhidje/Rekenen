import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but NOT
// imported in index.ts — it never registers and the selector skips it. See
// CLAUDE.md → Blueprint. TODO: build generateMeta + Component (timed flash).

const TIERS: ExerciseTier[] = [
  { id: 'choice', minScore: 0,  label: 'kiezen',   description: 'Kid taps "Klaar?" to start. Pattern flashes for ~1 second then hides. Kid picks the numeral from 4 options. One retry button available — replays the same pattern, never a fresh one; retry-used is logged.' },
  { id: 'typed',  minScore: 60, label: 'intikken', description: 'Same flash mechanic, but kid types on the numpad. Retry still available.' },
]

interface SubitiseFlashMeta {
  tierId: string
}

function SubitiseFlashComponent(_props: ExerciseComponentProps<SubitiseFlashMeta>) {
  return <div>TODO: subitise-flash</div>
}

const SubitiseFlash: ExerciseDefinition<SubitiseFlashMeta> = {
  id: 'subitise-flash',
  label: 'Vlug kijken',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Forces conceptual subitising — the pattern is visible too briefly to count, so the kid either sees the structure or guesses. The diagnostic test for whether the recognise exercises are being passed by subitising or by quiet counting.',
    pitfalls: [
      'Uses the retry every time and counts on the second view — works around the diagnostic. Detectable: retry-used is logged on the answer record.',
      'Locks onto a partial read (saw the row-of-5, didn\'t register the +n) and answers with the partial number.',
      'Panics at the flash and taps a random option without trying. Distinguishable by very short time-to-answer.',
    ],
    progression: 'choice (constrained options, retry available) → typed (numpad, retry still available). Scaffolding fade is via answer mode, not via the flash itself — flash duration stays ~1 second throughout. That\'s the whole point of the exercise.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: SubitiseFlashComponent,
}

registerExercise(SubitiseFlash)
