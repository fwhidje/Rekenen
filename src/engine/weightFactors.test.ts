import { describe, it, expect } from 'vitest'
import { exerciseFactors, FACTOR_BUMP, FACTOR_CAP, FACTOR_DECAY, FACTOR_WINDOW } from './weightFactors'
import type { AnswerRecord } from './diagnostics'

let t = 0
function rec(exerciseId: string, correct: boolean, over: Partial<AnswerRecord> = {}): AnswerRecord {
  return {
    timestamp: ++t,
    profileId: 'p',
    skillId: 's1',
    exerciseId,
    op: '+',
    operandA: 1,
    operandB: 2,
    correctAnswer: 3,
    correct,
    errorType: correct ? null : 'unclassified',
    ...over,
  }
}

const factorOf = (records: AnswerRecord[], ex = 'ex-a') => exerciseFactors(records, 's1')[ex] ?? 1

describe('exerciseFactors', () => {
  it('neutral (1) with no records', () => {
    expect(factorOf([])).toBe(1)
  })

  it('bumps on wrong answers', () => {
    expect(factorOf([rec('ex-a', false)])).toBe(1 + FACTOR_BUMP)
    expect(factorOf([rec('ex-a', false), rec('ex-a', false)])).toBe(1 + 2 * FACTOR_BUMP)
  })

  it('decays on correct answers, floored at 1', () => {
    expect(factorOf([rec('ex-a', false), rec('ex-a', true)])).toBe(1 + FACTOR_BUMP - FACTOR_DECAY)
    // Two corrects fully decay one wrong; further corrects stay at the floor.
    expect(factorOf([rec('ex-a', false), rec('ex-a', true), rec('ex-a', true), rec('ex-a', true)])).toBe(1)
  })

  it('clamps at the cap', () => {
    const records = Array.from({ length: 10 }, () => rec('ex-a', false))
    expect(factorOf(records)).toBe(FACTOR_CAP)
  })

  it('correct answers below the floor do not bank credit (clamped per step)', () => {
    // 3 corrects first (still 1), then 1 wrong: factor = 1 + BUMP, not lower.
    const records = [rec('ex-a', true), rec('ex-a', true), rec('ex-a', true), rec('ex-a', false)]
    expect(factorOf(records)).toBe(1 + FACTOR_BUMP)
  })

  it('old answers age out of the window', () => {
    // Wrongs pushed out of the window by FACTOR_WINDOW corrects leave no trace.
    const records = [
      ...Array.from({ length: 5 }, () => rec('ex-a', false)),
      ...Array.from({ length: FACTOR_WINDOW }, () => rec('ex-a', true)),
    ]
    expect(factorOf(records)).toBe(1)
  })

  it('retries are excluded', () => {
    expect(factorOf([rec('ex-a', false, { isRetry: true })])).toBe(1)
  })

  it('is scoped per exercise and per skill', () => {
    const records = [rec('ex-a', false), rec('ex-b', true), rec('ex-c', false, { skillId: 's2' })]
    const factors = exerciseFactors(records, 's1')
    expect(factors['ex-a']).toBe(1 + FACTOR_BUMP)
    expect(factors['ex-b']).toBe(1)
    expect(factors['ex-c']).toBeUndefined()
  })
})
