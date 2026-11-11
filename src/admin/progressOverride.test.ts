import { describe, it, expect } from 'vitest'
import {
  planOverride, prerequisites, blockedBy, canOverride,
  DIRECT_PREREQ_SCORE, DEEP_PREREQ_SCORE, MASTERED_SCORE, OPEN_TARGET_SCORE,
} from './progressOverride'
import { layoutSkillTree } from './skillTreeLayout'
import { SKILLS } from '../curriculum/skills'
import { SCORE_MAX } from '../engine/scoring'
import { createProfile } from '../state/storage'
import type { Profile } from '../state/types'

// Runs against the real curriculum graph, like the engine tests.

const NOW = 1_000_000

function fresh(): Profile {
  return createProfile('test')
}

function scoreOf(p: Profile, id: string) { return p.skills[id].score }

describe('prerequisites', () => {
  it('splits direct prereqs from deeper ancestors', () => {
    expect(prerequisites('+1-2-tot-5')).toEqual({ direct: ['splitsen-herken-5'], deeper: ['getalbegrip-5'] })
  })

  it('a root has none', () => {
    expect(prerequisites('getalbegrip-5')).toEqual({ direct: [], deeper: [] })
  })

  it('no skill has a direct prereq that is also a deeper ancestor (the 60-vs-90 overlap)', () => {
    // planOverride resolves an overlap as direct; this tripwire says whether
    // that resolution is ever exercised. If it fires, check it is intended.
    for (const s of SKILLS) {
      const { direct } = prerequisites(s.id)
      for (const p of direct) {
        const viaOthers = direct.filter(q => q !== p).some(q => {
          const { direct: d, deeper } = prerequisites(q)
          return d.includes(p) || deeper.includes(p)
        })
        expect(viaOthers, `${s.id}: ${p}`).toBe(false)
      }
    }
  })
})

describe('blockedBy / canOverride', () => {
  it('a disabled skill is blocked by itself', () => {
    expect(blockedBy('optellen-tot-5')).toContain('optellen-tot-5')
    expect(canOverride('optellen-tot-5')).toBe(false)
  })

  it('a skill behind a disabled prereq is blocked by that prereq', () => {
    expect(blockedBy('+1-2-tot-10')).toEqual(['optellen-tot-5'])
    expect(canOverride('+1-2-tot-10')).toBe(false)
  })

  it('an unknown id cannot be overridden', () => {
    expect(canOverride('nope')).toBe(false)
  })

  it('refuses to plan a blocked skill', () => {
    expect(() => planOverride(fresh(), 'optellen-tot-5', 'open', NOW)).toThrow()
  })
})

describe("planOverride 'open'", () => {
  it('target 0 + unlocked, direct prereq 60, deeper ancestor 90', () => {
    const { profile } = planOverride(fresh(), '+1-2-tot-5', 'open', NOW)
    expect(profile.skills['+1-2-tot-5']).toMatchObject({ score: OPEN_TARGET_SCORE, unlocked: true, archived: false })
    expect(profile.skills['splitsen-herken-5']).toMatchObject({ score: DIRECT_PREREQ_SCORE, unlocked: true })
    expect(profile.skills['getalbegrip-5']).toMatchObject({ score: DEEP_PREREQ_SCORE, unlocked: true })
  })

  it('the cascade opens siblings whose prereqs are now met, at their current score', () => {
    const plan = planOverride(fresh(), '+1-2-tot-5', 'open', NOW)
    for (const id of ['-1-2-tot-5', 'splitsen-noteren-5', 'getalbegrip-10']) {
      expect(plan.profile.skills[id]).toMatchObject({ unlocked: true, score: 0 })
      expect(plan.changes.find(c => c.skillId === id)?.role).toBe('cascade')
    }
    // ...but never a disabled one
    expect(plan.profile.skills['splitsen-tot-10'].unlocked).toBe(false)
  })

  it('prereq scores are raise-only', () => {
    const start = fresh()
    start.skills['getalbegrip-5'] = { score: 97, unlocked: true, archived: false }
    start.skills['splitsen-herken-5'] = { score: 75, unlocked: true, archived: false }
    const { profile } = planOverride(start, '+1-2-tot-5', 'open', NOW)
    expect(scoreOf(profile, 'getalbegrip-5')).toBe(97)
    expect(scoreOf(profile, 'splitsen-herken-5')).toBe(75)
  })

  it('an already-progressed target goes back to 0 and the change records the drop', () => {
    const start = planOverride(fresh(), '+1-2-tot-5', 'open', NOW).profile
    start.skills['+1-2-tot-5'] = { ...start.skills['+1-2-tot-5'], score: 40 }
    const plan = planOverride(start, '+1-2-tot-5', 'open', NOW)
    const change = plan.changes.find(c => c.skillId === '+1-2-tot-5')!
    expect(change.before.score).toBe(40)
    expect(change.after.score).toBe(0)
  })

  it('opening an archived target un-archives it', () => {
    const start = fresh()
    start.skills['getalbegrip-5'] = { score: SCORE_MAX, unlocked: true, archived: true, archivedAt: 5 }
    const { profile } = planOverride(start, 'getalbegrip-5', 'open', NOW)
    expect(profile.skills['getalbegrip-5']).toMatchObject({ score: 0, archived: false })
    expect(profile.skills['getalbegrip-5'].archivedAt).toBeUndefined()
  })

  it('an archived prereq stays archived', () => {
    const start = fresh()
    start.skills['getalbegrip-5'] = { score: SCORE_MAX, unlocked: true, archived: true }
    const { profile } = planOverride(start, '+1-2-tot-5', 'open', NOW)
    expect(profile.skills['getalbegrip-5']).toMatchObject({ score: SCORE_MAX, archived: true })
  })

  it('writes nothing that archives (90 < SCORE_MAX)', () => {
    const { profile } = planOverride(fresh(), '-1-2-tot-5', 'open', NOW)
    expect(SKILLS.filter(s => profile.skills[s.id].archived)).toEqual([])
  })

  it('stamps unlockedAt only on newly unlocked skills', () => {
    const start = fresh()
    const rootUnlockedAt = start.skills['getalbegrip-5'].unlockedAt
    const { profile } = planOverride(start, 'splitsen-herken-5', 'open', NOW)
    expect(profile.skills['getalbegrip-5'].unlockedAt).toBe(rootUnlockedAt)
    expect(profile.skills['splitsen-herken-5'].unlockedAt).toBe(NOW)
  })

  it('is idempotent', () => {
    const once = planOverride(fresh(), '+1-2-tot-5', 'open', NOW).profile
    const twice = planOverride(once, '+1-2-tot-5', 'open', NOW)
    expect(twice.changes).toEqual([])
    expect(twice.profile.skills).toEqual(once.skills)
  })

  it('does not mutate the input profile', () => {
    const start = fresh()
    const snapshot = JSON.stringify(start)
    planOverride(start, '+1-2-tot-5', 'open', NOW)
    expect(JSON.stringify(start)).toBe(snapshot)
  })
})

