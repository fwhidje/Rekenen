import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { CountChip } from '../presentation/components/CountChip'
import { Panel } from '../presentation/components/Panel'
import { useReveal } from '../presentation/useReveal'
import { opGlyph, opColor } from './opDisplay'

// ─── erbij-tap ────────────────────────────────────────────────────────────────
// The erbij action performed by the child: a start group stands in the pen and
// is GIVEN as a known quantity (the chip already reads `a` before anything is
// tapped — never counted from 1), then the erbij-group is tapped in one by one
// while the chip counts on. Replaces collect-tap, whose tap-everything flow
// trained counting-all (the documented dead-end strategy) and could not fail.
//
// Presentation: the opening is a staged reveal (like fill-vis) — start group +
// its number, then the cue with the arrival group appearing as a chunk, then
// "= ?". The arrivals appear together (reinforcing "+N as one unit"); the child
// then taps them in one by one. Written order: the start group is operandA, the
// arrivals are operandB (no start-from-larger reordering — that lives only in
// the fill-vis commutativity swap).

const TIERS: ExerciseTier[] = [
  { id: 'doen',     minScore: 0,  label: 'doe erbij',  description: 'Staged reveal of the start group and the arriving chunk, then the child taps the arrivals in while the chip counts on; the group is hidden for the final "hoeveel nu?" so the answer comes from the count-on, not a recount.' },
  { id: 'voorspel', minScore: 35, label: 'voorspel',   description: 'Same staged reveal, but the child predicts the total before the arrivals animate in to confirm — the operation has to happen mentally first.' },
]

interface ErbijTapMeta {
  sceneIndex: number
  options: number[]
  tierId: string
}

// Reveal: [start group + a] → [cue + "+ b" + arrivals chunk] → ["= ?"].
const REVEAL_DELAYS = [500, 750, 600]
// How long the full pen lingers after the last arrival before the pen is
// hidden and the "hoeveel nu?" question appears (the child gets to see it).
const HOWMANY_PAUSE = 1150

function ErbijTapComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ErbijTapMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const start = operandA   // written order: start group is the first operand
  const arrive = operandB  // …the arrivals are the second
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper } = tokens
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter
  const containerBg = scene?.containerBg ?? legacyScene.bg

  const isVoorspel = meta.tierId === 'voorspel'
  // doen:     'tap'  → all arrived → 'howmany' (choice)
  // voorspel: 'ask' (choice first) → 'confirm' (arrivals animate) → resolve
  const [phase, setPhase] = useState<'tap' | 'howmany' | 'ask' | 'confirm'>(isVoorspel ? 'ask' : 'tap')
  const [arrived, setArrived] = useState(0)
  const [committed, setCommitted] = useState<number | null>(null)
  const given = useRef<number | null>(null)

  // Staged opening reveal; the interaction is locked until it completes.
  const { step, complete } = useReveal(REVEAL_DELAYS, question)
  const showStart = step >= 1
  const showArrivals = step >= 2
  const showEqTail = step >= 3

  useEffect(() => {
    setPhase(isVoorspel ? 'ask' : 'tap')
    setArrived(0)
    setCommitted(null)
    given.current = null
  }, [question, isVoorspel])

  // Resolve once the outcome is known: on a correct answer, fill the equation's
  // "?" with the answer so the completed sum shows during the feedback window.
  const resolve = (givenAnswer: number, tapCount?: number) => {
    if (givenAnswer === answer) setCommitted(answer)
    onResolve(givenAnswer === answer, { givenAnswer, tapCount })
  }

  // doen: after the last arrival, linger on the full pen, then the question.
  useEffect(() => {
    if (!isVoorspel && phase === 'tap' && complete && arrived === arrive) {
      const t = setTimeout(() => setPhase('howmany'), HOWMANY_PAUSE)
      return () => clearTimeout(t)
    }
  }, [arrived, phase, isVoorspel, arrive, complete])

  // voorspel: once predicted, the arrivals walk in one by one, then resolve.
  useEffect(() => {
    if (phase !== 'confirm') return
    if (arrived < arrive) {
      const t = setTimeout(() => setArrived(n => n + 1), 420)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => resolve(given.current ?? -1), 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, arrived, arrive])

  const tapWaiting = () => {
    if (disabled || !complete || phase !== 'tap' || arrived >= arrive) return
    setArrived(n => n + 1)
  }

  const pickAnswer = (v: number) => {
    if (disabled) return
    if (phase === 'howmany') {
      resolve(v, arrive)
    } else if (phase === 'ask') {
      given.current = v
      setPhase('confirm')
    }
  }

  const cue = arrive === 1 ? 'Er komt er 1 bij!' : `Er komen er ${arrive} bij!`
  const prompt =
    phase === 'howmany' ? 'Hoeveel zijn er nu?' :
    phase === 'ask'     ? (complete ? `${cue} Hoeveel zijn er dan?` : cue) :
    phase === 'confirm' ? 'Kijk maar!' :
    showArrivals        ? cue : 'Kijk!'

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

  const showChip = (phase === 'tap' || phase === 'confirm') && showStart
  const waitingLeft = arrive - arrived

  // Equation answer slot: "?" until the child answers correctly, then the total.
  const tail = committed !== null ? committed : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <style>{`
        @keyframes erbij-pop { from { transform: scale(0) rotate(-12deg); } to { transform: scale(1) rotate(0deg); } }
        @keyframes erbij-wiggle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>

      <Panel bg={containerBg} style={{ minWidth: 300 }}>
        {/* Prompt + counting-on chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 44 }}>
          <div style={{
            background: tokens.cream, border: `2px solid ${ink}`, borderRadius: 18,
            padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
            fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
          }}>{prompt}</div>
          {showChip && <CountChip count={start + arrived} ink={ink} paper={paper} />}
        </div>

        {/* Equation — built up by the reveal, always visible once assembled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32, minHeight: 40 }}>
          <span style={{ color: tokens.accentText, opacity: showStart ? 1 : 0, transition: 'opacity .3s' }}>{operandA}</span>
          <span style={{ color: opColor(op, tokens), opacity: showArrivals ? 1 : 0, transition: 'opacity .3s' }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop, opacity: showArrivals ? 1 : 0, transition: 'opacity .3s' }}>{operandB}</span>
          <span style={{ color: ink, opacity: showEqTail ? 0.4 : 0, fontSize: 27, transition: 'opacity .3s' }}>=</span>
          <span style={{ color: tokens.accentText, opacity: showEqTail ? 1 : 0, transition: 'opacity .3s' }}>{tail}</span>
        </div>

        {phase === 'howmany' ? (
          // Pen covered: naming the total has to come from the count-on, not a recount.
          <div style={{
            width: 130, height: 96, borderRadius: 16, border: `2px dashed ${ink}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 44, color: `${ink}40`,
          }}>?</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 80 }}>
            {/* The pen: start group + arrivals tapped/animated in */}
            <div style={{
              background: 'rgba(255,255,255,.35)', borderRadius: 16, padding: '14px 18px',
              display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
              maxWidth: 240, minHeight: 52, alignItems: 'center',
            }}>
              {showStart && Array.from({ length: start }, (_, i) => renderCreature(`a${i}`, true))}
              {Array.from({ length: arrived }, (_, i) => renderCreature(`in${i}`, true))}
            </div>

            {/* The arrivals, waiting outside — appear as a chunk, then tapped in */}
            {showArrivals && waitingLeft > 0 && (
              <div
                onClick={tapWaiting}
                style={{
                  border: `2px dashed ${ink}45`, borderRadius: 14, padding: '10px 12px',
                  display: 'flex', gap: 8, alignItems: 'center',
                  cursor: complete && phase === 'tap' ? 'pointer' : 'default',
                  animation: 'erbij-pop .3s ease-out',
                }}>
                {Array.from({ length: waitingLeft }, (_, i) => renderCreature(`w${i}`, false, i * 0.25))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Input lives outside the panel */}
      {((phase === 'howmany') || (phase === 'ask' && complete)) && (
        <ChoiceButtons options={meta.options} onPick={pickAnswer} disabled={disabled} tokens={scene?.tokens} />
      )}
    </div>
  )
}

const ErbijTap: ExerciseDefinition<ErbijTapMeta> = {
  id: 'erbij-tap',
  label: 'Doe erbij',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Counting on, enacted: the start group is a given quantity (the chip reads it without counting), the child performs the erbij action and names the new total. The erbij meaning of + with its canonical cue phrase.',
    pitfalls: [
      'Recounting the whole pen from 1 at the question — the group is hidden at answer time to force the count-on.',
      'Reading the chip instead of counting along — the chip vanishes before the answer for the same reason.',
      'Off-by-one at the step over the start group (says the start number again for the first arrival).',
    ],
    progression: 'doen: a staged reveal builds the start group and the arriving chunk, then the child taps the arrivals in while the chip models counting on; the pen lingers, then is hidden for "hoeveel nu?". voorspel: same reveal, but the answer comes BEFORE the arrivals animate in to confirm. Doing → anticipating is the move from acting out addition to performing it.',
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
