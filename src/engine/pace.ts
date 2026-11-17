import type { AnswerRecord } from './diagnostics'

// ─── Pace: was a correct answer known, or worked out? ────────────────────────
// A right/wrong score cannot tell a child who knows 7 + 3 from one who counts
// it correctly. For the time-aware exercise (snel-weten) a correct answer is
// therefore judged a second time, on how long it took:
//
//   fast  → counts as usual (+1)
//   slow  → still correct — the child gets the normal praise and is never told
//           it was slow — but the score stays where it is
//
// No clock is shown and nothing is ever "too late" (skill map → Exercise design
// for the next set, shared rule 4). A wrong answer is simply wrong.
//
// The limit is relative to the child. The exercise reports `answerMs` (from the
// question being readable to the tap) and names a margin per tier; the limit is
// the child's own tap baseline plus that margin. The baseline is the fast end
// of his own recent correct answers in time-aware questions: the answers he
// knew, which cost only reading and tapping. Until there are enough of those a
// default is used.
//
// Derived, never stored as state: a fold over the answer stream, like the
// weight factors. Retuning the constants applies to the next answer.

export type Pace = 'fast' | 'slow'

export const PACE_DEFAULT_BASELINE_MS = 1500  // before the child has a history
export const PACE_BASELINE_MIN_MS = 800       // clamp: a baseline below this is a lucky tap
export const PACE_BASELINE_MAX_MS = 3000      // clamp: above this the "fast end" is not fast
export const PACE_WINDOW = 40                 // recent timed correct answers looked at
export const PACE_MIN_SAMPLES = 8             // fewer than this → the default
export const PACE_QUANTILE = 0.25             // the fast quarter

// The child's tap baseline in ms.
export function tapBaselineMs(records: ReadonlyArray<AnswerRecord>): number {
  const times: number[] = []
  for (let i = records.length - 1; i >= 0 && times.length < PACE_WINDOW; i--) {
    const r = records[i]
    if (r.correct && !r.isRetry && typeof r.answerMs === 'number') times.push(r.answerMs)
  }
  if (times.length < PACE_MIN_SAMPLES) return PACE_DEFAULT_BASELINE_MS
  times.sort((a, b) => a - b)
  const q = times[Math.floor((times.length - 1) * PACE_QUANTILE)]
  return Math.min(PACE_BASELINE_MAX_MS, Math.max(PACE_BASELINE_MIN_MS, q))
}

// The pace of one correct answer, or undefined when the question was not
// time-aware (no margin), was a retry, or the exercise reported no time.
export function judgePace(
  input: { marginMs?: number; answerMs?: number; isRetry?: boolean; correct: boolean },
  records: ReadonlyArray<AnswerRecord>,
): Pace | undefined {
  if (!input.correct || input.isRetry) return undefined
  if (typeof input.marginMs !== 'number' || typeof input.answerMs !== 'number') return undefined
  return input.answerMs <= tapBaselineMs(records) + input.marginMs ? 'fast' : 'slow'
}
