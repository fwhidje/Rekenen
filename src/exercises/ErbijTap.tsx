import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { CountChip } from '../presentation/components/CountChip'
import { opGlyph, opColor } from './opDisplay'

// ─── erbij-tap ────────────────────────────────────────────────────────────────
// The erbij action performed by the child: a start group stands in the pen and
// is GIVEN as a known quantity (the chip already reads `a` before anything is
// tapped — never counted from 1), then the erbij-group is tapped in one by one
// while the chip counts on. Replaces collect-tap, whose tap-everything flow
// trained counting-all (the documented dead-end strategy) and could not fail.

const TIERS: ExerciseTier[] = [
  { id: 'doen',     minScore: 0,  label: 'doe erbij',  description: 'Child taps the arrivals in while the chip counts on from the start group, then names the new total (group hidden — cardinality of the count-on, not a recount).' },
  { id: 'voorspel', minScore: 35, label: 'voorspel',   description: 'Answer first, then the arrival animates and the chip confirms — the operation has to happen mentally before it happens on screen.' },
]

interface ErbijTapMeta {
  sceneIndex: number
  options: number[]
  tierId: string
}

function ErbijTapComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ErbijTapMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  // The ACTION always counts on from the larger operand — for a post-60
  // flipped problem ("1 + 4") the pen holds the 4 and 1 arrives, while the
  // equation keeps the written order. Start-from-the-larger, enacted.
  const start = Math.max(operandA, operandB)
  const arrive = Math.min(operandA, operandB)
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream } = tokens
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter
  const containerBg = scene?.containerBg ?? legacyScene.bg

  const isVoorspel = meta.tierId === 'voorspel'
  // doen:     'tap'  → all arrived → 'howmany' (choice)
  // voorspel: 'ask' (choice first) → 'confirm' (arrivals animate) → resolve
  const [phase, setPhase] = useState<'tap' | 'howmany' | 'ask' | 'confirm'>(isVoorspel ? 'ask' : 'tap')
  const [arrived, setArrived] = useState(0)
  const given = useRef<number | null>(null)

  useEffect(() => {
    setPhase(isVoorspel ? 'ask' : 'tap')
    setArrived(0)
    given.current = null
  }, [question, isVoorspel])

  // doen: after the last arrival, a beat, then the cardinality question.
  useEffect(() => {
    if (!isVoorspel && phase === 'tap' && arrived === arrive) {
      const t = setTimeout(() => setPhase('howmany'), 600)
      return () => clearTimeout(t)
    }
  }, [arrived, phase, isVoorspel, arrive])

  // voorspel: once answered, the arrivals walk in one by one, then resolve.
  useEffect(() => {
    if (phase !== 'confirm') return
    if (arrived < arrive) {
      const t = setTimeout(() => setArrived(n => n + 1), 420)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      onResolve(given.current === answer, { givenAnswer: given.current ?? undefined })
    }, 700)
    return () => clearTimeout(t)
  }, [phase, arrived, arrive, answer, onResolve])

  const tapWaiting = () => {
    if (disabled || phase !== 'tap' || arrived >= arrive) return
    setArrived(n => n + 1)
  }

  const pickAnswer = (v: number) => {
    if (disabled) return
    if (phase === 'howmany') {
      onResolve(v === answer, { givenAnswer: v, tapCount: arrive })
    } else if (phase === 'ask') {
      given.current = v
      setPhase('confirm')
    }
  }

  const cue = arrive === 1 ? 'Er komt er 1 bij!' : `Er komen er ${arrive} bij!`
  const prompt =
    phase === 'howmany' ? 'Hoeveel zijn er nu?' :
    phase === 'ask'     ? `${cue} Hoeveel zijn er dan?` :
    phase === 'confirm' ? 'Kijk maar!' : cue

  const renderCreature = (key: string, popIn: boolean, wiggleDelay?: number) => {
    const style: React.CSSProperties = {
      display: 'inline-block',
      animation: popIn
        ? 'erbij-pop .3s ease-out'
        : wiggleDelay !== undefined ? `erbij-wiggle 1.6s ease-in-out ${wiggleDelay}s infinite` : undefined,
    }
    return Counter
      ? <div key={key} style={style}><Counter size={40} /></div>
      : <span key={key} style={{ fontSize: 36, ...style }}>{legacyScene.e}</span>
  }

  const showChip = phase === 'tap' || phase === 'confirm'
  const waitingLeft = arrive - arrived

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <style>{`
        @keyframes erbij-pop { from { transform: scale(0) rotate(-12deg); } to { transform: scale(1) rotate(0deg); } }
        @keyframes erbij-wiggle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>

      {/* Prompt + counting-on chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: cream, border: `2px solid ${ink}`, borderRadius: 18,
          padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
          fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
        }}>{prompt}</div>
        {showChip && <CountChip count={start + arrived} ink={ink} paper={paper} />}
      </div>

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32 }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
        <span style={{ color: ink, opacity: 0.4, fontSize: 27 }}>=</span>
        <span style={{ color: tokens.accentText }}>?</span>
      </div>

      {phase === 'howmany' ? (
        // Pen covered: naming the total has to come from the count-on, not a recount.
        <div style={{
          width: 130, height: 96, borderRadius: 16, border: `2px dashed ${ink}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 44, color: `${ink}40`,
        }}>?</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* The pen: start group + arrivals */}
          <div style={{
            background: containerBg, borderRadius: 16, padding: '14px 18px',
            display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
            maxWidth: 240, minHeight: 52, alignItems: 'center',
          }}>
            {Array.from({ length: start }, (_, i) => renderCreature(`a${i}`, false))}
            {Array.from({ length: arrived }, (_, i) => renderCreature(`in${i}`, true))}
          </div>

          {/* The arrivals, waiting outside */}
          {waitingLeft > 0 && (
            <div
              onClick={tapWaiting}
              style={{
                border: `2px dashed ${ink}45`, borderRadius: 14, padding: '10px 12px',
                display: 'flex', gap: 8, alignItems: 'center',
                cursor: phase === 'tap' ? 'pointer' : 'default',
              }}>
              {Array.from({ length: waitingLeft }, (_, i) => renderCreature(`w${i}`, false, i * 0.25))}
            </div>
          )}
        </div>
      )}

      {(phase === 'howmany' || phase === 'ask') && (
        <ChoiceButtons options={meta.options} onPick={pickAnswer} disabled={disabled} tokens={scene?.tokens} />
      )}
    </div>
  )
}

const ErbijTap: ExerciseDefinition<ErbijTapMeta> = {
  id: 'erbij-tap',
  label: 'Doe erbij',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Counting on, enacted: the start group is a given quantity (the chip reads it without counting), the child performs the erbij action and names the new total. The erbij meaning of + with its canonical cue phrase.',
    pitfalls: [
      'Recounting the whole pen from 1 at the question — the group is hidden at answer time to force the count-on.',
      'Reading the chip instead of counting along — the chip vanishes before the answer for the same reason.',
      'Off-by-one at the step over the start group (says the start number again for the first arrival).',
    ],
    progression: 'doen: the child physically taps the arrivals in while the chip models counting on from the start group. voorspel: the answer comes BEFORE the action and the animation verifies it — the operation has to happen mentally first. Doing → anticipating is the move from acting out addition to performing it.',
  },
  generateMeta(operandA, operandB, score) {
    const tier = pickTier(TIERS, score)
    return {
      sceneIndex: Math.floor(Math.random() * 24),
      options: makeNumeralOptions(operandA + operandB, numeralRangeMax(operandA + operandB)),
      tierId: tier.id,
    }
  },
  Component: ErbijTapComponent,
}

registerExercise(ErbijTap)
