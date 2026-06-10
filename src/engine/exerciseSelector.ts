import type { Problem, SkillDefinition, WeightFunction } from '../curriculum/types'
import type { Profile } from '../state/types'
import type { ExerciseQuestion } from '../exercises/types'
import type { AnswerRecord } from './diagnostics'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { computeAnswer, problemOperands } from './answer'
import { exerciseFactors } from './weightFactors'

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
// moving on) and the profile's answer stream (drives the dynamic weight
// factors); the future scheduler plugs in here.
export interface SelectionContext {
  // Re-present this exact problem one scaffolding tier lower. Same skill,
  // same exercise, same operands — only the tier drops.
  retry?: ExerciseQuestion
  // The question just answered; used to avoid an immediate repeat.
  lastQuestion?: ExerciseQuestion | null
  // The profile's persisted answer records; weak exercises get their weight
  // inflated via exerciseFactors. Omitted (e.g. in tests) → all factors 1.
  records?: AnswerRecord[]
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

// How many problems to draw for one skill before giving up on it this round,
// and how many of those draws also dodge an immediate repeat of the previous
// question (after that, a repeat beats not playing).
const MAX_PROBLEM_DRAWS = 6
const REPEAT_AVOID_DRAWS = 3

function sameProblem(p1: Problem, p2: Problem): boolean {
  return JSON.stringify(p1) === JSON.stringify(p2)
}

// Try to build a playable question for one skill. Null when the skill has no
// weighted candidates at this score, or every drawn problem was rejected by
// isCompatible — the caller then re-draws another skill instead of surfacing
// an empty state.
function buildQuestion(
  skill: SkillDefinition,
  score: number,
  getWeights: WeightFunction,
  registered: Set<string>,
  ctx: SelectionContext | undefined,
): ExerciseQuestion | null {
  const lastQuestion = ctx?.lastQuestion ?? null

  // Intersect: skill's applicable list × registered × non-zero weight for this
  // skill. Base weight is multiplied by the dynamic error-chasing factor —
  // a zero base weight stays zero (the factor never resurrects an exercise).
  const weights = getWeights(skill.id, score)
  const factors = ctx?.records ? exerciseFactors(ctx.records, skill.id) : {}
  const candidates: [string, number][] = []
  for (const exId of skill.applicableExercises) {
    if (!registered.has(exId)) continue
    const w = weights[exId] ?? 0
    if (w > 0) candidates.push([exId, w * (factors[exId] ?? 1)])
  }
  if (candidates.length === 0) return null

  for (let draw = 0; draw < MAX_PROBLEM_DRAWS; draw++) {
    const problem = skill.generate()
    if (
      draw < REPEAT_AVOID_DRAWS &&
      lastQuestion?.skillId === skill.id &&
      sameProblem(lastQuestion.problem, problem)
    ) continue

    const { a, b } = problemOperands(problem)
    const filtered = candidates.filter(([exId]) => {
      const def = getExercise(exId)
      return !def.isCompatible || def.isCompatible(a, b)
    })
    if (filtered.length === 0) continue

    const exerciseId = weightedPick(filtered)
    const def = getExercise(exerciseId)
    return {
      exerciseId,
      skillId: skill.id,
      problem,
      operandA: a,
      operandB: b,
      op: problem.op,
      answer: computeAnswer(problem),
      meta: def.generateMeta(a, b, score),
    }
  }
  return null
}

// Selects a skill, an exercise type for that skill at the current score,
// and generates the question. Returns null only when no skill in the pool
// can produce a playable question.
export function selectExercise(
  profile: Profile,
  skills: SkillDefinition[],
  getWeights: WeightFunction,
  ctx?: SelectionContext,
): ExerciseQuestion | null {
  if (ctx?.retry) return buildRetry(ctx.retry)

  const registered = new Set(getAllExerciseIds())

  // Available skills: not disabled, unlocked, not archived, with at least one applicable exercise registered.
  const pool = skills.filter(skill => {
    if (skill.disabled) return false
    const state = profile.skills[skill.id]
    if (!state?.unlocked || state.archived) return false
    return skill.applicableExercises.some(id => registered.has(id))
  })

  // Uniform skill pick for now (scheduler refinements go here later), but a
  // skill that can't produce a question drops out and the rest get a chance.
  while (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    const skill = pool[idx]
    const question = buildQuestion(
      skill,
      profile.skills[skill.id]?.score ?? 0,
      getWeights,
      registered,
      ctx,
    )
    if (question) return question
    pool.splice(idx, 1)
  }
  return null
}
