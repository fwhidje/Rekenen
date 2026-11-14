import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { NumPad } from '../ui/components/NumPad'
import { useState } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { opGlyph, opColor, equationText } from './opDisplay'
import { useClosure } from '../presentation/useClosure'
import { AnswerSlot } from '../presentation/components/AnswerSlot'

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
  const { ink, accentText, pop } = tokens
  const { solved, answered, resolve } = useClosure(question, onResolve)

  const handleKey = (key: string) => {
    if (disabled || answered) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); resolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Hoeveel is het?</ExerciseTitle>
      <ExerciseStage tokens={tokens}>
        {/* Equation on the stage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: accentText, lineHeight: 1 }}>{operandA}</span>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: opColor(op, tokens), lineHeight: 1 }}>{opGlyph(op)}</span>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: pop, lineHeight: 1 }}>{operandB}</span>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: ink, lineHeight: 1, opacity: 0.5 }}>=</span>
          <AnswerSlot value={input} solved={solved} size={52} tokens={tokens} />
        </div>
      </ExerciseStage>
      <NumPad onKey={handleKey} disabled={disabled || answered} tokens={scene?.tokens} />
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
  retryStable: [],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  generateMeta: () => ({ tierId: 'plain' }),
  Component: FillPlainComponent,
}

registerExercise(FillPlain)
