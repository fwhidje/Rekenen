import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'

const TIERS: ExerciseTier[] = [
  { id: 'counter', minScore: 0, label: 'teller', description: 'Count on from the first addend with +/− to reach the total. Tap count reveals whether the child counts on or restarts from 1. Single tier.' },
]

interface CollectCounterMeta {
  tierId: string
}

function CollectCounterComponent({ question, onResolve, disabled }: ExerciseComponentProps<CollectCounterMeta>) {
  const { operandA, operandB } = question
  const [count, setCount] = useState(operandA)
  const [taps, setTaps] = useState(0)
  const target = operandA + operandB

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 52 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 44 }}>=</span>
        <div style={{
          minWidth: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: count > 0 ? '#FF6B35' : '#F5F5F5', color: count > 0 ? 'white' : '#CCC',
          borderRadius: 14, fontSize: 44, fontFamily: 'Fredoka One, cursive',
          transition: 'background .18s',
        }}>{count || '?'}</div>
      </div>
      <div style={{ display: 'flex', gap: 18 }}>
        {[['−', '#EF233C', () => { setCount(c => Math.max(0, c - 1)); setTaps(t => t + 1) }], ['+', '#4CC9F0', () => { setCount(c => c + 1); setTaps(t => t + 1) }]].map(([label, color, fn]) => (
          <button key={label as string} onClick={() => !disabled && (fn as () => void)()}
            style={{ width: 72, height: 72, fontSize: 44, fontFamily: 'Fredoka One, cursive', background: color as string, color: 'white', border: 'none', borderRadius: 18, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: `0 5px 16px ${color as string}55` }}>{label as string}</button>
        ))}
      </div>
      <button onClick={() => !disabled && count > 0 && onResolve(count === target, { givenAnswer: count, tapCount: taps })}
        disabled={disabled || count === 0}
        style={{ padding: '14px 44px', fontSize: 22, fontFamily: 'Fredoka One, cursive', background: '#FF6B35', color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer', boxShadow: '0 5px 16px rgba(255,107,53,.4)' }}>
        ✓ Klaar!
      </button>
    </div>
  )
}

const CollectCounter: ExerciseDefinition<CollectCounterMeta> = {
  id: 'collect-counter',
  label: 'Tel samen met de teller',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Build the total by counting on from the first addend, internalising "tel verder" over "tel alles".',
    pitfalls: ['Resetting to 0 and counting all (visible as tap count = total, not = operandB)', 'Over/undershooting the target by one'],
    progression: 'Single tier; tap count is the diagnostic signal of which counting strategy the child used.',
  },
  generateMeta: () => ({ tierId: 'counter' }),
  Component: CollectCounterComponent,
}

registerExercise(CollectCounter)
