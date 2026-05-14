import { useState, useMemo, useEffect, useCallback } from 'react'
import { SKILLS, SKILLS_BY_ID } from '../curriculum/skills'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { computeAnswer } from '../engine/answer'
import type { ExerciseQuestion } from '../exercises/types'
import { THEMES } from '../presentation/themes'

import '../exercises/index'

const SCORE_BRACKETS = [0, 12, 25, 37, 50] as const

const INK   = '#3d2f1e'
const CREAM = 'rgba(244,236,216,0.96)'

interface Props {
  onClose: () => void
}

interface Feedback {
  ok: boolean
  message: string
}

export function DebugMode({ onClose }: Props) {
  const registered = useMemo(() => new Set(getAllExerciseIds()), [])

  const [skillId, setSkillId]       = useState(SKILLS[0].id)
  const [score, setScore]           = useState<number>(0)
  const [exerciseId, setExerciseId] = useState<string>('')
  const [qKey, setQKey]             = useState(0)
  const [feedback, setFeedback]     = useState<Feedback | null>(null)
  const [bgIdx, setBgIdx]           = useState(0)
  const [counterIdx, setCounterIdx] = useState(0)

  const theme = THEMES[0]
  const { Background } = theme.backgrounds[bgIdx % theme.backgrounds.length]
  const Counter = theme.counters[counterIdx % theme.counters.length]
  const containerBg = theme.backgrounds[bgIdx % theme.backgrounds.length].containerBg
  const scene = useMemo(() => ({ Counter, containerBg }), [Counter, containerBg])

  const skill = SKILLS_BY_ID[skillId]

  const availableExercises = useMemo(
    () => skill.applicableExercises.filter(id => registered.has(id)),
    [skill, registered]
  )

  useEffect(() => {
    if (availableExercises.length === 0) {
      setExerciseId('')
    } else if (!availableExercises.includes(exerciseId)) {
      setExerciseId(availableExercises[0])
    }
  }, [availableExercises, exerciseId])

  const question: ExerciseQuestion | null = useMemo(() => {
    if (!exerciseId) return null
    const def = getExercise(exerciseId)
    const { a, b, op } = skill.generate()
    const meta = def.generateMeta(a, b, score)
    return { exerciseId, skillId: skill.id, operandA: a, operandB: b, op, answer: computeAnswer(a, b, op), meta }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, score, exerciseId, qKey])

  const regenerate = useCallback(() => {
    setFeedback(null)
    setQKey(k => k + 1)
  }, [])

  const handleResolve = useCallback((correct: boolean) => {
    if (feedback || !question) return
    setFeedback({ ok: correct, message: correct ? 'Goed!' : `Antwoord was ${question.answer}` })
    setTimeout(regenerate, correct ? 1100 : 2000)
  }, [feedback, question, regenerate])

  const ExerciseComponent = exerciseId ? getExercise(exerciseId).Component : null

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background scene */}
      <Background style={{ position: 'absolute', inset: 0 }} />

      {/* Top gradient for header readability */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 2,
        background: 'linear-gradient(180deg, rgba(61,47,30,0.35), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 3,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 14px 40px', fontFamily: 'Nunito, sans-serif',
      }}>
        {/* Header */}
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontFamily: 'Fredoka One, cursive', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}>
            Debug oefeningen
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.88)', border: `2px solid ${INK}`, borderRadius: 14,
            padding: '4px 14px 5px', fontFamily: 'Patrick Hand, cursive', fontSize: 13,
            color: INK, cursor: 'pointer',
          }}>← Terug</button>
        </div>

        {/* Controls — paper panel */}
        <div style={{
          width: '100%', maxWidth: 460, background: CREAM,
          border: `2px solid ${INK}`,
          borderRadius: 16, padding: 14, marginBottom: 18,
          boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
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

          {/* Scene pickers */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="Achtergrond">
              <select value={bgIdx} onChange={e => setBgIdx(Number(e.target.value))} style={{ ...selectStyle, flex: 1 }}>
                {theme.backgrounds.map((_, i) => (
                  <option key={i} value={i}>{i === 0 ? 'Meadow' : 'Pond'}</option>
                ))}
              </select>
            </Field>
            <Field label="Item">
              <select value={counterIdx} onChange={e => setCounterIdx(Number(e.target.value))} style={{ ...selectStyle, flex: 1 }}>
                {theme.counters.map((C, i) => (
                  <option key={i} value={i}>{C.displayName ?? `Item ${i + 1}`}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button onClick={regenerate} disabled={!question} style={buttonStyle(!question)}>
              ↻ Volgende
            </button>
            {question && (
              <span style={{ fontSize: 12, color: '#6b5a44', fontFamily: 'monospace' }}>
                {question.operandA} {opSymbol(question.op)} {question.operandB} = {question.answer}
              </span>
            )}
          </div>
        </div>

        {/* Exercise — no card, directly on scene */}
        {question && ExerciseComponent && (
          <div key={qKey} style={{
            width: '100%', maxWidth: 460,
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
        )}
      </div>

      {/* Feedback — full-screen overlay */}
      {feedback && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: feedback.ok ? 'rgba(6,214,160,.82)' : 'rgba(239,100,100,.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 28, textAlign: 'center',
          color: feedback.ok ? '#013d1e' : '#5c0000',
        }}>
          {feedback.message}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b5a44', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
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
  border: `1.5px solid ${INK}`, background: '#fbf6e6',
  fontFamily: 'Nunito, sans-serif', color: INK,
}

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 16px', fontSize: 14, fontFamily: 'Fredoka One, cursive',
  background: disabled ? '#d4c9b0' : '#7a9a3a', color: 'white',
  border: `2px solid ${INK}`, borderRadius: 10,
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : `0 2px 0 rgba(61,47,30,.18)`,
})
