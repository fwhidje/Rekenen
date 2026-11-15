/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import './index' // register everything, as the app would
import { getExercise, getAllExerciseIds } from './registry'
import { SKILLS } from '../curriculum/skills'
import { computeAnswer, problemOperands } from '../engine/answer'
import { buildRetry } from '../engine/exerciseSelector'
import { FEEDBACK, wrongFeedbackText } from '../presentation/feedback'
import type { ExerciseQuestion } from './types'

// ─── Exercise behaviour conventions — tripwire ───────────────────────────────
// CLAUDE.md → "Exercise behaviour conventions" states the rules; this file
// enforces the checkable half:
//   W  wrong-answer text   — declared (`correctStatement`), never a split's total
//   R  retry               — declared (`retryStable`) and really preserved
//   C  closure             — answers go through useClosure, never onResolve directly
//   Q  quantities          — groups come from the shared 5-row / die components,
//                            never from a free-wrapping container
// (L, "nothing moves / fits the screen", needs a real browser — see CLAUDE.md.)
//
// PENDING_AUDIT is the to-do list: exercises that have NOT yet been checked
// against the conventions (they predate them). Checking one = bring it in line,
// declare `retryStable` + `correctStatement`, route its answers through
// useClosure, verify L in a browser, and delete its id here. A new exercise
// never goes on this list.

const PENDING_AUDIT = new Set<string>([
  // getalbegrip
  'count-and-tap', 'dot-pattern-recognise', 'finger-pattern-recognise', 'numberline-place',
  'compare-more-less', 'compare-pick', 'ten-frame-show', 'number-sequence-order',
  'show-me-on-ten-frame', 'numberline-read', 'quantity-match', 'subitise-flash',
  // splitsen herkennen
  'dot-pattern-decompose', 'splits-frame', 'splits-herken-huisje', 'splits-build-it',
  'splits-shuffle', 'same-split-or-different', 'splits-match',
])

const registered = getAllExerciseIds()
const audited = registered.filter(id => !PENDING_AUDIT.has(id))

const SCORES = [0, 25, 45, 62, 75, 95]
const DRAWS = 6

// Every question the app can serve for an exercise: each skill that lists it,
// across the score bands (so every tier), a few random facts each.
function questionsFor(exId: string): ExerciseQuestion[] {
  const def = getExercise(exId)
  const out: ExerciseQuestion[] = []
  for (const skill of SKILLS) {
    if (!skill.applicableExercises.includes(exId)) continue
    for (const score of SCORES) {
      for (let d = 0; d < DRAWS; d++) {
        const problem = skill.generate({ score })
        const { a, b } = problemOperands(problem)
        if (def.isCompatible && !def.isCompatible(a, b)) continue
        out.push({
          exerciseId: exId, skillId: skill.id, problem, operandA: a, operandB: b,
          op: problem.op, answer: computeAnswer(problem),
          meta: def.generateMeta(a, b, score, problem),
        })
      }
    }
  }
  return out
}

describe('conventions — audit list', () => {
  it('lists only registered exercises', () => {
    const stale = [...PENDING_AUDIT].filter(id => !registered.includes(id))
    expect(stale, 'remove ids that no longer exist from PENDING_AUDIT').toEqual([])
  })

  it.each(audited)('%s declares retryStable and correctStatement', (id) => {
    const def = getExercise(id)
    expect(Array.isArray(def.retryStable), `${id}: declare retryStable (may be [])`).toBe(true)
    expect(typeof def.correctStatement, `${id}: declare correctStatement (may return null)`).toBe('function')
  })
})

describe('W — wrong-answer text', () => {
  // Holds for EVERY exercise, audited or not: the default never presents a
  // split's total as "the answer".
  it.each(registered)('%s never shows a split total as the answer', (id) => {
    const def = getExercise(id)
    for (const q of questionsFor(id)) {
      const text = wrongFeedbackText(q, def)
      expect(text.length).toBeGreaterThan(0)
      if (q.op === 'split') expect(text).not.toBe(FEEDBACK.wrongMessage(q.answer))
    }
  })

  it.each(audited)('%s: a retry gets the same kind of text', (id) => {
    const def = getExercise(id)
    for (const q of questionsFor(id)) {
      expect(wrongFeedbackText(buildRetry(q), def).length).toBeGreaterThan(0)
    }
  })
})

describe('R — a retry is the same question, one tier down', () => {
  it.each(audited)('%s keeps its retryStable fields', (id) => {
    const def = getExercise(id)
    const keys: string[] = def.retryStable ?? []
    for (const q of questionsFor(id)) {
      const retry = buildRetry(q)
      expect(retry.isRetry).toBe(true)
      expect(retry.problem).toEqual(q.problem)
      for (const key of keys) {
        expect(
          (retry.meta as Record<string, unknown>)[key],
          `${id}: meta.${key} changed on retry (tier ${(q.meta as { tierId?: string }).tierId})`,
        ).toEqual((q.meta as Record<string, unknown>)[key])
      }
      // and the statement shown after a wrong retry names the same fact
      if (def.correctStatement && (q.meta as { tierId?: string }).tierId === (retry.meta as { tierId?: string }).tierId) {
        expect(def.correctStatement(retry)).toEqual(def.correctStatement(q))
      }
    }
  })
})

// C — source-level, like exerciseShell.test.ts: a file that has been brought
// under the conventions (it declares retryStable) must hand its answers to
// useClosure and never call onResolve itself.
const sources = import.meta.glob('./*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const convertedFiles = Object.entries(sources).filter(
  ([path, src]) => !path.endsWith('.test.tsx') && src.includes('retryStable'),
)

describe('C — closure', () => {
  it('finds the converted exercise files', () => {
    expect(convertedFiles.length).toBeGreaterThan(0)
  })

  it.each(convertedFiles)('%s resolves through useClosure only', (path, src) => {
    expect(src.includes('useClosure('), `${path} must use useClosure`).toBe(true)
    expect(/\bonResolve\(/.test(src), `${path} calls onResolve directly — go through useClosure's resolve`).toBe(false)
  })
})

// Q — a converted file draws its groups with the shared components (FiveRow via
// DotGroup / SceneGroup, or the die patterns). A wrapping flex container is how
// "4 as 3-over-1" gets on screen, so none may remain.
describe('Q — quantities are structured', () => {
  it.each(convertedFiles)('%s has no free-wrapping layout', (path, src) => {
    expect(/flexWrap/.test(src), `${path}: use FiveRow (or a die pattern) instead of a wrapping flex container`).toBe(false)
  })
})
