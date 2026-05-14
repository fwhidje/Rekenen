import type { ComponentType } from 'react'
import type { Operation } from '../curriculum/types'
import type { ExerciseScene } from '../presentation/themes'

export type { ExerciseScene }

// ─── Question ────────────────────────────────────────────────────────────────

export interface ExerciseQuestion<Meta = Record<string, unknown>> {
  exerciseId: string
  skillId: string
  operandA: number
  operandB: number
  op: Operation
  answer: number
  meta: Meta
}

// ─── Component contract ───────────────────────────────────────────────────────

export interface ExerciseComponentProps<Meta = Record<string, unknown>> {
  question: ExerciseQuestion<Meta>
  onResolve: (correct: boolean) => void
  disabled: boolean
  scene?: ExerciseScene
}

// ─── Definition ───────────────────────────────────────────────────────────────
// An ExerciseDefinition is the static description of one exercise type.
// It knows how to generate its question metadata and which component renders it.
// The engine only ever touches this interface — never the internals.

export interface ExerciseDefinition<Meta = Record<string, unknown>> {
  id: string
  label: string  // Dutch, shown in parent/debug views

  // Does this exercise type support a sequential reveal animation?
  // If true, the exercise component is responsible for implementing it.
  supportsReveal: boolean

  // Build the exercise-specific metadata from the skill's operands and current score.
  // `score` is 0–50; use it to vary within-type difficulty (e.g. dot vs scene visual).
  generateMeta(operandA: number, operandB: number, score: number): Meta

  // The component that renders this exercise.
  // Use React.ComponentType so it works with both function and class components.
  Component: ComponentType<ExerciseComponentProps<Meta>>
}
