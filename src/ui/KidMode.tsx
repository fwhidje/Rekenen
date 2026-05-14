import { useState, useCallback, useMemo } from 'react'
import type { Profile } from '../state/types'
import type { ExerciseQuestion } from '../exercises/types'
import { getExercise } from '../exercises/registry'
import { selectExercise } from '../engine/exerciseSelector'
import { SKILLS } from '../curriculum/skills'
import { getWeights } from '../curriculum/weightMatrix'
import { recordAnswer } from '../state/storage'
import { THEMES } from '../presentation/themes'

// Import exercises to register them
import '../exercises/index'

const THEME_ROUNDS    = 10  // switch theme every N rounds
const BG_ROUNDS       =  5  // switch background within theme every N rounds

const PRAISE = ['Geweldig!', 'Super!', 'Waanzinnig!', 'Fantastisch!', 'Bravo!', 'Perfect!', 'Top!', 'Goed zo!']
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

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
    selectExercise(profile, SKILLS, getWeights)
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [history, setHistory] = useState<boolean[]>([])
  const [qKey, setQKey] = useState(0)
  const [roundsDone, setRoundsDone] = useState(0)
  const [counterIdx, setCounterIdx] = useState(0)

  const theme = THEMES[Math.floor(roundsDone / THEME_ROUNDS) % THEMES.length]
  const bgIdx = Math.floor(roundsDone / BG_ROUNDS) % theme.backgrounds.length
  const { Background, containerBg } = theme.backgrounds[bgIdx]
  const Counter = theme.counters[counterIdx]
  const scene = useMemo(() => ({ Counter, containerBg }), [Counter, containerBg])

  const nextQuestion = useCallback((updatedProfile: Profile, completed: number) => {
    const next = selectExercise(updatedProfile, SKILLS, getWeights)
    setQuestion(next)
    setFeedback(null)
    setQKey(k => k + 1)
    setRoundsDone(completed)
    // rotate counter on every question
    setCounterIdx(i => (i + 1) % THEMES[Math.floor(completed / THEME_ROUNDS) % THEMES.length].counters.length)
  }, [])

  const handleResolve = useCallback((correct: boolean) => {
    if (feedback || !question) return

    const msg = correct
      ? pick(PRAISE)
      : `Het antwoord is ${question.answer} 💡`

    setFeedback({ ok: correct, message: msg })
    setHistory(h => [...h, correct])

    const updatedProfile = recordAnswer(profile, question.skillId, correct)
    onProfileUpdate(updatedProfile)
    const completed = roundsDone + 1
    setTimeout(() => nextQuestion(updatedProfile, completed), correct ? 1100 : 2400)
  }, [feedback, question, profile, onProfileUpdate, nextQuestion])

  if (!question) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(150deg,#FFF9F2,#FFF0FA)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 14px 40px', fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: 430, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 22, fontFamily: 'Fredoka One, cursive', color: '#FF6B35' }}>
            Rekenen 🧮
          </div>
          <button onClick={onOpenAdmin} style={{
            background: 'white', border: '2px solid #EEE', borderRadius: 12,
            padding: '6px 14px', fontFamily: 'Fredoka One, cursive', fontSize: 14,
            color: '#888', cursor: 'pointer',
          }}>⚙️ Opties</button>
        </div>
        <div style={{ marginTop: 60, textAlign: 'center', fontFamily: 'Fredoka One, cursive', fontSize: 22, color: '#888' }}>
          Geen oefeningen beschikbaar.
        </div>
      </div>
    )
  }

  const def = getExercise(question.exerciseId)
  const ExerciseComponent = def.Component

  return (
    <Background style={{ minHeight: '100vh' }}>
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '18px 14px 40px', fontFamily: 'Nunito, sans-serif',
      position: 'relative', zIndex: 1,
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontFamily: 'Fredoka One, cursive', color: '#FF6B35' }}>
          Rekenen 🧮
        </div>
        <button onClick={onOpenAdmin} style={{
          background: 'white', border: '2px solid #EEE', borderRadius: 12,
          padding: '6px 14px', fontFamily: 'Fredoka One, cursive', fontSize: 14,
          color: '#888', cursor: 'pointer',
        }}>⚙️ Opties</button>
      </div>

      {/* Exercise card */}
      <div key={qKey} style={{
        width: '100%', maxWidth: 430, background: 'white', borderRadius: 28,
        padding: '22px 18px 26px',
        boxShadow: feedback
          ? `0 8px 32px ${feedback.ok ? '#06D6A044' : '#EF233C44'}, 0 0 0 3px ${feedback.ok ? '#06D6A0' : '#EF233C'}`
          : '0 8px 30px rgba(0,0,0,.08)',
        marginBottom: 16, minHeight: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, position: 'relative', overflow: 'hidden',
        transition: 'box-shadow .3s',
      }}>
        <ExerciseComponent
          question={question}
          onResolve={handleResolve}
          disabled={!!feedback}
          scene={scene}
        />

        {/* Feedback overlay */}
        {feedback && (
          <div style={{
            position: 'absolute', inset: 0,
            background: feedback.ok ? 'rgba(6,214,160,.90)' : 'rgba(255,215,215,.93)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: 28, padding: 20, fontFamily: 'Fredoka One, cursive', textAlign: 'center',
            color: feedback.ok ? '#013d1e' : '#8B0000', gap: 8,
          }}>
            <div style={{ fontSize: 26 }}>{feedback.message}</div>
          </div>
        )}
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
    </Background>
  )
}
