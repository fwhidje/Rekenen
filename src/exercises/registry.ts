import type { ExerciseDefinition } from './types'

// The registry stores type-erased definitions (each exercise is strongly typed
// internally; the registry just needs to call .Component and .generateMeta).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, ExerciseDefinition<any>>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerExercise(def: ExerciseDefinition<any>): void {
  if (registry.has(def.id)) {
    throw new Error(`Exercise "${def.id}" is already registered`)
  }
  registry.set(def.id, def)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getExercise(id: string): ExerciseDefinition<any> {
  const def = registry.get(id)
  if (!def) throw new Error(`Exercise type "${id}" not registered`)
  return def
}

export function getAllExerciseIds(): string[] {
  return [...registry.keys()]
}
