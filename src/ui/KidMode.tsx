import { useState, useCallback, useMemo, useRef } from 'react'
import type { Profile } from '../state/types'
import type { AnswerDetail, ExerciseQuestion } from '../exercises/types'
import { getExercise } from '../exercises/registry'
import { selectExercise } from '../engine/exerciseSelector'
import type { SelectionContext } from '../engine/exerciseSelector'
import { SKILLS, SKILLS_BY_ID } from '../curriculum/skills'
import { getWeights } from '../curriculum/weightMatrix'
import { recordAnswer } from '../state/storage'
import { diagnostics, classifyError } from '../engine/diagnostics'
import type { AnswerRecord } from '../engine/diagnostics'
import { FEEDBACK } from '../presentation/feedback'
import { THEMES } from '../presentation/themes'

// Import exercises to register them
import '../exercises/index'

const THEME_ROUNDS = 10  // re-pick theme every N rounds (random, may repeat)

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const pickIdx = (len: number): number => Math.floor(Math.random() * len)

interface Props {
  profile: Profile
  onProfileUpdate: (updated: Profile) => void
  onOpenAdmin: () => void
}

interface Feedback {
  ok: boolean
  message: string
}

export function KidMode({ profile, onProfileUpdate, onOpenAdmin }: Props) {
  const [question, setQuestion] = useState<ExerciseQuestion | null>(() =>
    selectExercise(profile, SKILLS, getWeights, { records: diagnostics.getAll(profile.id) })
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [history, setHistory] = useState<boolean[]>([])
  const [qKey, setQKey] = useState(0)
  const questionStartRef = useRef(Date.now())
  const [roundsDone, setRoundsDone] = useState(0)
  const [themeIdx, setThemeIdx] = useState(() => pickIdx(THEMES.length))
  const [bgIdx, setBgIdx] = useState(() => pickIdx(THEMES[0].backgrounds.length))
  const [counterIdx, setCounterIdx] = useState(() => pickIdx(THEMES[0].counters.length))

  const theme = THEMES[themeIdx]
  const ThemeDefs = theme.SharedDefs
  const { Background, containerBg } = theme.backgrounds[bgIdx % theme.backgrounds.length]
  const Counter = theme.counters[counterIdx % theme.counters.length]
  const scene = useMemo(() => ({ Counter, containerBg, tokens: theme.tokens }), [Counter, containerBg, theme])

  const nextQuestion = useCallback((updatedProfile: Profile, completed: number, ctx?: SelectionContext) => {
    const next = selectExercise(updatedProfile, SKILLS, getWeights, ctx)
    setQuestion(next)
    setFeedback(null)
    setQKey(k => k + 1)
    setRoundsDone(completed)
    questionStartRef.current = Date.now()
    // On a retry the scene stays put — the child should read it as the same
    // problem with more help, not as a new task.
    if (ctx?.retry) return
    // re-pick theme every THEME_ROUNDS rounds (random — may land on the same theme)
    const nextThemeIdx = completed % THEME_ROUNDS === 0 ? pickIdx(THEMES.length) : themeIdx
    setThemeIdx(nextThemeIdx)
    // background + counter: re-pick at random every round (repeats allowed)
    setBgIdx(pickIdx(THEMES[nextThemeIdx].backgrounds.length))
    setCounterIdx(pickIdx(THEMES[nextThemeIdx].counters.length))
  }, [themeIdx])

  const handleResolve = useCallback((correct: boolean, detail?: AnswerDetail) => {
    if (feedback || !question) return

    const msg = correct
      ? pick(FEEDBACK.positive)
      : FEEDBACK.wrongMessage(question.answer)

    setFeedback({ ok: correct, message: msg })
    setHistory(h => [...h, correct])

    // Diagnostic capture — persisted per profile via the localStorage sink.
    const skill = SKILLS_BY_ID[question.skillId]
    const given = detail?.givenAnswer
    const record: AnswerRecord = {
      timestamp: Date.now(),
      profileId: profile.id,
      skillId: question.skillId,
      exerciseId: question.exerciseId,
      tierId: (question.meta as { tierId?: string }).tierId,
      variant: (question.meta as { variant?: string }).variant,
      op: question.op,
      semanticForm: skill?.semanticForm,
      operandA: question.operandA,
      operandB: question.operandB,
      correctAnswer: question.answer,
      givenAnswer: given,
      correct,
      isRetry: question.isRetry,
      errorType: correct ? null : classifyError({
        skillId: question.skillId, op: question.op, semanticForm: skill?.semanticForm,
        operandA: question.operandA, operandB: question.operandB,
        correctAnswer: question.answer, givenAnswer: given,
      }),
      responseTimeMs: Date.now() - questionStartRef.current,
      tapCount: detail?.tapCount,
      replayCount: detail?.replayCount,
    }
    diagnostics.record(record)

    const updatedProfile = recordAnswer(profile, question.skillId, correct)
    onProfileUpdate(updatedProfile)
    const completed = roundsDone + 1
    // Failure response (didactics: re-scaffold, don't move on): a wrong answer
    // brings the same problem back one tier down — once. A wrong retry moves on.
    // The fresh record stream rides along so weak exercises get upweighted.
    const records = diagnostics.getAll(profile.id)
    const ctx: SelectionContext = correct || question.isRetry
      ? { lastQuestion: question, records }
      : { retry: question, lastQuestion: question, records }
    setTimeout(() => nextQuestion(updatedProfile, completed, ctx), correct ? FEEDBACK.correctMs : FEEDBACK.wrongMs)
  }, [feedback, question, profile, onProfileUpdate, nextQuestion, roundsDone])

  if (!question) {
    return (
      <div style={{ position: 'relative', minHeight: '100dvh' }}>
        <ThemeDefs />
        <Background style={{ position: 'absolute', inset: 0 }} />
        <div style={{
          position: 'relative', zIndex: 3, minHeight: '100dvh',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '18px 14px 40px', fontFamily: 'Nunito, sans-serif',
        }}>
          <div style={{ width: '100%', maxWidth: 430, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontFamily: 'Fredoka One, cursive', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}>
              Rekenen 🧮
            </div>
            <button onClick={onOpenAdmin} style={optiesStyle}>⚙️ Opties</button>
          </div>
          <div style={{ marginTop: 60, textAlign: 'center', fontFamily: 'Fredoka One, cursive', fontSize: 22, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
            Geen oefeningen beschikbaar.
          </div>
        </div>
      </div>
    )
  }

  const def = getExercise(question.exerciseId)
  const ExerciseComponent = def.Component

  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      <ThemeDefs />
      {/* Background scene — full bleed, no card frame */}
      <Background style={{ position: 'absolute', inset: 0 }} />

      {/* Top gradient — makes header readable over bright scenes */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 2,
        background: 'linear-gradient(180deg, rgba(61,47,30,0.35), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Main content — exercise directly on background */}
      <div style={{
        position: 'relative', zIndex: 3,
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 14px 24px', fontFamily: 'Nunito, sans-serif',
      }}>
        {/* Header */}
        <div style={{ width: '100%', maxWidth: 430, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 22, fontFamily: 'Fredoka One, cursive', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}>
            Rekenen 🧮
          </div>
          <button onClick={onOpenAdmin} style={optiesStyle}>⚙️ Opties</button>
        </div>

        {/* Exercise — no card wrapper */}
        <div key={qKey} style={{
          width: '100%', maxWidth: 430,
          flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14,
        }}>
          <ExerciseComponent
            question={question}
            onResolve={handleResolve}
            disabled={!!feedback}
            scene={scene}
          />
        </div>

        {/* History trail */}
        {history.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {history.slice(-16).map((ok, i) => (
              <div key={i} style={{
                width: 11, height: 11, borderRadius: '50%',
                background: ok ? '#06D6A0' : '#EF233C',
                opacity: 0.45 + (i / 16) * 0.55,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Feedback — full-screen overlay */}
      {feedback && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: feedback.ok ? FEEDBACK.correctTone.bg : FEEDBACK.wrongTone.bg,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', textAlign: 'center',
          color: feedback.ok ? FEEDBACK.correctTone.text : FEEDBACK.wrongTone.text, gap: 8,
        }}>
          <div style={{ fontSize: 32 }}>{feedback.message}</div>
        </div>
      )}
    </div>
  )
}

const optiesStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  border: '2px solid #3d2f1e',
  borderRadius: 14,
  padding: '4px 10px 5px',
  fontFamily: 'Patrick Hand, cursive',
  fontSize: 13,
  color: '#3d2f1e',
  cursor: 'pointer',
}
