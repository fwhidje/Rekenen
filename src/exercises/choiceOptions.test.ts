import { describe, it, expect } from 'vitest'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'

describe('makeNumeralOptions', () => {
  it('always contains the correct answer, 4 distinct options, within range', () => {
    for (let run = 0; run < 200; run++) {
      const max = run % 2 === 0 ? 5 : 10
      const correct = 1 + Math.floor(Math.random() * max)
      const options = makeNumeralOptions(correct, max)
      expect(options).toContain(correct)
      expect(new Set(options).size).toBe(4)
      for (const v of options) {
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(max)
      }
    }
  })

  it('respects a custom minimum (number line includes 0)', () => {
    for (let run = 0; run < 50; run++) {
      const options = makeNumeralOptions(1, 5, 0)
      for (const v of options) expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('range convention: tot-5 quantities stay within 5', () => {
    expect(numeralRangeMax(3)).toBe(5)
    expect(numeralRangeMax(5)).toBe(5)
    expect(numeralRangeMax(6)).toBe(10)
  })
})
