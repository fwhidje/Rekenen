import { describe, it, expect } from 'vitest'
import { judgePace, tapBaselineMs, PACE_DEFAULT_BASELINE_MS, PACE_BASELINE_MIN_MS, PACE_BASELINE_MAX_MS } from './pace'
import { recordAnswer } from '../state/storage'
import { exerciseFactors } from './weightFactors'
import type { AnswerRecord } from './diagnostics'
import type { Profile } from '../state/types'

const rec = (over: Partial<AnswerRecord>): AnswerRecord => ({
  timestamp: 0, profileId: 'p', skillId: 's', exerciseId: 'snel-weten', op: '+',
  operandA: 1, operandB: 1, correctAnswer: 2, correct: true, errorType: null, ...over,
} as AnswerRecord)

describe('pace', () => {
  it('uses the default baseline until there is a history', () => {
    expect(tapBaselineMs([])).toBe(PACE_DEFAULT_BASELINE_MS)
    expect(tapBaselineMs([rec({ answerMs: 900 }), rec({ answerMs: 950 })])).toBe(PACE_DEFAULT_BASELINE_MS)
  })

  it('takes the fast end of the recent correct, non-retry, timed answers', () => {
    const records = [
      ...Array.from({ length: 6 }, () => rec({ answerMs: 1000 })),
      ...Array.from({ length: 10 }, () => rec({ answerMs: 4000 })),
      rec({ answerMs: 200, correct: false }),   // wrong: ignored
      rec({ answerMs: 200, isRetry: true }),    // retry: ignored
      rec({}),                                  // not timed: ignored
    ]
    expect(tapBaselineMs(records)).toBe(1000)
  })

  it('clamps the baseline', () => {
    expect(tapBaselineMs(Array.from({ length: 20 }, () => rec({ answerMs: 100 })))).toBe(PACE_BASELINE_MIN_MS)
    expect(tapBaselineMs(Array.from({ length: 20 }, () => rec({ answerMs: 9000 })))).toBe(PACE_BASELINE_MAX_MS)
  })

  it('judges only correct, first-attempt, time-aware answers', () => {
    expect(judgePace({ marginMs: 1500, answerMs: 2000, correct: true }, [])).toBe('fast')
    expect(judgePace({ marginMs: 1500, answerMs: 3500, correct: true }, [])).toBe('slow')
    expect(judgePace({ marginMs: 1500, answerMs: 9000, correct: false }, [])).toBeUndefined()
    expect(judgePace({ marginMs: 1500, answerMs: 9000, correct: true, isRetry: true }, [])).toBeUndefined()
    expect(judgePace({ answerMs: 9000, correct: true }, [])).toBeUndefined()
    expect(judgePace({ marginMs: 1500, correct: true }, [])).toBeUndefined()
  })

  it('a slow correct answer leaves the score and the weight factor alone', () => {
    const profile = { id: 'p', name: 'x', skills: { 'getalbegrip-5': { score: 40, unlocked: true, archived: false } } } as unknown as Profile
    expect(recordAnswer(profile, 'getalbegrip-5', true, { counts: false }).skills['getalbegrip-5'].score).toBe(40)
    expect(recordAnswer(profile, 'getalbegrip-5', true).skills['getalbegrip-5'].score).toBe(41)
    const wrong = rec({ correct: false })
    const slow = rec({ pace: 'slow' })
    expect(exerciseFactors([wrong, slow, slow], 's')['snel-weten']).toBe(exerciseFactors([wrong], 's')['snel-weten'])
  })
})
