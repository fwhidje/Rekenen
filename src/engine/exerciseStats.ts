import type { AnswerRecord } from './diagnostics'

// ─── Per-exercise recent stats ────────────────────────────────────────────────
// Reporting kernel over the persisted answer stream: recent attempts, accuracy
// and response time per exercise within a skill. Used by the DebugMode mix
// monitor (and any future parent-facing view). This is diagnostic output only —
// nothing gates on it.

export const STATS_WINDOW = 20  // last N non-retry attempts per exercise

export interface ExerciseStats {
  exerciseId: string
  attempts: number                // attempts in the window (retries excluded)
  accuracy: number                // 0..1 over the window; 0 when no attempts
  medianCorrectMs: number | null  // median RT of correct answers in the window
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Stats for the given exercise ids within one skill. Retries are excluded:
// they run at a deliberately lowered tier and would flatter the stats.
export function exerciseStats(
  records: AnswerRecord[],
  skillId: string,
  exerciseIds: string[],
): ExerciseStats[] {
  const skillRecords = records.filter(r => r.skillId === skillId && !r.isRetry)

  return exerciseIds.map(exerciseId => {
    const windowed = skillRecords
      .filter(r => r.exerciseId === exerciseId)
      .slice(-STATS_WINDOW)
    const attempts = windowed.length
    const correctOnes = windowed.filter(r => r.correct)
    const accuracy = attempts === 0 ? 0 : correctOnes.length / attempts
    const medianCorrectMs = median(
      correctOnes.map(r => r.responseTimeMs).filter((ms): ms is number => ms !== undefined),
    )
    return { exerciseId, attempts, accuracy, medianCorrectMs }
  })
}
