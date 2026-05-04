// Import all exercise modules to trigger their registerExercise() calls.
// Add new exercise types here — that's the only registration needed.
import './FillVisual'
import './FillPlain'
import './Choice'
import './TrueFalse'
import './Collect'
import './NumberLine'

export { getExercise, getAllExerciseIds } from './registry'
export type { ExerciseDefinition, ExerciseQuestion, ExerciseComponentProps } from './types'
