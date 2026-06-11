import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseDidactics } from './types'
import { NATURE_TOKENS } from '../presentation/tokens'
import { opGlyph, opColor } from './opDisplay'

// ─── collect-counter / collect-counter-down ──────────────────────────────────
// One component, two registered ids. The counter starts at the given number
// (the start group is a known quantity, not something to rebuild from 1) and
// the child counts on (+) or back (−) to produce the answer. The tap count is
// the strategy probe: ≈ operandB taps = counting on/back; ≈ total taps =
// restarted from scratch.

const TIERS: ExerciseTier[] = [
  { id: 'counter', minScore: 0, label: 'teller', description: 'Count on (or back) from the given number with +/− to produce the answer. Tap count reveals the counting strategy. Single tier.' },
]

interface CollectCounterMeta {
  tierId: string
}

function CollectCounterComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<CollectCounterMeta>) {
  const { operandA, operandB, answer, op } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  // '+' counts on from the larger operand (a flipped "1 + 4" starts the
  // counter at 4); '−' counts back from the whole.
  const startCount = op === '-' ? operandA : Math.max(operandA, operandB)
  const [count, setCount] = useState(startCount)
  const [taps, setTaps] = useState(0)

  useEffect(() => { setCount(startCount); setTaps(0) }, [question, startCount])

  const touched = taps > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 52 }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
        <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 44 }}>=</span>
        <div style={{
          minWidth: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: touched ? tokens.accent : tokens.paper,
          color: touched ? 'white' : `${tokens.ink}55`,
          border: `2px solid ${touched ? tokens.accent : tokens.paperMid}`,
          borderRadius: 14, fontSize: 44, fontFamily: 'Fredoka One, cursive',
          transition: 'background .18s, border-color .18s',
        }}>{count}</div>
      </div>
      <div style={{ display: 'flex', gap: 18 }}>
        {([
          ['−', tokens.refuse, () => { setCount(c => Math.max(0, c - 1)); setTaps(t => t + 1) }],
          ['+', tokens.confirm, () => { setCount(c => Math.min(10, c + 1)); setTaps(t => t + 1) }],
        ] as const).map(([label, color, fn]) => (
          <button key={label} onClick={() => !disabled && fn()}
            style={{ width: 72, height: 72, fontSize: 44, fontFamily: 'Fredoka One, cursive', background: color, color: 'white', border: 'none', borderRadius: 18, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: `0 5px 16px ${color}55` }}>{label}</button>
        ))}
      </div>
      {/* Confirm unlocks after the first tap — an answer of 0 (1 − 1, "alles
          weg") must be confirmable, so the guard is on touched, not count. */}
      <button onClick={() => !disabled && touched && onResolve(count === answer, { givenAnswer: count, tapCount: taps })}
        disabled={disabled || !touched}
        style={{
          padding: '14px 44px', fontSize: 22, fontFamily: 'Fredoka One, cursive',
          background: touched ? tokens.confirm : tokens.paperMid, color: 'white',
          border: 'none', borderRadius: 50,
          cursor: touched && !disabled ? 'pointer' : 'not-allowed',
          boxShadow: touched ? '0 5px 16px rgba(0,0,0,.18)' : 'none',
          transition: 'background .2s',
        }}>
        ✓ Klaar!
      </button>
    </div>
  )
}

const DIDACTICS_UP: ExerciseDidactics = {
  goal: 'Build the total by counting on from the first addend, internalising "tel verder" over "tel alles".',
  pitfalls: ['Resetting and counting all (visible as tap count ≫ operandB)', 'Over/undershooting the target by one', 'Confirming the start number unchanged'],
  progression: 'Single tier; tap count is the diagnostic signal of which counting strategy the child used.',
}

const CollectCounter: ExerciseDefinition<CollectCounterMeta> = {
  id: 'collect-counter',
  label: 'Tel samen met de teller',
  supportsReveal: false,
  tiers: TIERS,
  didactics: DIDACTICS_UP,
  generateMeta: () => ({ tierId: 'counter' }),
  Component: CollectCounterComponent,
}

registerExercise(CollectCounter)
