import { describe, it, expect } from 'vitest'
import { evaluateUnlocks } from './unlockEvaluator'
import { UNLOCK_THRESHOLD } from './scoring'
import { SKILLS } from '../curriculum/skills'
import type { Profile } from '../state/types'

// Runs against the real curriculum graph.

function freshProfile(): Profile {
  const skills: Profile['skills'] = {}
  for (const s of SKILLS) skills[s.id] = { score: 0, unlocked: false, archived: false }
  return { id: 'p', name: 'test', createdAt: 0, skills }
}

describe('evaluateUnlocks', () => {
  it('unlocks the root skill on a fresh profile', () => {
    expect(evaluateUnlocks(freshProfile(), SKILLS)).toEqual(['getalbegrip-5'])
  })

  it('does not unlock downstream below the threshold', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'] = { score: UNLOCK_THRESHOLD - 1, unlocked: true, archived: false }
    expect(evaluateUnlocks(profile, SKILLS)).toEqual([])
  })

  it('unlocks downstream at the threshold', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'] = { score: UNLOCK_THRESHOLD, unlocked: true, archived: false }
    const unlocked = evaluateUnlocks(profile, SKILLS)
    expect(unlocked).toContain('splitsen-herken-5')
    expect(unlocked).toContain('getalbegrip-10')
  })

  it('a high score without unlocked does not satisfy (locked prereqs stay gates)', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'] = { score: 100, unlocked: false, archived: false }
    expect(evaluateUnlocks(profile, SKILLS)).toEqual(['getalbegrip-5'])
  })

  it('archived prerequisites satisfy (score capped at 100)', () => {
    const profile = freshProfile()
    profile.skills['getalbegrip-5'] = { score: 100, unlocked: true, archived: true }
    const unlocked = evaluateUnlocks(profile, SKILLS)
    expect(unlocked).toContain('splitsen-herken-5')
  })

  it('a disabled prerequisite never satisfies, even if its state says unlocked', () => {
    const profile = freshProfile()
    // dubbels-tot-10 hangs off optellen-tot-10, which is WIP-gated (disabled)
    profile.skills['optellen-tot-10'] = { score: 100, unlocked: true, archived: true }
    expect(evaluateUnlocks(profile, SKILLS)).not.toContain('dubbels-tot-10')
  })
})
