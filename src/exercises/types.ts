import type { ComponentType } from 'react'
import type { Operation, Problem } from '../curriculum/types'
import type { ExerciseScene } from '../presentation/themes'

export type { ExerciseScene }

// ─── Question ────────────────────────────────────────────────────────────────
// `problem` carries the named-role shape (whole/part, terms, …) — new
// exercises should read that. operandA/operandB/op are the legacy positional
// view derived from it (engine/answer.ts problemOperands), kept so existing
// components work unchanged.

export interface ExerciseQuestion<Meta = Record<string, unknown>> {
  exerciseId: string
  skillId: string
  problem: Problem
  operandA: number
  operandB: number
  op: Operation
  answer: number
  meta: Meta
  isRetry?: boolean   // re-scaffolded re-presentation of a just-failed problem
}

// ─── Answer detail ─────────────────────────────────────────────────────────
// Optional richer signal an exercise may pass up alongside correct/wrong, so
// the diagnostics layer can classify the answer. Everything is optional —
// exercises report what they cheaply know; the rest stays undefined.
export interface AnswerDetail {
  givenAnswer?: number   // the value the child chose / typed
  tapCount?: number      // multi-step exercises (counter / collect)
  replayCount?: number   // in-exercise replays (e.g. subitise-flash re-shows)
  answerMs?: number      // time-aware exercises: ms from the question being readable to the tap (engine/pace.ts)
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

// ─── Meta context ─────────────────────────────────────────────────────────────
export interface MetaContext<Meta = Record<string, unknown>> {
  // The original question's meta, on a retry (see generateMeta).
  retryOf?: Meta
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

  // `problem` carries the named-role shape for op-generic exercises (variant
  // choice, op-aware trap construction). Optional: operand-only exercises
  // ignore it. The selector passes it on both fresh draws and retries.
  //
  // `ctx.retryOf` is set when the engine re-presents a just-failed question
  // (buildRetry): it carries the ORIGINAL question's meta. An exercise whose
  // meta holds random choices that define WHAT IS ASKED (which part is given,
  // which semantic variant, which picture) must copy those from it, so the
  // retry is the same question with more help — see `retryStable` and
  // CLAUDE.md → Exercise behaviour conventions.
  generateMeta(operandA: number, operandB: number, score: number, problem?: Problem, ctx?: MetaContext<Meta>): Meta

  // The meta keys that stay identical when a question is re-presented one tier
  // down. Declared (possibly empty) by every exercise that has been checked
  // against the conventions; `conventions.test.ts` verifies that buildRetry
  // really preserves them. Tier-dependent fields (tierId, reveal kind, option
  // lists that follow the tier) are NOT listed.
  retryStable?: (keyof Meta & string)[]

  // What the feedback overlay shows after a wrong answer: the correct fact as
  // the child should read it ("5 is 4 en 1", "3 + 2 = 5"). Return null when no
  // single statement is the answer (open production) — the overlay then shows
  // the neutral message. Omitted: the default applies (presentation/feedback.ts
  // → wrongFeedbackText), which never shows a split's total as "the answer".
  correctStatement?: (question: ExerciseQuestion<Meta>) => string | null

  // Optional guard: if provided, the selector will skip this exercise when
  // the generated (a, b) pair doesn't satisfy it. Use to exclude degenerate
  // inputs (e.g. zero-splits for frame-based exercises).
  isCompatible?: (a: number, b: number) => boolean

  Component: ComponentType<ExerciseComponentProps<Meta>>
}
