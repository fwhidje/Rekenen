// ─── Operation ────────────────────────────────────────────────────────────────
// Every generated problem is tagged with what kind of math it represents.
// '+'/'-' are obvious; 'split' is a decomposition (e.g. tienvrienden, splitsen);
// 'count' is for getalbegrip (just identify a quantity); 'half' is helften.
export type Operation = '+' | '-' | 'split' | 'count' | 'half'

export interface GeneratedProblem {
  a: number
  b: number  // 0 for 'count' (only `a` is meaningful)
  op: Operation
}

// ─── Skill ────────────────────────────────────────────────────────────────────
// A skill is narrow and atomic. The math it covers never changes —
// only the presentation (exercise type) shifts as the score moves.
//
// `unlockedBy`: ALL listed prerequisites must be ≥ UNLOCK_THRESHOLD before
//   this skill becomes available. An empty list means the skill is a root.
// `unlocks`: inverse of `unlockedBy` from the other side, kept for readability;
//   the engine derives behaviour from `unlockedBy` only.
// `subsumedBy`: the single skill that — once unlocked AND this skill is at score
//   max — archives this one out of rotation. `null` means never archive
//   (typically fact-recall drills like tienvrienden, dubbels, helften).

export interface SkillDefinition {
  id: string
  name: string             // Dutch display label
  intent: string           // plain-language description for documentation
  op: Operation            // primary operation this skill teaches
  unlockedBy: string[]
  unlocks: string[]
  subsumedBy: string | null
  applicableExercises: string[]  // exercise type ids this skill may use
  generate(): GeneratedProblem
}

// ─── Weight matrix ────────────────────────────────────────────────────────────
// For a given score (0–50), returns a map of exerciseId → weight.
// Higher weight = more likely to be chosen by the selector.
// Weights don't need to sum to 100; they're relative.

export type WeightMap = Record<string, number>
export type WeightFunction = (skillId: string, score: number) => WeightMap
