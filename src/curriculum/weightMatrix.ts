import type { WeightFunction, WeightMap } from './types'

// ─── Per-skill weight tables ──────────────────────────────────────────────────
// Each entry maps exercise ids to [weightAtScore0, weightAtScore50] lerp bounds.
// Skills not listed here fall through to the default global curve below.
// Round 3 goal: every skill has its own table.

type LerpPair = [number, number]
type SkillTable = Record<string, LerpPair | number>

const SKILL_TABLES: Record<string, SkillTable> = {

  // ── Getalbegrip ──────────────────────────────────────────────────────────────
  // Early: dominated by count-and-tap (concrete, one-at-a-time).
  // Late:  subitising & structure exercises take over; count-and-tap fades.
  // numberline-place and compare-more-less are steady throughout (ordinal/relational).

  'getalbegrip-5': {
    'count-and-tap':             [40,  5],
    'dot-pattern-recognise':     [ 5, 30],
    'ten-frame-show':            [10, 25],
    'finger-pattern-recognise':  [ 5, 25],
    'numberline-place':          [15, 20],
    'compare-more-less':         15,
  },

  'getalbegrip-10': {
    'count-and-tap':             [40,  5],
    'dot-pattern-recognise':     [ 5, 30],
    'ten-frame-show':            [10, 25],
    'finger-pattern-recognise':  [ 5, 25],
    'numberline-place':          [15, 20],
    'compare-more-less':         15,
  },

  // ── Splitsen ─────────────────────────────────────────────────────────────────
  // Only dot-pattern-decompose is built so far; will be tuned alongside the
  // splitshuisje / splitsbenen / splits-* exercises as they come online.

  'splitsen-tot-5': {
    'dot-pattern-decompose': 50,
    'splits-frame':          50,
  },
}

// ─── Default / fallback curve ─────────────────────────────────────────────────
// Used for all skills not yet given their own table. Mirrors the original
// global curve from round 1 — Round 3 will replace each skill one by one.

function defaultWeights(score: number): WeightMap {
  const t = score / 50
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

  const t = score / 50
  const result: WeightMap = {}
  for (const [id, val] of Object.entries(table)) {
    result[id] = Array.isArray(val) ? lerp(val[0], val[1], t) : val
  }
  return result
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}
