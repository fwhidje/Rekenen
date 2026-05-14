import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NumPad } from '../ui/components/NumPad'
import { useState } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'

interface FillPlainMeta {
  _unused?: never
}

function FillPlainComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FillPlainMeta>) {
  const [input, setInput] = useState('')
  const { operandA, operandB, answer } = question
  const { ink, cream, accent, accentText, confirm, pop } = scene?.tokens ?? NATURE_TOKENS

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
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '10px 22px 12px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: accentText, lineHeight: 1 }}>{operandA}</span>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: ink, lineHeight: 1 }}>+</span>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: pop, lineHeight: 1 }}>{operandB}</span>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: ink, lineHeight: 1, opacity: 0.5 }}>=</span>
        <div style={{
          minWidth: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: input ? confirm : accent, color: 'white',
          borderRadius: 12, border: `2px solid ${ink}`,
          fontFamily: 'Fredoka One, cursive', fontSize: 34,
          boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)',
          transition: 'background .18s',
        }}>{input || '?'}</div>
      </div>
      <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
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
