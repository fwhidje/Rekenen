export const SCORE_MIN = 0
export const SCORE_MAX = 50
export const UNLOCK_THRESHOLD = 25  // provisional — tune once curriculum is finalised

export function applyCorrect(score: number): number {
  return Math.min(SCORE_MAX, score + 1)
}

export function applyWrong(score: number): number {
  return Math.max(SCORE_MIN, score - 3)
}
