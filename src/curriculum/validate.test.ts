import { describe, it, expect } from 'vitest'
import '../exercises/index' // register everything, as the app would
import { validateCurriculum } from './validate'

// The doc-rot tripwire: the shipped curriculum data must agree with itself.
// If this fails, a weight table, applicableExercises list, registry import or
// EXERCISE_PLAN entry has drifted — fix the data, don't relax the test.
describe('curriculum consistency', () => {
  it('has no list disagreements', () => {
    expect(validateCurriculum()).toEqual([])
  })
})

// The WIP gate's promise: a skill the child can reach (it and every ancestor
// un-gated) is playable at every score — at each score band at least one of
// its exercises is registered, weighted and able to show what the generator
// draws. A gate lifted too early (exercises not built, no weight table) fails
// here instead of in front of the child.
import { SKILLS } from './skills'
import { getWeights } from './weightMatrix'
import { getAllExerciseIds, getExercise } from '../exercises/registry'
import { problemOperands } from '../engine/answer'
import { canOverride } from '../admin/progressOverride'

describe('reachable skills are playable', () => {
  const registered = new Set(getAllExerciseIds())
  const reachable = SKILLS.filter(s => canOverride(s.id))
  it.each(reachable.map(s => s.id))('%s', (id) => {
    const skill = SKILLS.find(s => s.id === id)!
    expect(skill.didactics.goal, `${id}: didactics still TODO`).not.toBe('TODO')
    for (const score of [0, 20, 40, 60, 80, 100]) {
      const weights = getWeights(id, score)
      const live = skill.applicableExercises.filter(ex => registered.has(ex) && (weights[ex] ?? 0) > 0)
      expect(live.length, `${id} @ ${score}: no registered exercise with weight`).toBeGreaterThan(0)
      for (let d = 0; d < 10; d++) {
        const problem = skill.generate({ score })
        const { a, b } = problemOperands(problem)
        const fits = live.some(ex => { const def = getExercise(ex); return !def.isCompatible || def.isCompatible(a, b, problem, id) })
        expect(fits, `${id} @ ${score}: no live exercise can show ${JSON.stringify(problem)}`).toBe(true)
      }
    }
  })
})
