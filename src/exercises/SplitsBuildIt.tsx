import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'

// ─── SKELETON — documentation only, not yet implemented ───────────────────────
// Declared with full didactics + tiers so the design lives in-repo, but with NO
// program reference: not in the EX map, not in any skill's applicableExercises,
// not imported in index.ts. A pure design artifact. See CLAUDE.md → Parked.
// TODO: build generateMeta + Component (swipe-to-cut the total).

const TIERS: ExerciseTier[] = [
  { id: 'open',     minScore: 0,  label: 'vrij',    description: 'Structured total shown as a row of dots, or canonical die-pattern. Kid swipes vertically to cut the visual into two groups; the cut snaps to the nearest valid gap between dots. App shows the resulting split; kid confirms it with a choice tile.' },
  { id: 'targeted', minScore: 50, label: 'gericht',  description: 'Same gesture, with a target — "maak een splitsing waar links 2 is". Kid has to cut at the right place rather than any place. The cut itself commits the answer, no confirmation step.' },
]

interface SplitsBuildItMeta {
  tierId: string
}

function SplitsBuildItComponent(_props: ExerciseComponentProps<SplitsBuildItMeta>) {
  return <div>TODO: splits-build-it</div>
}

const SplitsBuildIt: ExerciseDefinition<SplitsBuildItMeta> = {
  id: 'splits-build-it',
  label: 'Maak je eigen splitsing',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Active perceptual splitting — instead of reading a split that\'s already shown, the kid decides where a split can go. Gesture-driven; the splitting-as-a-thing-the-kid-controls move that no other recognition exercise gets at.',
    pitfalls: [
      'Cuts to leave one side empty (effectively a 0+5, excluded by skill scope) — hasn\'t yet committed to "both parts must have at least one".',
      'At targeted tier, cuts at the wrong gap and produces the right left-count by accident (e.g. by counting from the right side) — logged via the gap-index for diagnosis.',
      'Hovering, false-starts, releases without committing — diagnostic of indecision rather than wrong reasoning.',
    ],
    progression: 'open (any valid split, kid commits and confirms what they made) → targeted (specific split requested, kid has to cut at the right place). Free exploration narrows into guided production.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: SplitsBuildItComponent,
}

registerExercise(SplitsBuildIt)
