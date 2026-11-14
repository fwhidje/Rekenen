// ─── Feedback config ───────────────────────────────────────────────────────
// Locked design constraints (see CLAUDE.md → feedback design):
//   • A mistake MUST be acknowledged — the child has to know an error was made
//     (we reveal the correct answer). No silent score-only penalty.
//   • Praise the process/effort, never the child's ability. No escalating "wow".
//   • Wrong is not a failure state: calm tone, no alarm-red, no buzz.
//   • A wrong answer is followed by the same question one tier down
//     (engine/exerciseSelector.ts → buildRetry).
//
// The three timing/wording conventions every exercise follows (CLAUDE.md →
// Exercise behaviour conventions): what the wrong overlay says
// (wrongFeedbackText), the hold on a correct answer (closureMs, via
// presentation/useClosure.ts), and the retry.
//
// All copy and tone live here so they can be tuned without touching KidMode.

export interface FeedbackTone {
  bg: string
  text: string
}

export interface FeedbackConfig {
  // Process/effort phrases, shown on a correct answer (pick one at random).
  positive: string[]
  // Wrong-answer message for a single numeric answer; reveals it.
  wrongMessage: (correctAnswer: number) => string
  // Wrong-answer message when no single statement is "the answer" (open
  // production) — still acknowledges the miss.
  wrongNeutral: string
  // How long a correct answer stays on screen, completed, before the overlay.
  closureMs: number
  correctTone: FeedbackTone
  wrongTone: FeedbackTone
  // Overlay dwell time before advancing.
  correctMs: number
  wrongMs: number
}

export const FEEDBACK: FeedbackConfig = {
  positive: ['Knap gedaan', 'Goed nagedacht', 'Goed gewerkt', 'Knap', 'Goed bezig', 'Mooi opgelost'],
  wrongMessage: (correctAnswer) => `Het antwoord is ${correctAnswer}`,
  wrongNeutral: 'Dat klopt nog niet',
  closureMs: 800,
  correctTone: { bg: 'rgba(6,214,160,.82)', text: '#013d1e' },
  // Calm clay/amber rather than alarm-red — acknowledges the miss without panic.
  wrongTone: { bg: 'rgba(214,158,90,.86)', text: '#4a2e09' },
  correctMs: 1100,
  wrongMs: 2400,
}

// ─── Wrong-answer text ────────────────────────────────────────────────────────
// The one place the wrong overlay's text is decided (KidMode and DebugMode both
// call it). Order:
//   1. the exercise's own `correctStatement(question)` — the correct fact as the
//      child should read it; null means "no single answer" → neutral message;
//   2. no declaration, split problem → neutral message. `question.answer` is the
//      TOTAL for a split, which is never what was asked;
//   3. otherwise the numeric answer.
interface FeedbackQuestion { op: string; answer: number }
interface FeedbackDefinition<Q> { correctStatement?: (question: Q) => string | null }

export function wrongFeedbackText<Q extends FeedbackQuestion>(question: Q, def: FeedbackDefinition<Q>): string {
  if (def.correctStatement) return def.correctStatement(question) ?? FEEDBACK.wrongNeutral
  if (question.op === 'split') return FEEDBACK.wrongNeutral
  return FEEDBACK.wrongMessage(question.answer)
}
