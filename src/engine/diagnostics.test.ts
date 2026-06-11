import { describe, it, expect } from 'vitest'
import { classifyError, InMemoryDiagnosticsSink } from './diagnostics'
import type { AnswerRecord, ClassifierInput } from './diagnostics'

const base: Omit<ClassifierInput, 'givenAnswer'> = {
  skillId: 'aftrekken-wegnemen-5',
  op: '-',
  semanticForm: 'wegnemen',
  operandA: 5,
  operandB: 3,
  correctAnswer: 2,
}

describe('classifyError', () => {
  it('unclassified without a given answer', () => {
    expect(classifyError({ ...base })).toBe('unclassified')
  })

  it('off-by-one', () => {
    expect(classifyError({ ...base, givenAnswer: 1 })).toBe('off-by-one')
  })

  it('off-by-one wins over other matches (first match wins, by design)', () => {
    // given == operandB would also be a near-miss; |3 − 2| == 1 tags first
    expect(classifyError({ ...base, givenAnswer: 3 })).toBe('off-by-one')
  })

  it('reversal: added instead of subtracting', () => {
    expect(classifyError({ ...base, givenAnswer: 8 })).toBe('reversal')
  })

  it('semantic-narrow beats reversal on verschil problems', () => {
    expect(classifyError({ ...base, semanticForm: 'verschil', givenAnswer: 8 })).toBe('semantic-narrow')
  })

  it('near-miss: regurgitated an operand', () => {
    expect(classifyError({ ...base, operandA: 7, operandB: 3, correctAnswer: 4, givenAnswer: 7 })).toBe('near-miss')
  })

  it('split: echoing the shown/complementary part is a reversal', () => {
    expect(classifyError({
      skillId: 'splitsen-herken-5', op: 'split',
      operandA: 2, operandB: 3, correctAnswer: 5, givenAnswer: 2,
    })).toBe('reversal')
  })

  it('split: off-by-one is measured against the parts, not the total', () => {
    expect(classifyError({
      skillId: 'splitsen-herken-5', op: 'split',
      operandA: 1, operandB: 4, correctAnswer: 5, givenAnswer: 3,
    })).toBe('off-by-one') // |3 − 4| = 1; |3 − 5| would never be consulted
  })

  it('split: the total itself is not tagged as a near-miss artifact', () => {
    expect(classifyError({
      skillId: 'splitsen-herken-5', op: 'split',
      operandA: 1, operandB: 3, correctAnswer: 4, givenAnswer: 5,
    })).toBe('unclassified')
  })

  it('tienvriend-mismatch', () => {
    expect(classifyError({
      skillId: 'tienvrienden', op: 'split',
      operandA: 7, operandB: 3, correctAnswer: 10, givenAnswer: 5,
    })).toBe('tienvriend-mismatch')
  })

  it('count answers never tag near-miss on the operandB = 0 artifact', () => {
    expect(classifyError({
      skillId: 'getalbegrip-5', op: 'count',
      operandA: 4, operandB: 0, correctAnswer: 4, givenAnswer: 0,
    })).toBe('unclassified')
  })
})

describe('InMemoryDiagnosticsSink', () => {
  const rec = (profileId: string, skillId: string): AnswerRecord => ({
    timestamp: 1, profileId, skillId, exerciseId: 'x', op: '+',
    operandA: 1, operandB: 2, correctAnswer: 3, correct: true, errorType: null,
  })

  it('filters by profile and skill', () => {
    const sink = new InMemoryDiagnosticsSink()
    sink.record(rec('p1', 's1'))
    sink.record(rec('p1', 's2'))
    sink.record(rec('p2', 's1'))

    expect(sink.getAll()).toHaveLength(3)
    expect(sink.getAll('p1')).toHaveLength(2)
    expect(sink.getForSkill('p1', 's1')).toHaveLength(1)

    sink.clear()
    expect(sink.getAll()).toHaveLength(0)
  })
})
