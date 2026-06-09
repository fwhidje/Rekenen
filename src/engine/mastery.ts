import type { SkillDefinition, WeightFunction } from '../curriculum/types'
import type { AnswerRecord } from './diagnostics'
import { getWeights as appGetWeights } from '../curriculum/weightMatrix'
import { getAllExerciseIds } from '../exercises/registry'

// ─── Mastery milestones ───────────────────────────────────────────────────────
// The scalar skill score stays what it is: the scaffolding dial (tier choice +
// weight-matrix input). Whether a skill is *mastered* is a width claim and is
// computed here, from the persisted answer stream, per exercise family:
//
//   'par'  — every gate family has enough recent attempts at high accuracy.
//            Unlock edges gate on this.
//   'vlot' — par, plus fluent: median response time on recent correct answers
//            under VLOT_MAX_MS per family. No unlock edge uses this yet; the
//            future brug-van-10 edges will (automatised tienvrienden/splitsen).
//
// Gate families are the exercise ids that can actually produce evidence:
// applicable ∩ registered ∩ ever-weighted. Unbuilt or never-weighted ids are
// excluded so a gate cannot silently wait on an exercise that can't be played.

export type Milestone = 'par' | 'vlot'

// Tweakables (initial values — tune against real play via the DebugMode panel).
export const PAR_MIN_ATTEMPTS = 8     // recent attempts needed per family
export const PAR_MIN_ACCURACY = 0.8   // accuracy over the window per family
export const PAR_WINDOW = 20          // window: last N attempts per family
export const VLOT_MAX_MS = 3000       // 'automatised' threshold (didactics: <3s)

export interface FamilyStats {
  exerciseId: string
  attempts: number                // attempts in the window (retries excluded)
  accuracy: number                // 0..1 over the window; 0 when no attempts
  medianCorrectMs: number | null  // median RT of correct answers in the window
  metPar: boolean
  metVlot: boolean
}

// Test seam: production callers use the defaults.
export interface MasteryOptions {
  getWeights?: WeightFunction
  registered?: Set<string>
}

function resolveOptions(opts?: MasteryOptions) {
  return {
    getWeights: opts?.getWeights ?? appGetWeights,
    registered: opts?.registered ?? new Set(getAllExerciseIds()),
  }
}

// The exercise families whose evidence counts toward this skill's milestones.
export function gateFamilies(skill: SkillDefinition, opts?: MasteryOptions): string[] {
  const { getWeights, registered } = resolveOptions(opts)
  return skill.applicableExercises.filter(exId => {
    if (!registered.has(exId)) return false
    for (let score = 0; score <= 100; score++) {
      if ((getWeights(skill.id, score)[exId] ?? 0) > 0) return true
    }
    return false
  })
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Per-family aggregates over the recent window. `records` may be the
// profile's full stream — it is filtered down to this skill here. Retries are
// excluded: they run at a deliberately lowered tier, so they'd inflate
// accuracy at the dial's actual scaffolding level.
export function familyStats(
  records: AnswerRecord[],
  skill: SkillDefinition,
  opts?: MasteryOptions,
): FamilyStats[] {
  const skillRecords = records.filter(r => r.skillId === skill.id && !r.isRetry)

  return gateFamilies(skill, opts).map(exerciseId => {
    const windowed = skillRecords
      .filter(r => r.exerciseId === exerciseId)
      .slice(-PAR_WINDOW)
    const attempts = windowed.length
    const correctOnes = windowed.filter(r => r.correct)
    const accuracy = attempts === 0 ? 0 : correctOnes.length / attempts
    const medianCorrectMs = median(
      correctOnes.map(r => r.responseTimeMs).filter((ms): ms is number => ms !== undefined),
    )
    const metPar = attempts >= PAR_MIN_ATTEMPTS && accuracy >= PAR_MIN_ACCURACY
    const metVlot = metPar && medianCorrectMs !== null && medianCorrectMs <= VLOT_MAX_MS
    return { exerciseId, attempts, accuracy, medianCorrectMs, metPar, metVlot }
  })
}

// The milestone predicate. False when the skill has no gate families at all:
// no evidence is possible, so no claim is made (such a skill shouldn't be
// gating anything — validate.ts flags it).
export function meetsMilestone(
  records: AnswerRecord[],
  skill: SkillDefinition,
  milestone: Milestone,
  opts?: MasteryOptions,
): boolean {
  const stats = familyStats(records, skill, opts)
  if (stats.length === 0) return false
  return stats.every(s => (milestone === 'par' ? s.metPar : s.metVlot))
}
