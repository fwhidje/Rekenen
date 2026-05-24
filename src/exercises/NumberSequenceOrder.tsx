import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but NOT
// imported in index.ts — it never registers and the selector skips it (same
// parking convention as rekenrek-show). See CLAUDE.md → Blueprint.
// TODO: build generateMeta + Component (drag numerals onto a strip).

const TIERS: ExerciseTier[] = [
  { id: 'shuffle',  minScore: 0,  label: 'door elkaar', description: 'Several numerals shuffled — kid drags each into its position on a strip from low to high.' },
  { id: 'gap-fill', minScore: 50, label: 'gaten',       description: 'Sequence shown with one or two gaps; kid drags only the missing numerals into their slots — forces predecessor / successor reasoning rather than visual sorting.' },
]

interface NumberSequenceOrderMeta {
  tierId: string
}

function NumberSequenceOrderComponent(_props: ExerciseComponentProps<NumberSequenceOrderMeta>) {
  return <div>TODO: number-sequence-order</div>
}

const NumberSequenceOrder: ExerciseDefinition<NumberSequenceOrderMeta> = {
  id: 'number-sequence-order',
  label: 'Zet de getallen op rij',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Tests stable number-word order (a telprincipe) and the successor / predecessor relation (buurgetallen). Works with numerals as ordered entities, not isolated symbols.',
    pitfalls: [
      'Brute visual sorting at the shuffle tier — arranges by token shape rather than by quantity-meaning.',
      'At gap-fill tier with no neighbouring labels, lacks an anchor and falls back to guessing.',
      'Reads the strip but can\'t decide whether 4 or 6 goes between 5 and 7 — written numerals not linked to quantities.',
    ],
    progression: 'shuffle (full sequence visible, visual sort task) → gap-fill (sparse, neighbours-only anchors). Visual sorting at low score grows into successor / predecessor reasoning at higher score.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: NumberSequenceOrderComponent,
}

registerExercise(NumberSequenceOrder)
