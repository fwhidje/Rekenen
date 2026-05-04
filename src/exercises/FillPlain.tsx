import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NumPad } from '../ui/components/NumPad'
import { useState } from 'react'

interface FillPlainMeta {
  _unused?: never
}

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Fredoka One, cursive', fontSize: 60 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 50 }}>=</span>
        <div style={{
          minWidth: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: input ? '#FF6B35' : '#F5F5F5', color: input ? 'white' : '#CCC',
          borderRadius: 14, fontSize: 50,
          boxShadow: input ? '0 4px 14px rgba(255,107,53,.4)' : 'none',
          transition: 'background .18s',
        }}>{input || '?'}</div>
      </div>
      <NumPad onKey={handleKey} disabled={disabled} />
    </div>
  )
}

const FillPlain: ExerciseDefinition<FillPlainMeta> = {
  id: 'fill_plain',
  label: 'Schrijf het antwoord',
  supportsReveal: false,
  generateMeta: () => ({}),
  Component: FillPlainComponent,
}

registerExercise(FillPlain)
