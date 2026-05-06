import { useState, useMemo, useEffect, useCallback } from 'react'
import { SKILLS, SKILLS_BY_ID } from '../curriculum/skills'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { computeAnswer } from '../engine/answer'
import type { ExerciseQuestion } from '../exercises/types'

import '../exercises/index'

// Score brackets used elsewhere in the app for weight interpolation
const SCORE_BRACKETS = [0, 12, 25, 37, 50] as const

interface Props {
  onClose: () => void
}

interface Feedback {
  ok: boolean
  message: string
}

export function DebugMode({ onClose }: Props) {
  const registered = useMemo(() => new Set(getAllExerciseIds()), [])

  const [skillId, setSkillId]     = useState(SKILLS[0].id)
  const [score, setScore]         = useState<number>(0)
  const [exerciseId, setExerciseId] = useState<string>('')
  const [qKey, setQKey]           = useState(0)
  const [feedback, setFeedback]   = useState<Feedback | null>(null)

  const skill = SKILLS_BY_ID[skillId]

  // Exercises applicable to the current skill AND actually registered
  const availableExercises = useMemo(
    () => skill.applicableExercises.filter(id => registered.has(id)),
    [skill, registered]
  )

  // Keep `exerciseId` valid as the skill changes
  useEffect(() => {
    if (availableExercises.length === 0) {
      setExerciseId('')
    } else if (!availableExercises.includes(exerciseId)) {
      setExerciseId(availableExercises[0])
    }
  }, [availableExercises, exerciseId])

  // Build a fresh question whenever skill/score/exercise/qKey changes
  const question: ExerciseQuestion | null = useMemo(() => {
    if (!exerciseId) return null
    const def = getExercise(exerciseId)
    const { a, b, op } = skill.generate()
    const meta = def.generateMeta(a, b, score)
    return {
      exerciseId,
      skillId: skill.id,
      operandA: a,
      operandB: b,
      op,
      answer: computeAnswer(a, b, op),
      meta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, score, exerciseId, qKey])

  const regenerate = useCallback(() => {
    setFeedback(null)
    setQKey(k => k + 1)
  }, [])

  const handleResolve = useCallback((correct: boolean) => {
    if (feedback || !question) return
    const message = correct
      ? 'Goed!'
      : `Antwoord was ${question.answer}`
    setFeedback({ ok: correct, message })
    setTimeout(regenerate, correct ? 1100 : 2000)
  }, [feedback, question, regenerate])

  const ExerciseComponent = exerciseId ? getExercise(exerciseId).Component : null

  return (
    <div style={{
      minHeight: '100vh', background: '#F0F4F8',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '18px 14px 40px', fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontFamily: 'Fredoka One, cursive', color: '#555' }}>
          Debug oefeningen
        </div>
        <button onClick={onClose} style={{
          background: '#FF6B35', color: 'white', border: 'none', borderRadius: 12,
          padding: '8px 18px', fontFamily: 'Fredoka One, cursive', fontSize: 14, cursor: 'pointer',
        }}>← Terug</button>
      </div>

      {/* Controls */}
      <div style={{
        width: '100%', maxWidth: 460, background: 'white',
        borderRadius: 16, padding: 14, marginBottom: 14,
        boxShadow: '0 2px 10px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <Field label="Skill">
          <select value={skillId} onChange={e => setSkillId(e.target.value)} style={selectStyle}>
            {SKILLS.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>
        </Field>

        <Field label="Score">
          <select value={score} onChange={e => setScore(Number(e.target.value))} style={selectStyle}>
            {SCORE_BRACKETS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>

        <Field label="Oefening">
          {availableExercises.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: 13 }}>
              Geen geregistreerde oefeningen voor deze skill.
            </div>
          ) : (
            <select value={exerciseId} onChange={e => setExerciseId(e.target.value)} style={selectStyle}>
              {availableExercises.map(id => (
                <option key={id} value={id}>{getExercise(id).label} ({id})</option>
              ))}
            </select>
          )}
        </Field>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          <button onClick={regenerate} disabled={!question} style={buttonStyle(!question)}>
            ↻ Volgende
          </button>
          {question && (
            <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
              {question.operandA} {opSymbol(question.op)} {question.operandB} = {question.answer}
            </span>
          )}
        </div>
      </div>

      {/* Exercise card */}
      {question && ExerciseComponent && (
        <div key={qKey} style={{
          width: '100%', maxWidth: 460, background: 'white', borderRadius: 28,
          padding: '22px 18px 26px',
          boxShadow: feedback
            ? `0 8px 32px ${feedback.ok ? '#06D6A044' : '#EF233C44'}, 0 0 0 3px ${feedback.ok ? '#06D6A0' : '#EF233C'}`
            : '0 8px 30px rgba(0,0,0,.08)',
          minHeight: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, position: 'relative', overflow: 'hidden',
          transition: 'box-shadow .3s',
        }}>
          <ExerciseComponent
            question={question}
            onResolve={handleResolve}
            disabled={!!feedback}
          />

          {feedback && (
            <div style={{
              position: 'absolute', inset: 0,
              background: feedback.ok ? 'rgba(6,214,160,.90)' : 'rgba(255,215,215,.93)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRadius: 28, padding: 20, fontFamily: 'Fredoka One, cursive', textAlign: 'center',
              color: feedback.ok ? '#013d1e' : '#8B0000', gap: 8, fontSize: 24,
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
      {children}
    </div>
  )
}

function opSymbol(op: string): string {
  switch (op) {
    case 'split': return '∶'
    case 'count': return '?'
    case 'half':  return '½'
    default:      return op
  }
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 14, borderRadius: 8,
  border: '1.5px solid #DDD', background: 'white', fontFamily: 'inherit',
}

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 16px', fontSize: 14, fontFamily: 'Fredoka One, cursive',
  background: disabled ? '#CCC' : '#4CC9F0', color: 'white',
  border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
})
