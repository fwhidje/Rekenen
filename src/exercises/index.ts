// Import all exercise modules to trigger their registerExercise() calls.
// Add new exercise types here — that's the only registration needed.
import './CountAndTap'
import './DotPatternRecognise'
import './FingerPatternRecognise'
import './NumberlinePlace'
import './CompareMoreLess'
import './TenFrameShow'
import './DotPatternDecompose'
import './SplitsFrame'
import './SplitsHerkenHuisje'
import './FillVisual'
import './FillPlain'
import './Choice'
import './TrueFalse'
import './CollectTap'
import './CollectCounter'
import './NumberLine'
import './NumberSequenceOrder'
import './ShowMeOnTenFrame'
import './NumberlineRead'
import './QuantityMatch'
import './SubitiseFlash'
import './SameSplitOrDifferent'
import './SplitsMatch'
import './SplitsShuffle'
import './SplitsBuildIt'

// Runs after every registerExercise() above (module execution order follows
// import order): warns in dev when the curriculum lists disagree.
import '../curriculum/validate'

export { getExercise, getAllExerciseIds } from './registry'
export type { ExerciseDefinition, ExerciseQuestion, ExerciseComponentProps } from './types'
