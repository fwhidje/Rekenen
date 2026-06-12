import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { NumPad } from '../ui/components/NumPad'
import { useState } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'
import { opGlyph, opColor } from './opDisplay'

const TIERS: ExerciseTier[] = [
  { id: 'plain', minScore: 0, label: 'invullen', description: 'Type the answer on the numpad — fully symbolic, no scaffolding. Single tier.' },
]

interface FillPlainMeta {
  tierId: string
}

function FillPlainComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FillPlainMeta>) {
  const [input, setInput] = useState('')
  const { operandA, operandB, answer, op } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, cream, accent, accentText, confirm, pop } = tokens

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); onResolve(given === answer, { givenAnswer: given }) } return }
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
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: opColor(op, tokens), lineHeight: 1 }}>{opGlyph(op)}</span>
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
  tiers: TIERS,
  didactics: {
    goal: 'Produce the answer symbolically, with no visual support — the most abstract presentation.',
    pitfalls: ['Off-by-one', 'Reversal (a−b vs b−a)', 'Typing a regurgitated operand'],
    progression: 'Single tier: used at higher scores once a skill no longer needs scaffolding.',
  },
  generateMeta: () => ({ tierId: 'plain' }),
  Component: FillPlainComponent,
}

registerExercise(FillPlain)
