import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NumPad } from '../ui/components/NumPad'
import { useState } from 'react'

interface FillPlainMeta {
  _unused?: never
}

// Nature palette constants
const INK    = '#3d2f1e'
const CREAM  = 'rgba(244,236,216,0.94)'
const POLLEN = '#c79023'
const PLUM   = '#8a5a99'
const LEAF   = '#7a9a3a'

function FillPlainComponent({ question, onResolve, disabled }: ExerciseComponentProps<FillPlainMeta>) {
  const [input, setInput] = useState('')
  const { operandA, operandB, answer } = question

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) onResolve(parseInt(input, 10) === answer); return }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      {/* Cream paper banner — equation */}
      <div style={{
        background: CREAM, border: `2px solid ${INK}`, borderRadius: 18,
        padding: '10px 22px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      }}>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: POLLEN, lineHeight: 1 }}>{operandA}</span>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: INK, lineHeight: 1 }}>+</span>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: PLUM, lineHeight: 1 }}>{operandB}</span>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: INK, lineHeight: 1, opacity: 0.5 }}>=</span>
        <div style={{
          minWidth: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: input ? LEAF : '#f0b932',
          color: 'white',
          borderRadius: 12, border: `2px solid ${INK}`,
          fontFamily: 'Fredoka One, cursive', fontSize: 34,
          boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)',
          transition: 'background .18s',
        }}>{input || '?'}</div>
      </div>
      <NumPad onKey={handleKey} disabled={disabled} />
    </div>
  )
}

const FillPlain: ExerciseDefinition<FillPlainMeta> = {
  id: 'fill-plain',
  label: 'Schrijf het antwoord',
  supportsReveal: false,
  generateMeta: () => ({}),
  Component: FillPlainComponent,
}

registerExercise(FillPlain)
