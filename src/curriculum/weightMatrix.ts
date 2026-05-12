import type { WeightFunction } from './types'

// Maps a skill score (0–50) to exercise type weights — placeholder global curve
// for round 1. Round 3 will replace with per-skill weight tables that respect
// each skill's pedagogy. Exercise types not listed here get weight 0
// (silently skipped by the selector).
//
// Weights are relative — they don't need to sum to 100.
export const getWeights: WeightFunction = (score: number) => {
  const t = score / 50

  return {
    'count-and-tap':    20,
    'fill-vis':         lerp(40, 5,  t),
    'fill-plain':       lerp(0,  60, t),
    'choice':           lerp(25, 15, t),
    'tf':               lerp(10, 15, t),
    'collect-tap':      lerp(25, 0,  t),
    'collect-counter':  lerp(15, 5,  t),
    'numberline-jump':  lerp(15, 10, t),
  }
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}
