// The score is the scaffolding dial only: it drives tier selection and the
// exercise-type weight matrix. Unlocking is NOT score-based — it gates on the
// 'par' mastery milestone computed from the answer stream (see mastery.ts).
export const SCORE_MIN = 0
export const SCORE_MAX = 100

export function applyCorrect(score: number): number {
  return Math.min(SCORE_MAX, score + 1)
}

export function applyWrong(score: number): number {
  return Math.max(SCORE_MIN, score - 3)
}
