import type { AnswerRecord } from './diagnostics'

// ─── Dynamic per-exercise weight factor ───────────────────────────────────────
// The error-chasing rebalancer over the hardcoded weight matrix. Wrong answers
// inflate an exercise's selection weight, so a weak exercise recruits airtime
// until its errors dominate the score drift — the score can't cross the unlock
// threshold while a weakness is live (the fix for weak-exercise masking; see
// CLAUDE.md → Score model rationale). Correct answers decay the factor back
// to neutral.
//
// The factor exists per (profile, skill, exercise) but is stored nowhere: it is
// a pure fold over the persisted answer stream, recomputed at selection time.
// No profile state, no migration; retuning the constants retroactively applies
// to all history.

export const FACTOR_BUMP = 0.5    // added per wrong answer in the exercise
export const FACTOR_DECAY = 0.25  // subtracted per correct answer in the exercise
export const FACTOR_CAP = 3       // clamp ceiling; floor is 1 (neutral)
export const FACTOR_WINDOW = 20   // fold over the exercise's last N non-retry records

// Factor map for one skill: exerciseId → multiplier in [1, FACTOR_CAP].
// Chronological fold per exercise, clamped at every step; old answers age out
// of the window. Retries are excluded — the wrong answer that triggered a
// retry already bumped the factor; the easier retry shouldn't move it.
export function exerciseFactors(
  records: AnswerRecord[],
  skillId: string,
): Record<string, number> {
  const byExercise = new Map<string, AnswerRecord[]>()
  for (const r of records) {
    if (r.skillId !== skillId || r.isRetry) continue
    const list = byExercise.get(r.exerciseId)
    if (list) list.push(r)
    else byExercise.set(r.exerciseId, [r])
  }

  const factors: Record<string, number> = {}
  for (const [exerciseId, list] of byExercise) {
    let factor = 1
    for (const r of list.slice(-FACTOR_WINDOW)) {
      factor += r.correct ? -FACTOR_DECAY : FACTOR_BUMP
      factor = Math.min(FACTOR_CAP, Math.max(1, factor))
    }
    factors[exerciseId] = factor
  }
  return factors
}
