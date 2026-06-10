// The score is both the scaffolding dial (tier selection + weight matrix) and
// the unlock gate. Under +1/−3 it only climbs on sustained ≥75% accuracy over
// an engine-chosen exercise mix, so crossing UNLOCK_THRESHOLD is a mastery
// signal, not a volume count — see CLAUDE.md → Score model rationale.
export const SCORE_MIN = 0
export const SCORE_MAX = 100
export const UNLOCK_THRESHOLD = 60

export function applyCorrect(score: number): number {
  return Math.min(SCORE_MAX, score + 1)
}

export function applyWrong(score: number): number {
  return Math.max(SCORE_MIN, score - 3)
}
