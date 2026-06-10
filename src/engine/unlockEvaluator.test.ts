import { describe, it, expect } from 'vitest'
import '../exercises/index' // register the real exercises — gates need the registry
import { evaluateUnlocks } from './unlockEvaluator'
import { gateFamilies, PAR_MIN_ATTEMPTS } from './mastery'
import { SKILLS, SKILLS_BY_ID } from '../curriculum/skills'
import type { AnswerRecord } from './diagnostics'
import type { Profile } from '../state/types'

// Integration-grade: uses the real curriculum, registry and weight tables.

function freshProfile(): Profile {
  const skills: Profile['skills'] = {}
  for (const s of SKILLS) skills[s.id] = { score: 0, unlocked: false, archived: false }
  return { id: 'p', name: 'test', createdAt: 0, skills }
}

let t = 0
function rec(skillId: string, exerciseId: string): AnswerRecord {
  return {
    timestamp: ++t,
    profileId: 'p',
    skillId,
    exerciseId,
    op: 'count',
    operandA: 3,
    operandB: 0,
    correctAnswer: 3,
    correct: true,
    errorType: null,
    responseTimeMs: 1500,
  }
}

// Records meeting par for a skill: enough correct recent answers per gate family.
function parRecords(skillId: string): AnswerRecord[] {
  return gateFamilies(SKILLS_BY_ID[skillId]).flatMap(fam =>
    Array.from({ length: PAR_MIN_ATTEMPTS }, () => rec(skillId, fam)),
  )
}

describe('evaluateUnlocks', () => {
  it('unlocks the root skill on a fresh profile', () => {
    expect(evaluateUnlocks(freshProfile(), SKILLS, [])).toEqual(['getalbegrip-5'])
  })

  it('does not unlock downstream while the prerequisite lacks par evidence', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'].unlocked = true
    expect(evaluateUnlocks(profile, SKILLS, [])).toEqual([])
  })

  it('width matters: grinding one family does not unlock downstream', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'].unlocked = true
    const oneFamily = Array.from({ length: 100 }, () => rec('getalbegrip-5', 'count-and-tap'))
    expect(evaluateUnlocks(profile, SKILLS, oneFamily)).toEqual([])
  })

  it('unlocks downstream once the prerequisite is at par across families', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'].unlocked = true
    const unlocked = evaluateUnlocks(profile, SKILLS, parRecords('getalbegrip-5'))
    expect(unlocked).toContain('splitsen-herken-5')
    expect(unlocked).toContain('getalbegrip-10')
  })

  it('grandfathers archived prerequisites (no records needed)', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'] = { score: 100, unlocked: true, archived: true }
    const unlocked = evaluateUnlocks(profile, SKILLS, [])
    expect(unlocked).toContain('splitsen-herken-5')
  })

  it('a disabled prerequisite never satisfies, even if its state says unlocked', () => {
    const profile = freshProfile()
    // optellen-tot-5 hangs off +1-2-tot-5, which is WIP-gated (disabled)
    profile.skills['+1-2-tot-5'] = { score: 100, unlocked: true, archived: true }
    expect(evaluateUnlocks(profile, SKILLS, [])).not.toContain('optellen-tot-5')
  })
})
