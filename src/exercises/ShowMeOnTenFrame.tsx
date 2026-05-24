import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but NOT
// imported in index.ts — it never registers and the selector skips it. See
// CLAUDE.md → Blueprint. TODO: build generateMeta + Component (tap-to-fill frame).

const TIERS: ExerciseTier[] = [
  { id: 'fill', minScore: 0, label: 'invullen', description: 'Target numeral shown. Kid taps cells of an empty ten-frame to fill exactly N. Cells toggle so an overshoot can be corrected. Single tier; the 5/10 structure of the frame is the built-in scaffold.' },
]

interface ShowMeOnTenFrameMeta {
  tierId: string
}

function ShowMeOnTenFrameComponent(_props: ExerciseComponentProps<ShowMeOnTenFrameMeta>) {
  return <div>TODO: show-me-on-ten-frame</div>
}

const ShowMeOnTenFrame: ExerciseDefinition<ShowMeOnTenFrameMeta> = {
  id: 'show-me-on-ten-frame',
  label: 'Toon op de tienveld',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Reverse of ten-frame-show. From a target numeral, produce the quantity on a 5/10-structured frame. Forces active engagement with the 5-structure rather than passive reading.',
    pitfalls: [
      'Fills cells randomly — the task gets done but the 5/10 structure isn\'t used. Diagnostic: order of fills tells you whether the row-of-5 was the kid\'s anchor.',
      'Counts one-by-one as they tap, watching the running count, stopping when it matches — no chunked thinking.',
      'Overshoots and un-taps — counting by ones with poor running-total tracking.',
    ],
    progression: 'Single tier; difficulty scales with N. The 5/10 structure of the ten-frame is the built-in scaffold.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: ShowMeOnTenFrameComponent,
}

registerExercise(ShowMeOnTenFrame)
