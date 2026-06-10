import { describe, it, expect } from 'vitest'
import { selectExercise } from './exerciseSelector'
import { registerExercise } from '../exercises/registry'
import { pickTier } from '../exercises/tiers'
import type { ExerciseTier } from '../exercises/types'
import type { Problem, SkillDefinition, WeightFunction } from '../curriculum/types'
import type { Profile } from '../state/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TIERS: ExerciseTier[] = [
  { id: 'lo', label: 'lo', minScore: 0, description: '' },
  { id: 'hi', label: 'hi', minScore: 50, description: '' },
]

registerExercise({
  id: 'sel-ex',
  label: 'sel',
  supportsReveal: false,
  tiers: TIERS,
  didactics: { goal: '', pitfalls: [], progression: '' },
  generateMeta: (_a: number, _b: number, score: number) => ({ tierId: pickTier(TIERS, score).id }),
  Component: () => null,
})

function mkSkill(id: string, generate: () => Problem): SkillDefinition {
  return {
    id,
    name: id,
    intent: '',
    didactics: { startingPoint: '', goal: '', pitfalls: [] },
    op: '+',
    unlockedBy: [],
    unlocks: [],
    subsumedBy: null,
    applicableExercises: ['sel-ex'],
    generate,
  }
}

function mkProfile(scores: Record<string, number>): Profile {
  const skills: Profile['skills'] = {}
  for (const [id, score] of Object.entries(scores)) {
    skills[id] = { score, unlocked: true, archived: false }
  }
  return { id: 'p', name: 'test', createdAt: 0, skills }
}

const weighted: WeightFunction = () => ({ 'sel-ex': 10 })

// ─── Retry ────────────────────────────────────────────────────────────────────

describe('retry', () => {
  const skill = mkSkill('s1', () => ({ op: '+', terms: [1, 2] }))

  it('re-presents the same problem one tier down', () => {
    const profile = mkProfile({ s1: 60 })
    const original = selectExercise(profile, [skill], weighted)
    expect(original).not.toBeNull()
    expect((original!.meta as { tierId: string }).tierId).toBe('hi')

    const retry = selectExercise(profile, [skill], weighted, { retry: original! })
    expect(retry!.isRetry).toBe(true)
    expect(retry!.operandA).toBe(original!.operandA)
    expect(retry!.operandB).toBe(original!.operandB)
    expect((retry!.meta as { tierId: string }).tierId).toBe('lo')
  })

  it('stays at the lowest tier when already there', () => {
    const profile = mkProfile({ s1: 0 })
    const original = selectExercise(profile, [skill], weighted)
    const retry = selectExercise(profile, [skill], weighted, { retry: original! })
    expect((retry!.meta as { tierId: string }).tierId).toBe('lo')
  })
})

// ─── Pool re-draw ─────────────────────────────────────────────────────────────

describe('skill pool', () => {
  it('re-draws another skill instead of returning null when one is unplayable', () => {
    const good = mkSkill('good', () => ({ op: '+', terms: [1, 2] }))
    const bad = mkSkill('bad', () => ({ op: '+', terms: [1, 2] }))
    const profile = mkProfile({ good: 0, bad: 0 })
    const weights: WeightFunction = skillId => (skillId === 'good' ? { 'sel-ex': 10 } : { 'sel-ex': 0 })

    for (let i = 0; i < 25; i++) {
      const q = selectExercise(profile, [good, bad], weights)
      expect(q?.skillId).toBe('good')
    }
  })

  it('returns null only when the whole pool is exhausted', () => {
    const bad = mkSkill('only-bad', () => ({ op: '+', terms: [1, 2] }))
    const profile = mkProfile({ 'only-bad': 0 })
    expect(selectExercise(profile, [bad], () => ({}))).toBeNull()
  })
})

// ─── Repeat avoidance ─────────────────────────────────────────────────────────

describe('repeat avoidance', () => {
  it('re-rolls past an immediate repeat of the previous problem', () => {
    const p1: Problem = { op: '+', terms: [1, 1] }
    const p2: Problem = { op: '+', terms: [2, 1] }
    const draws = [p1, p1, p2] // first draws repeat the last question, then differ
    let i = 0
    const skill = mkSkill('s-rep', () => draws[Math.min(i++, draws.length - 1)])
    const profile = mkProfile({ 's-rep': 0 })
    const last = selectExercise(profile, [skill], weighted)!
    expect(last.problem).toEqual(p1)

    const next = selectExercise(profile, [skill], weighted, { lastQuestion: last })
    expect(next!.problem).toEqual(p2)
  })

  it('accepts a repeat when the generator has nothing else (better than not playing)', () => {
    const p1: Problem = { op: '+', terms: [1, 1] }
    const skill = mkSkill('s-mono', () => p1)
    const profile = mkProfile({ 's-mono': 0 })
    const last = selectExercise(profile, [skill], weighted)!
    const next = selectExercise(profile, [skill], weighted, { lastQuestion: last })
    expect(next).not.toBeNull()
    expect(next!.problem).toEqual(p1)
  })
})
