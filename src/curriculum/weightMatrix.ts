import type { WeightFunction, WeightMap } from './types'

// ─── Per-skill weight tables ──────────────────────────────────────────────────
// Each entry maps exercise ids to one of:
//   • a constant number (flat weight)
//   • a LerpPair [w@0, w@100] (linear interpolation across the full 0–100 range)
//   • Breakpoints [[score, weight], ...] (piecewise linear; weight is 0 below
//     the first breakpoint's score, held constant above the last, and linearly
//     interpolated between adjacent breakpoints)
// Skills not listed here fall through to the default global curve below.

type LerpPair = [number, number]
type Breakpoints = [number, number][]
type WeightSpec = number | LerpPair | Breakpoints
type SkillTable = Record<string, WeightSpec>

const SKILL_TABLES: Record<string, SkillTable> = {

  // ── Getalbegrip ──────────────────────────────────────────────────────────────
  // Early: dominated by count-and-tap (concrete, one-at-a-time).
  // Late:  subitising & structure exercises take over; count-and-tap fades.
  // numberline-place and compare-more-less are steady throughout (ordinal/relational).
  // compare-pick (relation-to-anchor incl. evenveel) phases in once numerals read.

  'getalbegrip-5': {
    'count-and-tap':             [40,  5],
    'dot-pattern-recognise':     [ 5, 30],
    'ten-frame-show':            [10, 25],
    'finger-pattern-recognise':  [ 5, 25],
    'numberline-place':          [15, 20],
    'compare-more-less':         15,
    'compare-pick':              [[25, 0], [60, 22], [100, 22]],
    'number-sequence-order':     25,
    'show-me-on-ten-frame':      15,
    'numberline-read':           [15, 20],
    'quantity-match':            [[25, 30], [100, 30]],   // 0 below 25, then flat 30
    'subitise-flash':            [[50,  0], [100, 50]],   // 0 below 50, then ramp 0→50
  },

  // -10 diverges from -5: a flat lean on the 5-structure presentations
  // (ten-frame, vingerbeelden) — the skill's identity is 6–10 via the 5-anchor —
  // and number-sequence-order earns more (its sparse tier shines in this range).

  'getalbegrip-10': {
    'count-and-tap':             [40,  5],
    'dot-pattern-recognise':     [ 5, 30],
    'ten-frame-show':            [18, 28],
    'finger-pattern-recognise':  [12, 28],
    'numberline-place':          [15, 20],
    'compare-more-less':         15,
    'compare-pick':              [[25, 0], [60, 22], [100, 22]],
    'number-sequence-order':     30,
    'show-me-on-ten-frame':      20,
    'numberline-read':           [15, 20],
    'quantity-match':            [[25, 30], [100, 30]],   // 0 below 25, then flat 30
    'subitise-flash':            [[50,  0], [100, 50]],   // 0 below 50, then ramp 0→50
  },

  // ── Splitsen ─────────────────────────────────────────────────────────────────
  // Initial guesses, to be tuned with playtesting:
  // huisje dominant early (canonical scaffold), build-it (enactive swipe-to-cut)
  // strongest at the start and fading; the width probes come in as the score
  // rises — shuffle (conservation) early-mid, same-or-different (order
  // independence) mid, splits-match (representational transfer) mid-high.

  'splitsen-herken-5': {
    'dot-pattern-decompose':   [30, 20],
    'splits-frame':            [20, 20],
    'splits-herken-huisje':    [40, 25],
    'splits-build-it':         [25, 5],
    'splits-shuffle':          [[10, 15], [50, 20], [100, 10]],
    'same-split-or-different': [[20, 0], [50, 25], [100, 25]],
    'splits-match':            [[30, 0], [70, 30], [100, 30]],
  },
}

// Validation hook: the explicit per-skill table ids (null when the skill falls
// back to the default curve). Lets validate.ts distinguish "deliberately
// tabled" from "default fallback" without re-deriving it from weights.
export function getSkillTableIds(skillId: string): string[] | null {
  const table = SKILL_TABLES[skillId]
  return table ? Object.keys(table) : null
}

// ─── Default / fallback curve ─────────────────────────────────────────────────
// Used for all skills not yet given their own table. Mirrors the original
// global curve from round 1 — Round 3 will replace each skill one by one.

function defaultWeights(score: number): WeightMap {
  const t = score / 100
  return {
    'count-and-tap':             20,
    'dot-pattern-recognise':     t < 0.24 ? 0 : lerp(0, 25, t),
    'finger-pattern-recognise':  t < 0.24 ? 0 : lerp(0, 25, t),
    'numberline-place':          20,
    'compare-more-less':         20,
    'ten-frame-show':            20,
    'fill-vis':         lerp(40,  5, t),
    'fill-plain':       lerp( 0, 60, t),
    'choice':           lerp(25, 15, t),
    'tf':               lerp(10, 15, t),
    'collect-tap':      lerp(25,  0, t),
    'collect-counter':  lerp(15,  5, t),
    'numberline-jump':  lerp(15, 10, t),
  }
}

// ─── Exported function ────────────────────────────────────────────────────────

export const getWeights: WeightFunction = (skillId: string, score: number): WeightMap => {
  const table = SKILL_TABLES[skillId]
  if (!table) return defaultWeights(score)

  const t = score / 100
  const result: WeightMap = {}
  for (const [id, val] of Object.entries(table)) {
    if (typeof val === 'number') result[id] = val
    else if (Array.isArray(val[0])) result[id] = evalBreakpoints(val as Breakpoints, score)
    else result[id] = lerp((val as LerpPair)[0], (val as LerpPair)[1], t)
  }
  return result
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}

// Piecewise-linear evaluation. Below the first breakpoint's score, weight is 0
// (so a single breakpoint `[[25, 30]]` means "starts contributing at 25"). At
// and above the last breakpoint, weight is held at that breakpoint's value.
function evalBreakpoints(bps: Breakpoints, score: number): number {
  if (bps.length === 0) return 0
  if (score < bps[0][0]) return 0
  const last = bps[bps.length - 1]
  if (score >= last[0]) return last[1]
  for (let i = 0; i < bps.length - 1; i++) {
    const [s0, w0] = bps[i]
    const [s1, w1] = bps[i + 1]
    if (score >= s0 && score <= s1) {
      const t = s1 === s0 ? 1 : (score - s0) / (s1 - s0)
      return Math.round(w0 + (w1 - w0) * t)
    }
  }
  return 0
}
