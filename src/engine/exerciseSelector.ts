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

// Selects a skill, an exercise type for that skill at the current score,
// and generates the question. Returns null when nothing is playable.
export function selectExercise(
  profile: Profile,
  skills: SkillDefinition[],
  getWeights: WeightFunction,
): ExerciseQuestion | null {
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

  const exerciseId = weightedPick(candidates)
  const def = getExercise(exerciseId)

  const { a, b, op } = skill.generate()
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
