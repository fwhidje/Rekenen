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
