import { useState, useCallback } from 'react'
import type { Profile } from '../state/types'
import type { ExerciseQuestion } from '../exercises/types'
import { getExercise } from '../exercises/registry'
import { selectExercise } from '../engine/exerciseSelector'
import { applyCorrect, applyWrong } from '../engine/scoring'
import { SKILLS } from '../curriculum/skills'
import { getWeights } from '../curriculum/weightMatrix'
import { updateSkillScore } from '../state/storage'

// Import exercises to register them
import '../exercises/index'

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

  const nextQuestion = useCallback((updatedProfile: Profile) => {
    const next = selectExercise(updatedProfile, SKILLS, getWeights)
    setQuestion(next)
    setFeedback(null)
  }, [])

  const handleResolve = useCallback((correct: boolean) => {
    if (feedback || !question) return

    const msg = correct
      ? pick(PRAISE)
      : `Het antwoord is ${question.answer} 💡`

    setFeedback({ ok: correct, message: msg })
    setHistory(h => [...h, correct])

    const updatedProfile = updateSkillScore(profile, question.skillId, correct, applyCorrect, applyWrong)
    onProfileUpdate(updatedProfile)

    setTimeout(() => nextQuestion(updatedProfile), correct ? 1100 : 2400)
  }, [feedback, question, profile, onProfileUpdate, nextQuestion])

  if (!question) {
    return <div style={{ textAlign: 'center', fontFamily: 'Fredoka One, cursive', fontSize: 24, padding: 40 }}>
      Geen oefeningen beschikbaar.
    </div>
  }

  const def = getExercise(question.exerciseId)
  const ExerciseComponent = def.Component

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(150deg,#FFF9F2,#FFF0FA)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '18px 14px 40px', fontFamily: 'Nunito, sans-serif',
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
      <div style={{
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
  )
}
