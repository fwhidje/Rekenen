import type { WeightFunction } from './types'

// Maps a skill score (0–50) to exercise type weights.
// Low score → heavy scaffolding (visuals, collect, number line).
// High score → mostly plain fill.
// Weights are relative — they don't need to sum to 100.

export const getWeights: WeightFunction = (score: number) => {
  // Normalise to 0–1 for interpolation
  const t = score / 50

  return {
    fill_visual:  lerp(40, 10, t),
    fill_plain:   lerp(5,  50, t),
    choice:       lerp(25, 15, t),
    true_false:   lerp(15, 10, t),
    collect:      lerp(20, 5,  t),
    number_line:  lerp(15, 10, t),
  }
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}
