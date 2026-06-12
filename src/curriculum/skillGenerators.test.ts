import { describe, it, expect } from 'vitest'
import { SKILLS_BY_ID } from './skills'

// Generator contracts for the +/− entry skills: ranges, score-gated fact
// shaping (operand flips post-60, "alles weg" damping early). Statistical
// assertions use wide margins so they never flake.

const N = 800

describe('+1-2-tot-5 generator', () => {
  const gen = SKILLS_BY_ID['+1-2-tot-5'].generate

  it('stays within the fact space and keeps the small addend second below 60', () => {
    for (let i = 0; i < N; i++) {
      const p = gen({ score: 30 })
      if (p.op !== '+') throw new Error('expected +')
      const [a, b] = p.terms
      expect(a + b).toBeLessThanOrEqual(5)
      expect(a).toBeGreaterThanOrEqual(1)
      expect([1, 2]).toContain(b)
    }
  })

  it('serves flipped (small-addend-first) forms at score 60+, but not always', () => {
    let flipped = 0
    for (let i = 0; i < N; i++) {
      const p = gen({ score: 80 })
      if (p.op !== '+') throw new Error('expected +')
      const [a, b] = p.terms
      if (b > 2) { flipped++; expect([1, 2]).toContain(a) }
    }
    expect(flipped).toBeGreaterThan(0)
    expect(flipped).toBeLessThan(N / 2)
  })
})

describe('splitsen-noteren-5 generator', () => {
  const gen = SKILLS_BY_ID['splitsen-noteren-5'].generate

  it('serves no 0-splits below score 30, does serve them after', () => {
    let zerosEarly = 0
    let zerosLate = 0
    for (let i = 0; i < N; i++) {
      const early = gen({ score: 0 })
      const late = gen({ score: 50 })
      if (early.op !== 'split' || late.op !== 'split') throw new Error('expected split')
      expect(early.partA + early.partB).toBeGreaterThanOrEqual(2)
      expect(early.partA + early.partB).toBeLessThanOrEqual(5)
      if (early.partA === 0 || early.partB === 0) zerosEarly++
      if (late.partA === 0 || late.partB === 0) zerosLate++
    }
    expect(zerosEarly).toBe(0)
    expect(zerosLate).toBeGreaterThan(0)
  })
})

describe('-1-2-tot-5 generator', () => {
  const gen = SKILLS_BY_ID['-1-2-tot-5'].generate

  it('stays within the fact space (part ≤ whole ≤ 5, part ∈ {1,2})', () => {
    for (let i = 0; i < N; i++) {
      const p = gen({ score: 50 })
      if (p.op !== '-') throw new Error('expected -')
      expect([1, 2]).toContain(p.part)
      expect(p.whole).toBeGreaterThanOrEqual(p.part)
      expect(p.whole).toBeLessThanOrEqual(5)
    }
  })

  it('damps the "alles weg" → 0 facts below score 30, serves them normally after', () => {
    let zerosEarly = 0
    let zerosLate = 0
    for (let i = 0; i < N; i++) {
      const early = gen({ score: 0 })
      const late = gen({ score: 50 })
      if (early.op === '-' && early.whole === early.part) zerosEarly++
      if (late.op === '-' && late.whole === late.part) zerosLate++
    }
    // uniform share would be 2/9 ≈ 22%; damped ×0.25 → ≈ 6.7%
    expect(zerosEarly / N).toBeLessThan(0.15)
    expect(zerosLate).toBeGreaterThan(0)
    expect(zerosLate).toBeGreaterThan(zerosEarly)
  })
})