describe("planOverride 'mastered'", () => {
  it('target and every ancestor go to 90', () => {
    const { profile } = planOverride(fresh(), 'getalbegrip-10', 'mastered', NOW)
    expect(profile.skills['getalbegrip-10']).toMatchObject({ score: MASTERED_SCORE, unlocked: true })
    expect(scoreOf(profile, 'getalbegrip-5')).toBe(MASTERED_SCORE)

    const deep = planOverride(fresh(), '+1-2-tot-5', 'mastered', NOW).profile
    expect(scoreOf(deep, '+1-2-tot-5')).toBe(MASTERED_SCORE)
    expect(scoreOf(deep, 'splitsen-herken-5')).toBe(MASTERED_SCORE)
    expect(scoreOf(deep, 'getalbegrip-5')).toBe(MASTERED_SCORE)
  })

  it('is raise-only on the target too', () => {
    const start = planOverride(fresh(), 'getalbegrip-10', 'open', NOW).profile
    start.skills['getalbegrip-10'] = { ...start.skills['getalbegrip-10'], score: 95 }
    expect(scoreOf(planOverride(start, 'getalbegrip-10', 'mastered', NOW).profile, 'getalbegrip-10')).toBe(95)
  })

  it('restores a mixed state when combined with open (the recovery use case)', () => {
    let p = fresh()
    p = planOverride(p, '+1-2-tot-5', 'open', NOW).profile
    p = planOverride(p, 'getalbegrip-10', 'mastered', NOW).profile
    expect(scoreOf(p, '+1-2-tot-5')).toBe(0)
    expect(scoreOf(p, 'getalbegrip-10')).toBe(MASTERED_SCORE)
    expect(scoreOf(p, 'splitsen-herken-5')).toBe(DIRECT_PREREQ_SCORE)
    expect(scoreOf(p, 'getalbegrip-5')).toBe(MASTERED_SCORE)
  })
})

describe('layoutSkillTree', () => {
  const layout = layoutSkillTree()

  it('places every skill exactly once', () => {
    expect(layout.nodes.map(n => n.id).sort()).toEqual(SKILLS.map(s => s.id).sort())
    expect(layout.rows.flat().sort()).toEqual(SKILLS.map(s => s.id).sort())
  })

  it('no two nodes share a position', () => {
    const keys = layout.nodes.map(n => `${n.row}:${n.x.toFixed(4)}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every prerequisite sits in a row above the skill it unlocks', () => {
    const row = new Map(layout.nodes.map(n => [n.id, n.row]))
    for (const e of layout.edges) expect(row.get(e.from)!, `${e.from} → ${e.to}`).toBeLessThan(row.get(e.to)!)
  })

  it('one edge per unlockedBy entry', () => {
    expect(layout.edges.length).toBe(SKILLS.reduce((n, s) => n + s.unlockedBy.length, 0))
  })
})
