import type { Problem } from './types'

// ─── Fact-space sampling ─────────────────────────────────────────────────────
// Generators used to sample parameter chains (pick b, then a), which skews the
// fact distribution: a chain gives "split of 2" the same airtime as each split
// of 5, even though 5 has four splits and 2 has one. The fix: enumerate the
// skill's fact space explicitly and sample over the facts, so each total's
// share follows its fact count (splitsen-herken-5's hand-tuned total weights
// 1:2:3:4 were exactly this, hand-rolled — this module formalises it).
//
// GenerateContext is the seam where need-based per-fact weighting plugs in
// later: build the fact list, reweight() it from the answer records,
// sampleFact() — no new architecture.

export type WeightedFact<T extends Problem = Problem> = [T, number]

export function sampleFact<T extends Problem>(facts: ReadonlyArray<WeightedFact<T>>): T {
  const total = facts.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [fact, w] of facts) {
    r -= w
    if (r <= 0 && w > 0) return fact
  }
  return facts[facts.length - 1][0]
}

// Multiply each fact's weight by `factor(fact)` — for anchor nudges (linger on
// total 5) or score-dependent damping (0-splits muted below a threshold).
// A factor of 0 removes the fact from the draw.
export function reweight<T extends Problem>(
  facts: ReadonlyArray<WeightedFact<T>>,
  factor: (fact: T) => number,
): WeightedFact<T>[] {
  return facts.map(([fact, w]) => [fact, w * factor(fact)])
}

type SplitProblem = Extract<Problem, { op: 'split' }>
type PlusProblem  = Extract<Problem, { op: '+' }>
type MinusProblem = Extract<Problem, { op: '-' }>

// All splits of every total in [minTotal, maxTotal]. Without zero: partA runs
// 1..total−1 (a total of 2 has one split, 5 has four). With zero: partA runs
// 0..total (adds the two 0-splits of each total).
export function enumerateSplits(
  minTotal: number,
  maxTotal: number,
  opts: { includeZero?: boolean } = {},
): WeightedFact<SplitProblem>[] {
  const facts: WeightedFact<SplitProblem>[] = []
  for (let total = minTotal; total <= maxTotal; total++) {
    const lo = opts.includeZero ? 0 : 1
    const hi = opts.includeZero ? total : total - 1
    for (let partA = lo; partA <= hi; partA++) {
      facts.push([{ op: 'split', partA, partB: total - partA }, 1])
    }
  }
  return facts
}

// All sums a + b with b drawn from `addends`, a ≥ 1, a + b ≤ maxSum.
export function enumeratePlus(
  maxSum: number,
  addends: readonly number[],
): WeightedFact<PlusProblem>[] {
  const facts: WeightedFact<PlusProblem>[] = []
  for (const b of addends) {
    for (let a = 1; a + b <= maxSum; a++) {
      facts.push([{ op: '+', terms: [a, b] }, 1])
    }
  }
  return facts
}

// All differences whole − part with part drawn from `parts`, part ≤ whole ≤
// maxWhole. whole === part gives the "alles weg" → 0 facts; callers that want
// them rarer (or gone) damp them with reweight().
export function enumerateMinus(
  maxWhole: number,
  parts: readonly number[],
): WeightedFact<MinusProblem>[] {
  const facts: WeightedFact<MinusProblem>[] = []
  for (const part of parts) {
    for (let whole = part; whole <= maxWhole; whole++) {
      facts.push([{ op: '-', whole, part }, 1])
    }
  }
  return facts
}
