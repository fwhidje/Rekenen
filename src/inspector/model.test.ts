import { describe, it, expect } from 'vitest'
import '../exercises/index'
import { SKILLS } from '../curriculum/skills'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { computeAnswer, problemOperands } from '../engine/answer'
import { buildAnswerRecord } from '../engine/answerRecord'
import { toEventRow } from '../sync/rows'
import {
  answerText, applyFilter, formatProblem, linkRetries, periodStart, resolveScene, rowForSharing, rowToQuestion, summarise,
} from './model'
import type { EventRow } from './model'

// A real row, built the way the app builds and uploads one.
function makeRow(over: Partial<EventRow> = {}): EventRow {
  const skill = SKILLS[0]
  const exId = skill.applicableExercises.find(id => getAllExerciseIds().includes(id))!
  const problem = skill.generate({ score: 0 })
  const { a, b } = problemOperands(problem)
  const question = {
    exerciseId: exId, skillId: skill.id, problem, operandA: a, operandB: b, op: problem.op,
    answer: computeAnswer(problem), meta: getExercise(exId).generateMeta(a, b, 0, problem),
  }
  const rec = buildAnswerRecord({
    profileId: 'child-1', question, correct: true, scoreBefore: 0, startedAt: 0,
    scene: { theme: 'space', background: 1, counter: 2 }, viewport: { w: 390, h: 844 },
  })
  return { ...toEventRow(rec), ...over }
}

let t = 0
const at = () => new Date(Date.UTC(2026, 10, 14, 9, 0, t++)).toISOString()

describe('filters', () => {
  const ok = makeRow({ occurred_at: at() })
  const wrong = makeRow({ occurred_at: at(), correct: false })
  const flagged = makeRow({ occurred_at: at(), flag: 'flagged' })
  const rows = [ok, wrong, flagged]

  it('review = wrong or flagged', () => {
    expect(applyFilter(rows, { view: 'review', exercise: null, skill: null })).toEqual([wrong, flagged])
    expect(applyFilter(rows, { view: 'flagged', exercise: null, skill: null })).toEqual([flagged])
    expect(applyFilter(rows, { view: 'wrong', exercise: null, skill: null })).toEqual([wrong])
    expect(applyFilter(rows, { view: 'all', exercise: 'nope', skill: null })).toEqual([])
  })

  it('treats a row from before migration 0002 (no flag column) as unflagged', () => {
    const { flag: _f, ...old } = ok
    expect(applyFilter([old as EventRow], { view: 'flagged', exercise: null, skill: null })).toEqual([])
  })

  it('period starts at local midnight', () => {
    const now = new Date(2026, 10, 14, 15, 30)
    expect(new Date(periodStart('today', now)!).getHours()).toBe(0)
    expect(new Date(periodStart('7', now)!).getDate()).toBe(8)
    expect(periodStart('all', now)).toBeNull()
  })
})

describe('retry pairing', () => {
  it('links a retry to the wrong answer just before it in the same session', () => {
    const first = makeRow({ id: 'a', occurred_at: at(), correct: false, session_id: 's1' })
    const retry = makeRow({ id: 'b', occurred_at: at(), is_retry: true, session_id: 's1' })
    const other = makeRow({ id: 'c', occurred_at: at(), is_retry: true, session_id: 's2' })
    const links = linkRetries([retry, other, first]) // order-independent
    expect(links.retryOf.get('b')?.id).toBe('a')
    expect(links.retriedBy.get('a')?.id).toBe('b')
    expect(links.retryOf.has('c')).toBe(false)
  })
})

describe('summary', () => {
  it('counts first attempts only, flags on all, and sorts flags first', () => {
    const rows = [
      makeRow({ id: '1', exercise_id: 'x', correct: false }),
      makeRow({ id: '2', exercise_id: 'x', is_retry: true, correct: false, flag: 'flagged' }),
      makeRow({ id: '3', exercise_id: 'y', correct: false }),
      makeRow({ id: '4', exercise_id: 'y', correct: false }),
    ]
    const [first, second] = summarise(rows)
    expect(first).toMatchObject({ exerciseId: 'x', answers: 1, wrong: 1, flagged: 1 })
    expect(second).toMatchObject({ exerciseId: 'y', answers: 2, wrong: 2, flagged: 0 })
  })
})

describe('replay', () => {
  it('rebuilds the exact question from a stored row', () => {
    const row = makeRow()
    const r = rowToQuestion(row, false)
    expect(r.kind).toBe('exact')
    if (r.kind !== 'exact') return
    expect(r.question.meta).toEqual(row.meta)
    expect(r.question.problem).toEqual(row.problem)
    expect(r.question.answer).toBe(row.correct_answer)
  })

  it('without meta: refuses, or approximates when asked', () => {
    const row = makeRow({ meta: null })
    expect(rowToQuestion(row, false).kind).toBe('impossible')
    expect(rowToQuestion(row, true).kind).toBe('approx')
  })

  it('unknown exercise or missing problem cannot replay', () => {
    expect(rowToQuestion(makeRow({ exercise_id: 'weg' }), true).kind).toBe('impossible')
    expect(rowToQuestion(makeRow({ problem: null }), true).kind).toBe('impossible')
  })

  it('resolves the recorded scene, and falls back when absent', () => {
    expect(resolveScene(makeRow())).toMatchObject({ background: 1, counter: 2, recorded: true })
    expect(resolveScene(makeRow({ scene_theme: null }))).toMatchObject({ themeIdx: 0, recorded: false })
  })
})

describe('sharing', () => {
  it('formats problems and leaves the child id out of a shared row', () => {
    expect(formatProblem({ op: '-', whole: 5, part: 2 }, { a: 0, b: 0, op: '-' })).toBe('5 − 2')
    expect(formatProblem({ op: 'split', partA: 2, partB: 3 }, { a: 0, b: 0, op: 'split' })).toBe('5 is 2 en 3')
    const split = makeRow({ op: 'split', correct: false, given_answer: 2, correct_answer: 5 })
    expect(answerText(split)).toBe('gaf 2 (fout)')        // never "juist 5": 5 is the total
    expect(answerText(makeRow({ op: '+', correct: false, given_answer: 4, correct_answer: 3 }))).toBe('gaf 4, juist 3')
    const shared = JSON.stringify(rowForSharing(makeRow()))
    expect(shared).not.toContain('child-1')
  })
})
