// ─── Operation ────────────────────────────────────────────────────────────────
// Every generated problem is tagged with what kind of math it represents.
// '+'/'-' are obvious; 'split' is a decomposition (e.g. tienvrienden, splitsen);
// 'count' is for getalbegrip (just identify a quantity); 'half' is helften.
export type Operation = '+' | '-' | 'split' | 'count' | 'half'

// ─── Problem ──────────────────────────────────────────────────────────────────
// A generated problem with named roles per operation, so exercises can read
// what a number *means* instead of decoding positional a/b conventions.
// Subtraction names whole/part deliberately: wegnemen, verschil and aanvullen
// presentations all read their roles from the same shape. The engine derives
// the legacy operandA/operandB pair for existing components (see
// engine/answer.ts); new exercises should consume `question.problem`.
export type Problem =
  | { op: '+';     terms: [number, number] }
  | { op: '-';     whole: number; part: number }
  | { op: 'split'; partA: number; partB: number }
  | { op: 'count'; n: number }
  | { op: 'half';  total: number }

// Optional context handed to a skill's generator. The seam for per-fact
// sampling: drill skills (tienvrienden, dubbels) can oversample the facts the
// recent record stream shows to be weak. No generator uses it yet.
export interface GenerateContext {
  recentRecords?: ReadonlyArray<import('../engine/diagnostics').AnswerRecord>
}

// ─── Skill ────────────────────────────────────────────────────────────────────
// A skill is narrow and atomic. The math it covers never changes —
// only the presentation (exercise type) shifts as the score moves.
//
// `unlockedBy`: ALL listed prerequisites must be unlocked AND at the 'par'
//   mastery milestone (see engine/mastery.ts) before this skill becomes
//   available. An empty list means the skill is a root.
// `unlocks`: inverse of `unlockedBy` from the other side, kept for readability;
//   the engine derives behaviour from `unlockedBy` only.
// `subsumedBy`: the single skill that — once unlocked AND this skill is at score
//   max — archives this one out of rotation. `null` means never archive
//   (typically fact-recall drills like tienvrienden, dubbels, helften).

// Subtraction (and some splitsen) problems carry a semantic flavour that
// the bare `a − b` doesn't capture. It drives error classification
// (e.g. treating a `verschil` problem as plain `wegnemen`). Only meaningful
// for subtraction-family skills; left undefined elsewhere.
export type SemanticForm = 'wegnemen' | 'verschil' | 'aanvullen'

// ─── Skill didactics ────────────────────────────────────────────────────────
// Structured pedagogical context, co-located with the skill so it stays honest
// with the code. Fill on every skill — a 'TODO' stub is acceptable as a
// placeholder, but the field must be present. See CLAUDE.md → Blueprint.
export interface SkillDidactics {
  startingPoint: string   // what the child can already do entering this skill
  goal: string            // what mastery of this skill looks like
  pitfalls: string[]      // the top 1–3 common errors / things to watch
}

export interface SkillDefinition {
  id: string
  name: string             // Dutch display label
  intent: string           // one-line plain-language tagline for documentation
  didactics: SkillDidactics
  op: Operation            // primary operation this skill teaches
  semanticForm?: SemanticForm  // subtraction flavour, when applicable
  unlockedBy: string[]
  unlocks: string[]
  subsumedBy: string | null
  applicableExercises: string[]  // exercise type ids this skill may use
  generate(ctx?: GenerateContext): Problem
  disabled?: boolean       // WIP gate: skill is hidden from rotation AND
                           // never satisfies downstream prerequisites.
                           // Lift by removing the flag once the skill is
                           // ready. See CLAUDE.md → WIP gate.
}

// ─── Weight matrix ────────────────────────────────────────────────────────────
// For a given score (0–100), returns a map of exerciseId → weight.
// Higher weight = more likely to be chosen by the selector.
// Weights don't need to sum to 100; they're relative.

export type WeightMap = Record<string, number>
export type WeightFunction = (skillId: string, score: number) => WeightMap
