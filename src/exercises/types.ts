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

  supportsReveal: boolean

  generateMeta(operandA: number, operandB: number, score: number): Meta

  // Optional guard: if provided, the selector will skip this exercise when
  // the generated (a, b) pair doesn't satisfy it. Use to exclude degenerate
  // inputs (e.g. zero-splits for frame-based exercises).
  isCompatible?: (a: number, b: number) => boolean

  Component: ComponentType<ExerciseComponentProps<Meta>>
}
