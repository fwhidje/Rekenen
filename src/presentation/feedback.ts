// ─── Feedback config ───────────────────────────────────────────────────────
// Locked design constraints (see CLAUDE.md → feedback design):
//   • A mistake MUST be acknowledged — the child has to know an error was made
//     (we reveal the correct answer). No silent score-only penalty.
//   • Praise the process/effort, never the child's ability. No escalating "wow".
//   • Wrong is not a failure state: calm tone, no alarm-red, no buzz.
//   • The drop-a-tier-and-retry-the-same-problem mechanic is DEFERRED — this is
//     wording + tone only, behaviour is otherwise unchanged.
//
// All copy and tone live here so they can be tuned without touching KidMode.

export interface FeedbackTone {
  bg: string
  text: string
}

export interface FeedbackConfig {
  // Process/effort phrases, shown on a correct answer (pick one at random).
  positive: string[]
  // Builds the wrong-answer message; reveals the correct answer.
  wrongMessage: (correctAnswer: number) => string
  correctTone: FeedbackTone
  wrongTone: FeedbackTone
  // Overlay dwell time before advancing.
  correctMs: number
  wrongMs: number
}

export const FEEDBACK: FeedbackConfig = {
  positive: ['Knap gedaan', 'Goed nagedacht', 'Goed gewerkt', 'Knap', 'Goed bezig', 'Mooi opgelost'],
  wrongMessage: (correctAnswer) => `Het antwoord is ${correctAnswer}`,
  correctTone: { bg: 'rgba(6,214,160,.82)', text: '#013d1e' },
  // Calm clay/amber rather than alarm-red — acknowledges the miss without panic.
  wrongTone: { bg: 'rgba(214,158,90,.86)', text: '#4a2e09' },
  correctMs: 1100,
  wrongMs: 2400,
}
