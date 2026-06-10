import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { SKILLS, SKILLS_BY_ID } from '../curriculum/skills'
import { getExercisePlan } from '../curriculum/exercisePlan'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { pickTier } from '../exercises/tiers'
import { computeAnswer, problemOperands } from '../engine/answer'
import { diagnostics, classifyError } from '../engine/diagnostics'
import type { AnswerRecord } from '../engine/diagnostics'
import { exerciseStats, STATS_WINDOW } from '../engine/exerciseStats'
import { exerciseFactors, FACTOR_CAP } from '../engine/weightFactors'
import type { AnswerDetail, ExerciseQuestion } from '../exercises/types'
import { THEMES } from '../presentation/themes'
import { SkillBalance } from './SkillBalance'

import '../exercises/index'

const SCORE_BRACKETS = [0, 20, 40, 60, 80, 100] as const

// Debug answers are recorded under a sentinel profile so they never pollute a
// real child's mastery data.
export const DEBUG_PROFILE_ID = 'debug'

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
  const [logTick, setLogTick]       = useState(0)
  const questionStartRef            = useRef(Date.now())

  const theme = THEMES[0]
  const { Background } = theme.backgrounds[bgIdx % theme.backgrounds.length]
  const Counter = theme.counters[counterIdx % theme.counters.length]
  const containerBg = theme.backgrounds[bgIdx % theme.backgrounds.length].containerBg
  const scene = useMemo(() => ({ Counter, containerBg, tokens: theme.tokens }), [Counter, containerBg, theme])

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
    const problem = skill.generate()
    const { a, b } = problemOperands(problem)
    const meta = def.generateMeta(a, b, score)
    return { exerciseId, skillId: skill.id, problem, operandA: a, operandB: b, op: problem.op, answer: computeAnswer(problem), meta }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, score, exerciseId, qKey])

  const regenerate = useCallback(() => {
    setFeedback(null)
    setQKey(k => k + 1)
  }, [])

  useEffect(() => { questionStartRef.current = Date.now() }, [question])

  const handleResolve = useCallback((correct: boolean, detail?: AnswerDetail) => {
    if (feedback || !question) return
    setFeedback({ ok: correct, message: correct ? 'Goed!' : `Antwoord was ${question.answer}` })

    const skill = SKILLS_BY_ID[question.skillId]
    const given = detail?.givenAnswer
    const record: AnswerRecord = {
      timestamp: Date.now(),
      profileId: DEBUG_PROFILE_ID,
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
    setLogTick(t => t + 1)

    setTimeout(regenerate, correct ? 1100 : 2000)
  }, [feedback, question, regenerate])

  const def = exerciseId ? getExercise(exerciseId) : null
  const ExerciseComponent = def ? def.Component : null
  const activeTier = def ? pickTier(def.tiers, score) : null

  // Mix monitor for the selected skill, computed over debug-profile answers —
  // answer exercises wrong here and watch their dynamic factor climb.
  const skillRecords = useMemo(
    () => diagnostics.getForSkill(DEBUG_PROFILE_ID, skillId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skillId, logTick]
  )
  const mixStats = useMemo(
    () => exerciseStats(skillRecords, skillId, availableExercises),
    [skillRecords, skillId, availableExercises]
  )
  const mixFactors = useMemo(
    () => exerciseFactors(skillRecords, skillId),
    [skillRecords, skillId]
  )
  // Persisted across reloads (all profiles); newest first, capped for rendering.
  const records = useMemo(() => [...diagnostics.getAll()].reverse().slice(0, 200), [logTick])

  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
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
        minHeight: '100dvh',
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

        {/* Diagnostics log — persisted answer stream (localStorage, all profiles) */}
        <div style={{
          width: '100%', maxWidth: 460, background: CREAM, border: `2px solid ${INK}`,
          borderRadius: 16, padding: 14, marginTop: 18, fontSize: 12, color: INK,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 800 }}>Diagnostiek ({records.length})</span>
            <button
              onClick={() => { diagnostics.clear(); setLogTick(t => t + 1) }}
              style={{ ...buttonStyle(false), padding: '4px 12px', fontSize: 12 }}
            >Wissen</button>
          </div>
          {records.length === 0 ? (
            <div style={{ fontStyle: 'italic', color: '#8a795f' }}>
              Nog geen antwoorden vastgelegd. Beantwoord een oefening.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'monospace', maxHeight: 220, overflowY: 'auto' }}>
              {records.map((r, i) => (
                <div key={i} style={{ color: r.correct ? '#2e7d32' : '#b3431f' }}>
                  {r.correct ? '✓' : '✗'} {r.operandA}{opSymbol(r.op)}{r.operandB}={r.correctAnswer}
                  {r.givenAnswer !== undefined ? ` →${r.givenAnswer}` : ''}
                  {' '}[{r.tierId ?? '–'}]
                  {r.errorType ? ` ${r.errorType}` : ''}
                  {r.tapCount !== undefined ? ` taps:${r.tapCount}` : ''}
                  {r.replayCount ? ` replays:${r.replayCount}` : ''}
                  {r.variant ? ` [${r.variant}]` : ''}
                  {r.responseTimeMs !== undefined ? ` ${Math.round(r.responseTimeMs / 100) / 10}s` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mix monitor — per-exercise recent stats + dynamic weight factor */}
        <div style={{
          width: '100%', maxWidth: 460, background: CREAM, border: `2px solid ${INK}`,
          borderRadius: 16, padding: 14, marginTop: 18, fontSize: 12, color: INK,
        }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Mix — {skill.id}</div>
          {mixStats.length === 0 ? (
            <div style={{ fontStyle: 'italic', color: '#8a795f' }}>
              Geen geregistreerde oefeningen voor deze skill.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'monospace' }}>
              {mixStats.map(s => {
                const factor = mixFactors[s.exerciseId] ?? 1
                const pinned = factor >= FACTOR_CAP
                return (
                  <div key={s.exerciseId} style={{ color: pinned ? '#b3431f' : factor > 1 ? '#8a6210' : '#2e7d32' }}>
                    {pinned ? '⚠' : factor > 1 ? '↑' : '·'} {s.exerciseId} — ×{factor.toFixed(2)}
                    {s.attempts > 0
                      ? ` · ${s.attempts} pogingen, ${Math.round(s.accuracy * 100)}% juist` +
                        (s.medianCorrectMs !== null ? `, ${(s.medianCorrectMs / 1000).toFixed(1)}s mediaan` : '')
                      : ' · nog geen pogingen'}
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 11, color: '#8a795f' }}>
            factor: fout +0.5, juist −0.25, bereik [1, {FACTOR_CAP}] over de laatste {STATS_WINDOW} pogingen
            (retries tellen niet mee) · ⚠ = vastgelopen op het plafond — bekijk deze oefening · debug-profiel
          </div>
        </div>

        {/* Didactics + tier info for the current selection — bottom reference */}
        <div style={{
          width: '100%', maxWidth: 460, background: CREAM, border: `2px solid ${INK}`,
          borderRadius: 16, padding: 14, marginTop: 18, fontSize: 12.5, color: INK, lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Skill: {skill.name}</div>
          <div><b>Start:</b> {skill.didactics.startingPoint}</div>
          <div><b>Doel:</b> {skill.didactics.goal}</div>
          {skill.didactics.pitfalls.length > 0 && (
            <div><b>Valkuilen:</b> {skill.didactics.pitfalls.join('; ')}</div>
          )}
          <div style={{ marginTop: 6 }}><b>Oefeningvolgorde:</b> {getExercisePlan(skill.id)}</div>

          {def && (
            <div style={{ marginTop: 10, borderTop: `1px solid ${INK}33`, paddingTop: 8 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Oefening: {def.label}</div>
              <div><b>Doel:</b> {def.didactics.goal}</div>
              {def.didactics.pitfalls.length > 0 && (
                <div><b>Valkuilen:</b> {def.didactics.pitfalls.join('; ')}</div>
              )}
              <div><b>Opbouw:</b> {def.didactics.progression}</div>
              <div style={{ marginTop: 6 }}>
                {def.tiers.map(t => (
                  <div key={t.id} style={{
                    opacity: activeTier?.id === t.id ? 1 : 0.5,
                    fontWeight: activeTier?.id === t.id ? 700 : 400,
                  }}>
                    {activeTier?.id === t.id ? '▶ ' : '• '}[{t.minScore}+] {t.label} — {t.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Skill balance — tiers × weight curves for the selected skill */}
        <div style={{
          width: '100%', maxWidth: 460, background: CREAM, border: `2px solid ${INK}`,
          borderRadius: 16, padding: 14, marginTop: 18, fontSize: 12, color: INK,
        }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Balans — {skill.id}</div>
          <SkillBalance skill={skill} score={score} />
        </div>
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
