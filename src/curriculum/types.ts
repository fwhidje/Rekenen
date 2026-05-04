// ─── Skill ────────────────────────────────────────────────────────────────────
// A skill is narrow and atomic. The math it covers never changes —
// only the presentation (exercise type) shifts as the score moves.

export interface SkillDefinition {
  id: string
  label: string         // Dutch, e.g. "+1/+2 binnen 5"
  minA: number          // smallest value for operand A
  maxA: number
  minB: number          // smallest value for operand B
  maxB: number
  maxSum: number        // hard ceiling on A+B (never exceeded)
}

// ─── Unlock graph ─────────────────────────────────────────────────────────────
// Maps each skill id to the list of skill ids it unlocks when the
// unlock threshold is reached. Downstream skills never re-lock.

export type UnlockGraph = Record<string, string[]>

// ─── Weight matrix ────────────────────────────────────────────────────────────
// For a given score (0–50), returns a map of exerciseId → weight.
// Higher weight = more likely to be chosen by the selector.
// Weights don't need to sum to 100; they're relative.

export type WeightMap = Record<string, number>
export type WeightFunction = (score: number) => WeightMap
