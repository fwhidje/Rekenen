import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but with NO
// program reference: not in the EX map, not in any skill's applicableExercises,
// not imported in index.ts. A pure design artifact. See CLAUDE.md → Parked.
// TODO: build generateMeta + Component (animated regroup, conservation check).

const TIERS: ExerciseTier[] = [
  { id: 'confirm-total', minScore: 0,  label: 'nog steeds?', description: 'Structured total appears (e.g. 5 dots arranged as 1+4). Dots animate — slide, regroup — into a different split (e.g. 2+3) and settle. Kid taps ja / nee to "is het nog steeds 5?". Conservation check only.' },
  { id: 'identify-new',  minScore: 50, label: 'welke nu?',   description: 'Same animation, different question — "wat is de splitsing nu?" — kid picks the new split from choice tiles. Tracks both that the total stayed the same and what the new split is.' },
]

interface SplitsShuffleMeta {
  tierId: string
}

function SplitsShuffleComponent(_props: ExerciseComponentProps<SplitsShuffleMeta>) {
  return <div>TODO: splits-shuffle</div>
}

const SplitsShuffle: ExerciseDefinition<SplitsShuffleMeta> = {
  id: 'splits-shuffle',
  label: 'De stippen verhuizen',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Conservation under rearrangement — even though parts physically moved, the total didn\'t. The cognitive move is trust in the whole through change. Animation-driven; the medium is doing didactic work paper can\'t.',
    pitfalls: [
      'Says "nee, niet meer 5" because the arrangement looks different — conservation not yet stable.',
      'Recounts from 1 after the animation instead of trusting the move — the rearrangement was watched, not internalised.',
      'At identify-new, picks a split that\'s near the right one but wrong (e.g. 3+2 when it\'s 2+3 if order is tracked, or an adjacent split) — followed the motion partway, not all the way through.',
    ],
    progression: 'confirm-total (binary check on conservation only) → identify-new (track conservation and read the new split — two cognitive moves at once).',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: SplitsShuffleComponent,
}

registerExercise(SplitsShuffle)
