import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'choice', minScore: 0,  label: 'kiezen',   description: 'Number line with one cell highlighted; kid picks the numeral from a strip of 4 options.' },
  { id: 'typed',  minScore: 50, label: 'intikken', description: 'Same prompt, but kid types the numeral on the numpad — no choice scaffold.' },
]

interface NumberlineReadMeta {
  max: number
  options: number[]
  tierId: string
}


// ─── Read-only number line with a highlighted cell ──────────────────────────

function NumberLineStrip({ target, max, ink, paper, accent }: {
  target: number; max: number; ink: string; paper: string; accent: string
}) {
  const numbers = Array.from({ length: max + 1 }, (_, i) => i)
  const cellW = Math.max(26, Math.min(42, Math.floor(300 / (max + 1))))

  // Sparse anchor labels; the highlighted target is never labelled.
  const labelFor = (n: number) => {
    if (n === target) return ''
    if (n === 0 || n === max || n % 5 === 0) return String(n)
    return ''
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
      {/* The marked cell must be unmissable: bouncing arrow + pulsing ring. */}
      <style>{`
        @keyframes nlr-bounce { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
        @keyframes nlr-pulse  { 0%, 100% { box-shadow: 0 0 0 0 ${accent}88 } 50% { box-shadow: 0 0 0 7px ${accent}00 } }
      `}</style>
      {numbers.map((n, idx) => {
        const isFirst = idx === 0
        const isLast  = idx === numbers.length - 1
        const isTarget = n === target
        return (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              height: 26, fontSize: 22, color: accent, lineHeight: 1,
              animation: isTarget ? 'nlr-bounce 0.9s ease-in-out infinite' : undefined,
            }}>{isTarget ? '▼' : ''}</div>
            <div style={{
              animation: isTarget ? 'nlr-pulse 1.4s ease-in-out infinite' : undefined,
              width: cellW, height: cellW,
              background: isTarget ? accent : paper,
              borderTop:    `2px solid ${ink}`, borderBottom: `2px solid ${ink}`,
              borderLeft:   `2px solid ${ink}`,
              borderRight:  isLast ? `2px solid ${ink}` : 'none',
              borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: Math.floor(cellW * 0.42), color: ink,
              boxSizing: 'border-box', userSelect: 'none',
            }}>{labelFor(n)}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

function NumberlineReadComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberlineReadMeta>) {
  const { operandA, meta } = question
  const { max, options, tierId } = meta
  const { ink, paper, cream, accent, confirm } = scene?.tokens ?? NATURE_TOKENS

  const [input, setInput] = useState('')
  useEffect(() => { setInput('') }, [operandA, tierId])

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) { const g = parseInt(input, 10); onResolve(g === operandA, { givenAnswer: g }) } return }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Welk getal staat hier?</div>

      <NumberLineStrip target={operandA} max={max} ink={ink} paper={paper} accent={accent} />

      {tierId === 'choice' ? (
        <ChoiceButtons options={options} onPick={v => onResolve(v === operandA, { givenAnswer: v })} disabled={disabled} tokens={scene?.tokens} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
          <div style={{
            minWidth: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: input ? confirm : accent, color: 'white',
            borderRadius: 12, border: `2px solid ${ink}`,
            fontFamily: 'Fredoka One, cursive', fontSize: 34,
            boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)', transition: 'background .18s',
          }}>{input || '?'}</div>
          <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
        </div>
      )}
    </div>
  )
}

const NumberlineRead: ExerciseDefinition<NumberlineReadMeta> = {
  id: 'numberline-read',
  label: 'Welk getal staat hier?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Reverse of numberline-place: given a position, identify the numeral. Position → numeral direction of the bidirectional fluency claim.',
    pitfalls: [
      'Off-by-one — counts cells from 1 instead of 0 to read the position.',
      'At typed tier, freezes or guesses wildly when the choice strip is no longer there to constrain the answer.',
      'On sparse-label number lines, counts from the wrong anchor.',
    ],
    progression: 'choice (constrained answer set) → typed (full numpad, free production). The standard choice → production scaffolding fade.',
  },
  generateMeta(operandA, _b, score) {
    const max = operandA <= 5 ? 5 : 10
    return { max, options: makeNumeralOptions(operandA, max, 0), tierId: pickTier(TIERS, score).id }
  },
  Component: NumberlineReadComponent,
}

registerExercise(NumberlineRead)
