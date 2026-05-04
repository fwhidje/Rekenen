import type { SkillDefinition, WeightFunction } from '../curriculum/types'
import type { Profile } from '../state/types'
import type { ExerciseQuestion } from '../exercises/types'
import { getExercise } from '../exercises/registry'

function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [item, weight] of items) {
    r -= weight
    if (r <= 0) return item
  }
  return items[0][0]
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Pick a random unlocked skill, then pick an exercise type via the weight matrix,
// then generate the question. Returns null if there are no unlocked skills.
export function selectExercise(
  profile: Profile,
  skills: SkillDefinition[],
  getWeights: WeightFunction,
): ExerciseQuestion | null {
  const unlocked = skills.filter(s => profile.skills[s.id]?.unlocked)
  if (unlocked.length === 0) return null

  // For now: uniform random skill selection. Scheduler improvements go here later.
  const skill = unlocked[Math.floor(Math.random() * unlocked.length)]
  const score = profile.skills[skill.id]?.score ?? 0

  const weights = getWeights(score)
  const exerciseId = weightedPick(Object.entries(weights).map(([id, w]) => [id, w] as [string, number]))

  const operandA = rnd(skill.minA, skill.maxA)
  const maxB = Math.min(skill.maxB, skill.maxSum - operandA)
  const operandB = rnd(skill.minB, Math.max(skill.minB, maxB))

  const def = getExercise(exerciseId)
  const meta = def.generateMeta(operandA, operandB, score)

  return {
    exerciseId,
    skillId: skill.id,
    operandA,
    operandB,
    answer: operandA + operandB,
    meta,
  }
}
