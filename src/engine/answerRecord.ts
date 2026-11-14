import type { AnswerDetail, ExerciseQuestion } from '../exercises/types'
import type { SemanticForm } from '../curriculum/types'
import { classifyError } from './diagnostics'
import type { AnswerFlag, AnswerRecord, AnswerScene } from './diagnostics'

// ─── Answer record builder ────────────────────────────────────────────────────
// The single place an AnswerRecord is assembled (KidMode and DebugMode both
// call it), so the evidence schema cannot drift between the two loops.
//
// Privacy invariant: a record carries the random profile id and what the app
// itself generated or the child tapped (numbers / choices). It never carries
// the profile name or any text typed by a person — `answerRecord.test.ts`
// tripwires this.

// Build identity of the running app. Until exercises and skills carry their
// own version ids (see road_to_ai_driven_rekenen.md, step 2), the commit is
// the version stamp: every exercise and skill is code, so the commit pins them.
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'

// One sitting = one app load. Groups the answers of a session in the stream.
export const SESSION_ID: string = crypto.randomUUID()

export interface AnswerRecordInput {
  profileId: string
  question: ExerciseQuestion
  correct: boolean
  detail?: AnswerDetail
  scoreBefore: number           // the skill's score when the question was served
  semanticForm?: SemanticForm
  startedAt: number             // when the question was presented (ms epoch)
  scene?: AnswerScene
  viewport?: { w: number; h: number }
  flag?: AnswerFlag
  now?: number
}

// The window size, rounded to CSS px; undefined outside a browser.
export function currentViewport(): { w: number; h: number } | undefined {
  if (typeof window === 'undefined') return undefined
  return { w: Math.round(window.innerWidth), h: Math.round(window.innerHeight) }
}

export function buildAnswerRecord(input: AnswerRecordInput): AnswerRecord {
  const { profileId, question, correct, detail, scoreBefore, semanticForm, startedAt, scene, viewport, flag } = input
  const now = input.now ?? Date.now()
  const given = detail?.givenAnswer
  const meta = question.meta as { tierId?: string; variant?: string }

  return {
    id: crypto.randomUUID(),
    timestamp: now,
    profileId,
    sessionId: SESSION_ID,
    appVersion: APP_VERSION,
    skillId: question.skillId,
    exerciseId: question.exerciseId,
    tierId: meta.tierId,
    variant: meta.variant,
    isRetry: question.isRetry,
    op: question.op,
    semanticForm,
    problem: question.problem,
    operandA: question.operandA,
    operandB: question.operandB,
    correctAnswer: question.answer,
    givenAnswer: given,
    correct,
    errorType: correct ? null : classifyError({
      skillId: question.skillId, op: question.op, semanticForm,
      operandA: question.operandA, operandB: question.operandB,
      correctAnswer: question.answer, givenAnswer: given,
    }),
    scoreBefore,
    responseTimeMs: now - startedAt,
    tapCount: detail?.tapCount,
    replayCount: detail?.replayCount,
    meta: question.meta as Record<string, unknown>,
    scene,
    viewport,
    flag,
  }
}
