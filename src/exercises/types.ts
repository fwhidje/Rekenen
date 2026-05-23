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

// ─── Answer detail ─────────────────────────────────────────────────────────
// Optional richer signal an exercise may pass up alongside correct/wrong, so
// the diagnostics layer can classify the answer. Everything is optional —
// exercises report what they cheaply know; the rest stays undefined.
export interface AnswerDetail {
  givenAnswer?: number   // the value the child chose / typed
  tapCount?: number      // multi-step exercises (counter / collect)
}

// ─── Component contract ───────────────────────────────────────────────────────

export interface ExerciseComponentProps<Meta = Record<string, unknown>> {
  question: ExerciseQuestion<Meta>
  onResolve: (correct: boolean, detail?: AnswerDetail) => void
  disabled: boolean
  scene?: ExerciseScene
}

// ─── Tier ─────────────────────────────────────────────────────────────────────
// A scaffolding level within an exercise. Tiers are declared data, not buried
// in a pickStage() function, so thresholds live in one place, the progression
// is self-documenting (each tier states what scaffolding it provides), and the
// active tier can be logged for diagnostics. `pickTier` (tiers.ts) selects the
// highest tier whose minScore <= score. Counts and thresholds are bespoke per
// exercise — there is no expectation of uniformity.
export interface ExerciseTier {
  id: string           // stable id, logged in diagnostics, e.g. 'die-die'
  label: string        // short human label for debug views
  minScore: number     // inclusive lower bound
  description: string  // didactical: what scaffolding this tier provides
}

// ─── Exercise didactics ─────────────────────────────────────────────────────
// Structured pedagogical context for the exercise type itself. Co-located with
// the component so it stays honest. 'TODO' stubs are acceptable placeholders,
// but the field must be present. See CLAUDE.md → Blueprint.
export interface ExerciseDidactics {
  goal: string         // what this exercise teaches / trains
  pitfalls: string[]   // common errors or misreads this exercise risks
  progression: string  // how the tiers scaffold concrete → abstract, and why
}

// ─── Definition ───────────────────────────────────────────────────────────────
// An ExerciseDefinition is the static description of one exercise type.
// It knows how to generate its question metadata and which component renders it.
// The engine only ever touches this interface — never the internals.

export interface ExerciseDefinition<Meta = Record<string, unknown>> {
  id: string
  label: string  // Dutch, shown in parent/debug views

  supportsReveal: boolean

  tiers: ExerciseTier[]
  didactics: ExerciseDidactics

  generateMeta(operandA: number, operandB: number, score: number): Meta

  // Optional guard: if provided, the selector will skip this exercise when
  // the generated (a, b) pair doesn't satisfy it. Use to exclude degenerate
  // inputs (e.g. zero-splits for frame-based exercises).
  isCompatible?: (a: number, b: number) => boolean

  Component: ComponentType<ExerciseComponentProps<Meta>>
}
