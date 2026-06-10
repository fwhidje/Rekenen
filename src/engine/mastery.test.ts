import { describe, it, expect } from 'vitest'
import { familyStats, gateFamilies, meetsMilestone, PAR_MIN_ATTEMPTS, PAR_WINDOW } from './mastery'
import type { AnswerRecord } from './diagnostics'
import type { SkillDefinition, WeightFunction } from '../curriculum/types'

const skill: SkillDefinition = {
  id: 'test-skill',
  name: 'Test',
  intent: '',
  didactics: { startingPoint: '', goal: '', pitfalls: [] },
  op: '+',
  unlockedBy: [],
  unlocks: [],
  subsumedBy: null,
  applicableExercises: ['ex-a', 'ex-b'],
  generate: () => ({ op: '+', terms: [1, 2] }),
}

const bothWeighted: WeightFunction = () => ({ 'ex-a': 10, 'ex-b': 10 })
const opts = { getWeights: bothWeighted, registered: new Set(['ex-a', 'ex-b']) }

let t = 0
function rec(exerciseId: string, correct: boolean, over: Partial<AnswerRecord> = {}): AnswerRecord {
  return {
    timestamp: ++t,
    profileId: 'p',
    skillId: 'test-skill',
    exerciseId,
    op: '+',
    operandA: 1,
    operandB: 2,
    correctAnswer: 3,
    correct,
    errorType: correct ? null : 'unclassified',
    responseTimeMs: 1500,
    ...over,
  }
}

const runOf = (exerciseId: string, n: number, correct = true, over: Partial<AnswerRecord> = {}) =>
  Array.from({ length: n }, () => rec(exerciseId, correct, over))

describe('gateFamilies', () => {
  it('excludes unregistered exercise ids', () => {
    expect(gateFamilies(skill, { ...opts, registered: new Set(['ex-a']) })).toEqual(['ex-a'])
  })

  it('excludes ids with zero weight across the whole curve', () => {
    const weights: WeightFunction = () => ({ 'ex-a': 10, 'ex-b': 0 })
    expect(gateFamilies(skill, { ...opts, getWeights: weights })).toEqual(['ex-a'])
  })
})

describe('par milestone', () => {
  it('fails with no records', () => {
    expect(meetsMilestone([], skill, 'par', opts)).toBe(false)
  })

  it('fails when only one family has evidence (the width point)', () => {
    const records = runOf('ex-a', PAR_MIN_ATTEMPTS * 3)
    expect(meetsMilestone(records, skill, 'par', opts)).toBe(false)
  })

  it('passes when every family is at attempts and accuracy', () => {
    const records = [...runOf('ex-a', PAR_MIN_ATTEMPTS), ...runOf('ex-b', PAR_MIN_ATTEMPTS)]
    expect(meetsMilestone(records, skill, 'par', opts)).toBe(true)
  })

  it('fails below the attempt minimum', () => {
    const records = [...runOf('ex-a', PAR_MIN_ATTEMPTS - 1), ...runOf('ex-b', PAR_MIN_ATTEMPTS)]
    expect(meetsMilestone(records, skill, 'par', opts)).toBe(false)
  })

  it('fails below the accuracy minimum', () => {
    const records = [
      ...runOf('ex-a', 7), ...runOf('ex-a', 3, false), // 70% over 10
      ...runOf('ex-b', PAR_MIN_ATTEMPTS),
    ]
    expect(meetsMilestone(records, skill, 'par', opts)).toBe(false)
  })

  it('only looks at the recent window — early mistakes are forgiven', () => {
    const records = [
      ...runOf('ex-a', 15, false), ...runOf('ex-a', PAR_WINDOW),
      ...runOf('ex-b', PAR_MIN_ATTEMPTS),
    ]
    expect(meetsMilestone(records, skill, 'par', opts)).toBe(true)
  })

  it('excludes re-scaffolded retries from the stats', () => {
    const records = [
      ...runOf('ex-a', PAR_MIN_ATTEMPTS, true, { isRetry: true }),
      ...runOf('ex-b', PAR_MIN_ATTEMPTS),
    ]
    expect(meetsMilestone(records, skill, 'par', opts)).toBe(false)
  })

  it('is false when the skill has no gate families at all', () => {
    const weights: WeightFunction = () => ({})
    expect(meetsMilestone(runOf('ex-a', 20), skill, 'par', { ...opts, getWeights: weights })).toBe(false)
  })
})

describe('vlot milestone', () => {
  const parRecords = (ms: number) => [
    ...runOf('ex-a', PAR_MIN_ATTEMPTS, true, { responseTimeMs: ms }),
    ...runOf('ex-b', PAR_MIN_ATTEMPTS, true, { responseTimeMs: ms }),
  ]

  it('passes par + fast answers', () => {
    expect(meetsMilestone(parRecords(2000), skill, 'vlot', opts)).toBe(true)
  })

  it('fails when median response time is over the threshold', () => {
    expect(meetsMilestone(parRecords(4000), skill, 'vlot', opts)).toBe(false)
  })

  it('measures the median over correct answers only', () => {
    const records = [
      ...runOf('ex-a', PAR_MIN_ATTEMPTS, true, { responseTimeMs: 2000 }),
      ...runOf('ex-a', 2, false, { responseTimeMs: 9000 }), // slow misses don't poison vlot
      ...runOf('ex-b', PAR_MIN_ATTEMPTS, true, { responseTimeMs: 2000 }),
    ]
    const stats = familyStats(records, skill, opts)
    expect(stats.find(s => s.exerciseId === 'ex-a')?.medianCorrectMs).toBe(2000)
    expect(meetsMilestone(records, skill, 'vlot', opts)).toBe(true)
  })
})
