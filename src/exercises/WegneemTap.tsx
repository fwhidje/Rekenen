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

// ─── wegneem-tap ──────────────────────────────────────────────────────────────
// The wegnemen action performed by the child: the whole group stands in the
// pen as a GIVEN quantity (the chip reads it uncounted), the child taps the
// creatures that go away — each one fades to a crossed ghost while the chip
// counts back — and then names what remains. The leave action is the meaning
// of the − sign. Mirror of erbij-tap.

const TIERS: ExerciseTier[] = [
  { id: 'doen',     minScore: 0,  label: 'doe weg',  description: 'Child taps the leavers away while the chip counts back from the whole; the ghosts keep the action countable, so the remainder can still be read off — full support.' },
  { id: 'voorspel', minScore: 35, label: 'voorspel', description: 'Answer first, then the leave animates and the chip confirms — the operation has to happen mentally before it happens on screen.' },
]

interface WegneemTapMeta {
  sceneIndex: number
  options: number[]
  tierId: string
}

function WegneemTapComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<WegneemTapMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const whole = operandA
  const leave = operandB
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream } = tokens
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter
  const containerBg = scene?.containerBg ?? legacyScene.bg

  const isVoorspel = meta.tierId === 'voorspel'
  // doen:     'tap' (tap the leavers) → 'howmany' (choice)
  // voorspel: 'ask' (choice first) → 'confirm' (leave animates) → resolve
  const [phase, setPhase] = useState<'tap' | 'howmany' | 'ask' | 'confirm'>(isVoorspel ? 'ask' : 'tap')
  const [gone, setGone] = useState(new Set<number>())
  const given = useRef<number | null>(null)

  useEffect(() => {
    setPhase(isVoorspel ? 'ask' : 'tap')
    setGone(new Set())
    given.current = null
  }, [question, isVoorspel])

  // doen: after the last leaver, a beat, then the remainder question.
  useEffect(() => {
    if (!isVoorspel && phase === 'tap' && gone.size === leave) {
      const t = setTimeout(() => setPhase('howmany'), 600)
      return () => clearTimeout(t)
    }
  }, [gone, phase, isVoorspel, leave])

  // voorspel: once answered, the leavers fade out one by one, then resolve.
  useEffect(() => {
    if (phase !== 'confirm') return
    if (gone.size < leave) {
      const t = setTimeout(() => {
        setGone(s => {
          // auto-leave from the end of the pen
          const next = new Set(s)
          for (let i = whole - 1; i >= 0; i--) {
            if (!next.has(i)) { next.add(i); break }
          }
          return next
        })
      }, 420)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      onResolve(given.current === answer, { givenAnswer: given.current ?? undefined })
    }, 700)
    return () => clearTimeout(t)
  }, [phase, gone, leave, whole, answer, onResolve])

  const tapCreature = (i: number) => {
    if (disabled || phase !== 'tap' || gone.has(i) || gone.size >= leave) return
    setGone(s => new Set([...s, i]))
  }

  const pickAnswer = (v: number) => {
    if (disabled) return
    if (phase === 'howmany') {
      onResolve(v === answer, { givenAnswer: v, tapCount: leave })
    } else if (phase === 'ask') {
      given.current = v
      setPhase('confirm')
    }
  }

  const cue = leave === 1 ? 'Doe er 1 weg!' : `Doe er ${leave} weg!`
  const cueAsk = leave === 1 ? 'Er gaat er 1 weg.' : `Er gaan er ${leave} weg.`
  const prompt =
    phase === 'howmany' ? 'Hoeveel blijven er over?' :
    phase === 'ask'     ? `${cueAsk} Hoeveel blijven er over?` :
    phase === 'confirm' ? 'Kijk maar!' : cue

  const renderCreature = (i: number) => {
    const isGone = gone.has(i)
    const style: React.CSSProperties = {
      position: 'relative',
      display: 'inline-block',
      cursor: phase === 'tap' && !isGone && gone.size < leave ? 'pointer' : 'default',
      opacity: isGone ? 0.35 : 1,
      transform: isGone ? 'scale(0.85)' : 'scale(1)',
      transition: 'opacity .35s, transform .35s',
    }
    return (
      <div key={i} onClick={() => tapCreature(i)} style={style}>
        {Counter ? <Counter size={40} /> : <span style={{ fontSize: 36 }}>{legacyScene.e}</span>}
        {isGone && (
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 30, lineHeight: 1,
            color: 'rgba(40,30,20,.8)',
          }}>✕</span>
        )}
      </div>
    )
  }

  const showChip = phase === 'tap' || phase === 'confirm'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>

      {/* Prompt + counting-back chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: cream, border: `2px solid ${ink}`, borderRadius: 18,
          padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
          fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
        }}>{prompt}</div>
        {showChip && <CountChip count={whole - gone.size} ink={ink} paper={paper} />}
      </div>

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32 }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
        <span style={{ color: ink, opacity: 0.4, fontSize: 27 }}>=</span>
        <span style={{ color: tokens.accentText }}>?</span>
      </div>

      {/* The pen: whole group; leavers fade to crossed ghosts */}
      <div style={{
        background: containerBg, borderRadius: 16, padding: '14px 18px',
        display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
        maxWidth: 260, minHeight: 52, alignItems: 'center',
      }}>
        {Array.from({ length: whole }, (_, i) => renderCreature(i))}
      </div>

      {(phase === 'howmany' || phase === 'ask') && (
        <ChoiceButtons options={meta.options} onPick={pickAnswer} disabled={disabled} tokens={scene?.tokens} />
      )}
    </div>
  )
}

const WegneemTap: ExerciseDefinition<WegneemTapMeta> = {
  id: 'wegneem-tap',
  label: 'Doe weg',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Wegnemen, enacted: the whole group is a given quantity (the chip reads it without counting), the child performs the take-away and names the remainder. The wegnemen meaning of − with its canonical cue phrase; the chip models counting back.',
    pitfalls: [
      'Off-by-one counting back — says the whole again for the first leaver.',
      'Counting the ghosts along with the remainder (the ✕ marks what left, but it is still visible).',
      'Answering the number that left instead of what remains.',
    ],
    progression: 'doen: the child physically taps the leavers away while the chip counts back; the ghosts keep the remainder readable, so the entry tier stays fully supported. voorspel: the answer comes BEFORE the action and the animation verifies it — the operation has to happen mentally first.',
  },
  generateMeta(operandA, operandB, score) {
    const tier = pickTier(TIERS, score)
    return {
      sceneIndex: Math.floor(Math.random() * 24),
      options: makeNumeralOptions(operandA - operandB, numeralRangeMax(operandA), 0),
      tierId: tier.id,
    }
  },
  Component: WegneemTapComponent,
}

registerExercise(WegneemTap)
