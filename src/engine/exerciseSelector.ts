import type { SkillDefinition, WeightFunction } from '../curriculum/types'
import type { Profile } from '../state/types'
import type { ExerciseQuestion } from '../exercises/types'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { computeAnswer } from './answer'

function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [item, weight] of items) {
    r -= weight
    if (r <= 0) return item
  }
  return items[0][0]
}

// ─── Selection context ────────────────────────────────────────────────────────
// The seam through which the answer loop steers selection. Today it carries
// the retry request (didactics: respond to failure by re-scaffolding, not by
// moving on); the future scheduler and error-driven remediation plug in here.
export interface SelectionContext {
  // Re-present this exact problem one scaffolding tier lower. Same skill,
  // same exercise, same operands — only the tier drops.
  retry?: ExerciseQuestion
  // The question just answered; used to avoid an immediate repeat.
  lastQuestion?: ExerciseQuestion | null
}

// Rebuild a just-failed question one tier down. Tier thresholds live in the
// exercise's declared TIERS, so the drop is done by regenerating meta at the
// lower tier's floor score — pickTier inside generateMeta lands on it without
// any exercise file knowing about retries.
function buildRetry(original: ExerciseQuestion): ExerciseQuestion {
  const def = getExercise(original.exerciseId)
  const tiers = [...def.tiers].sort((x, y) => x.minScore - y.minScore)
  const tierId = (original.meta as { tierId?: string }).tierId
  const idx = tiers.findIndex(t => t.id === tierId)
  // One tier below the original; at the lowest tier (or unknown), stay there.
  const target = idx > 0 ? tiers[idx - 1] : tiers[0]
  const meta = def.generateMeta(original.operandA, original.operandB, target?.minScore ?? 0)
  return { ...original, meta, isRetry: true }
}

// Selects a skill, an exercise type for that skill at the current score,
// and generates the question. Returns null when nothing is playable.
export function selectExercise(
  profile: Profile,
  skills: SkillDefinition[],
  getWeights: WeightFunction,
  ctx?: SelectionContext,
): ExerciseQuestion | null {
  if (ctx?.retry) return buildRetry(ctx.retry)

  const registered = new Set(getAllExerciseIds())

  // Available skills: not disabled, unlocked, not archived, with at least one applicable exercise registered.
  const available = skills.filter(skill => {
    if (skill.disabled) return false
    const state = profile.skills[skill.id]
    if (!state?.unlocked || state.archived) return false
    return skill.applicableExercises.some(id => registered.has(id))
  })
  if (available.length === 0) return null

  // Uniform skill pick for now. Scheduler refinements go here later.
  const skill = available[Math.floor(Math.random() * available.length)]
  const score = profile.skills[skill.id]?.score ?? 0

  // Intersect: skill's applicable list × registered × non-zero weight for this skill
  const weights = getWeights(skill.id, score)
  const candidates: [string, number][] = []
  for (const exId of skill.applicableExercises) {
    if (!registered.has(exId)) continue
    const w = weights[exId] ?? 0
    if (w > 0) candidates.push([exId, w])
  }
  if (candidates.length === 0) return null

  // Generate the problem first so isCompatible can filter exercises.
  const { a, b, op } = skill.generate()
  const filteredCandidates = candidates.filter(([exId]) => {
    const def = getExercise(exId)
    return !def.isCompatible || def.isCompatible(a, b)
  })
  if (filteredCandidates.length === 0) return null

  const exerciseId = weightedPick(filteredCandidates)
  const def = getExercise(exerciseId)
  const answer = computeAnswer(a, b, op)
  const meta = def.generateMeta(a, b, score)

  return {
    exerciseId,
    skillId: skill.id,
    operandA: a,
    operandB: b,
    op,
    answer,
    meta,
  }
}
