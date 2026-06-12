import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import './index' // register everything, as the app would
import { getExercise, getAllExerciseIds } from './registry'
import { SKILLS } from '../curriculum/skills'
import { computeAnswer, problemOperands } from '../engine/answer'
import type { ExerciseQuestion } from './types'

// Render tripwire: every (skill × applicable exercise × score band) must at
// least produce initial markup without throwing, through the same path the
// selector uses (generate → operands → generateMeta → Component). Catches
// undefined-prop crashes at tiers that DebugMode playtesting hasn't reached.
// Effects don't run under renderToString — this is a crash net, not a
// behaviour test.

const SCORES = [0, 45, 75, 95]
const DRAWS = 3 // problems are random; a few draws per band varies the facts

describe('every applicable exercise renders at every score band', () => {
  const registered = new Set(getAllExerciseIds())
  for (const skill of SKILLS) {
    for (const exId of skill.applicableExercises) {
      if (!registered.has(exId)) continue // not built yet — the selector skips it too
      const def = getExercise(exId)
      it(`${skill.id} × ${exId}`, () => {
        for (const score of SCORES) {
          for (let d = 0; d < DRAWS; d++) {
            const problem = skill.generate({ score })
            const { a, b } = problem ? problemOperands(problem) : { a: 1, b: 1 }
            if (def.isCompatible && !def.isCompatible(a, b)) continue
            const question: ExerciseQuestion = {
              exerciseId: exId,
              skillId: skill.id,
              problem,
              operandA: a,
              operandB: b,
              op: problem.op,
              answer: computeAnswer(problem),
              meta: def.generateMeta(a, b, score, problem),
            }
            const Component = def.Component
            const html = renderToString(
              <Component question={question} onResolve={() => {}} disabled={false} />
            )
            expect(html.length).toBeGreaterThan(0)
          }
        }
      })
    }
  }
})
