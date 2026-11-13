import { describe, it, expect } from 'vitest'
import '../exercises/index' // register everything, as the app would
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { SKILLS } from '../curriculum/skills'
import { computeAnswer, problemOperands } from './answer'
import type { ExerciseQuestion } from '../exercises/types'
import { buildAnswerRecord, SESSION_ID } from './answerRecord'
import { createProfile } from '../state/storage'

// The answer record is the evidence schema that leaves the device (see
// road_to_ai_driven_rekenen.md). These tests pin three properties of it:
// it survives JSON transport unchanged, it stays small enough to store per
// answer, and it never carries the child's name.

const SENTINEL_NAME = 'Zeldzame-Naam-Qx7'
const MAX_META_BYTES = 8_000 // the server rejects larger (supabase migration 0001)
const SCORES = [0, 45, 75, 95]

function questionFor(skillIdx: number, exId: string, score: number): ExerciseQuestion | null {
  const skill = SKILLS[skillIdx]
  const def = getExercise(exId)
  const problem = skill.generate({ score })
  const { a, b } = problemOperands(problem)
  if (def.isCompatible && !def.isCompatible(a, b)) return null
  return {
    exerciseId: exId,
    skillId: skill.id,
    problem,
    operandA: a,
    operandB: b,
    op: problem.op,
    answer: computeAnswer(problem),
    meta: def.generateMeta(a, b, score, problem),
  }
}

describe('buildAnswerRecord', () => {
  const profile = createProfile(SENTINEL_NAME)
  const registered = new Set(getAllExerciseIds())

  it('stamps identity, version, session and the score before the answer', () => {
    const question = questionFor(0, SKILLS[0].applicableExercises.find(e => registered.has(e))!, 0)!
    const r = buildAnswerRecord({
      profileId: profile.id, question, correct: false, detail: { givenAnswer: 99 },
      scoreBefore: 17, startedAt: 1_000, now: 4_500,
    })
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(r.sessionId).toBe(SESSION_ID)
    expect(r.appVersion).toBe('dev')
    expect(r.scoreBefore).toBe(17)
    expect(r.responseTimeMs).toBe(3_500)
    expect(r.problem).toEqual(question.problem)
    expect(r.givenAnswer).toBe(99)
    expect(r.errorType).not.toBeNull()
  })

  it('gives every record its own id', () => {
    const question = questionFor(0, SKILLS[0].applicableExercises.find(e => registered.has(e))!, 0)!
    const mk = () => buildAnswerRecord({ profileId: profile.id, question, correct: true, scoreBefore: 0, startedAt: 0 })
    expect(mk().id).not.toBe(mk().id)
  })

  for (const [skillIdx, skill] of SKILLS.entries()) {
    for (const exId of skill.applicableExercises) {
      if (!registered.has(exId)) continue
      it(`${skill.id} × ${exId}: JSON-safe, bounded, name-free`, () => {
        for (const score of SCORES) {
          const question = questionFor(skillIdx, exId, score)
          if (!question) continue
          const r = buildAnswerRecord({
            profileId: profile.id, question, correct: true,
            scoreBefore: score, semanticForm: skill.semanticForm, startedAt: 0, now: 1,
          })
          const json = JSON.stringify(r)
          // Transport-safe: what was shown survives a JSON round trip
          // (no functions, components, Maps/Sets, NaN, …).
          expect(JSON.parse(JSON.stringify(r.meta))).toEqual(r.meta)
          expect(JSON.stringify(r.meta).length).toBeLessThan(MAX_META_BYTES)
          // Privacy: the child's name never enters the evidence stream.
          expect(json).not.toContain(SENTINEL_NAME)
        }
      })
    }
  }
})
