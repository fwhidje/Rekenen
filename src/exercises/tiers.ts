import type { ExerciseTier } from './types'

// Returns the active tier for a given skill score: the highest tier whose
// minScore is <= score. Tiers may be declared in any order; a tier with
// minScore 0 acts as the floor. Throws only if the array is empty, which is a
// programming error (every exercise declares at least one tier).
export function pickTier(tiers: ExerciseTier[], score: number): ExerciseTier {
  let active: ExerciseTier | null = null
  for (const tier of tiers) {
    if (score >= tier.minScore && (active === null || tier.minScore > active.minScore)) {
      active = tier
    }
  }
  if (active === null) {
    // No tier matched (all minScores above score): fall back to the lowest.
    active = tiers.reduce((lo, t) => (t.minScore < lo.minScore ? t : lo), tiers[0])
  }
  return active
}
