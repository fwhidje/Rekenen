import { describe, it, expect } from 'vitest'
import {
  sampleFact, reweight,
  enumerateSplits, enumeratePlus, enumerateMinus,
  type WeightedFact,
} from './factSampling'
import type { Problem } from './types'

describe('enumerateSplits', () => {
  it('enumerates one fact per (total, partA) without zero parts', () => {
    const facts = enumerateSplits(2, 5)
    // totals 2..5 → 1 + 2 + 3 + 4 splits
    expect(facts).toHaveLength(10)
    for (const [p] of facts) {
      expect(p.op).toBe('split')
      expect(p.partA).toBeGreaterThanOrEqual(1)
      expect(p.partB).toBeGreaterThanOrEqual(1)
      expect(p.partA + p.partB).toBeGreaterThanOrEqual(2)
      expect(p.partA + p.partB).toBeLessThanOrEqual(5)
    }
  })

  it('includes the two 0-splits per total when asked', () => {
    const facts = enumerateSplits(2, 5, { includeZero: true })
    // totals 2..5 → 3 + 4 + 5 + 6
    expect(facts).toHaveLength(18)
    const zeroFacts = facts.filter(([p]) => p.partA === 0 || p.partB === 0)
    expect(zeroFacts).toHaveLength(8)
  })
})

describe('enumeratePlus', () => {
  it('covers a+1 (a=1..4) and a+2 (a=1..3) for maxSum 5', () => {
    const facts = enumeratePlus(5, [1, 2])
    expect(facts).toHaveLength(7)
    for (const [p] of facts) {
      expect(p.terms[0] + p.terms[1]).toBeLessThanOrEqual(5)
      expect(p.terms[0]).toBeGreaterThanOrEqual(1)
      expect([1, 2]).toContain(p.terms[1])
    }
  })
})

describe('enumerateMinus', () => {
  it('covers a−1 (a=1..5) and a−2 (a=2..5), incl. a−a=0 facts', () => {
    const facts = enumerateMinus(5, [1, 2])
    expect(facts).toHaveLength(9)
    const zeroResults = facts.filter(([p]) => p.whole === p.part)
    expect(zeroResults).toHaveLength(2) // 1−1 and 2−2
  })
})

describe('sampleFact', () => {
  it('draws facts proportionally to their weights', () => {
    const a: Problem = { op: 'count', n: 1 }
    const b: Problem = { op: 'count', n: 2 }
    const facts: WeightedFact[] = [[a, 1], [b, 3]]
    let bCount = 0
    const N = 8000
    for (let i = 0; i < N; i++) {
      if (sampleFact(facts) === b) bCount++
    }
    expect(bCount / N).toBeGreaterThan(0.70)
    expect(bCount / N).toBeLessThan(0.80)
  })

  it('gives fact-count-proportional total shares over an enumerated space', () => {
    const facts = enumerateSplits(2, 5) // total 5 holds 4 of 10 facts
    let fives = 0
    const N = 8000
    for (let i = 0; i < N; i++) {
      const p = sampleFact(facts)
      if (p.partA + p.partB === 5) fives++
    }
    expect(fives / N).toBeGreaterThan(0.35)
    expect(fives / N).toBeLessThan(0.45)
  })

  it('never draws a zero-weighted fact', () => {
    const a: Problem = { op: 'count', n: 1 }
    const b: Problem = { op: 'count', n: 2 }
    const facts = reweight([[a, 1], [b, 1]] as WeightedFact[], f =>
      f.op === 'count' && f.n === 1 ? 0 : 1)
    for (let i = 0; i < 200; i++) {
      expect(sampleFact(facts)).toBe(b)
    }
  })
})

describe('reweight', () => {
  it('multiplies weights per fact', () => {
    const facts = enumerateSplits(2, 3)
    const nudged = reweight(facts, p => (p.partA + p.partB === 3 ? 2 : 1))
    expect(nudged.find(([p]) => p.partA + p.partB === 2)?.[1]).toBe(1)
    expect(nudged.find(([p]) => p.partA + p.partB === 3)?.[1]).toBe(2)
  })
})
