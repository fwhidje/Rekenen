import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { makeNumeralOptions } from './choiceOptions'
import { useClosure } from '../presentation/useClosure'
import { AnswerSlot } from '../presentation/components/AnswerSlot'
import { FEEDBACK } from '../presentation/feedback'
import { skillRange } from '../curriculum/skills'

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

function NumberLineStrip({ target, max, ink, paper, accent, solvedColour }: {
  target: number; max: number; ink: string; paper: string; accent: string
  solvedColour: string | null   // closure: the target cell shows its number in this colour
}) {
  const numbers = Array.from({ length: max + 1 }, (_, i) => i)
  const cellW = Math.max(26, Math.min(42, Math.floor(300 / (max + 1))))

  // Sparse anchor labels; the highlighted target is never labelled.
  const labelFor = (n: number) => {
    if (n === target) return solvedColour ? String(n) : ''
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
              animation: isTarget && !solvedColour ? 'nlr-bounce 0.9s ease-in-out infinite' : undefined,
            }}>{isTarget ? '▼' : ''}</div>
            <div style={{
              animation: isTarget && !solvedColour ? 'nlr-pulse 1.4s ease-in-out infinite' : undefined,
              width: cellW, height: cellW,
              background: isTarget ? (solvedColour ?? accent) : paper,
              color: isTarget && solvedColour ? 'white' : ink,
              borderTop:    `2px solid ${ink}`, borderBottom: `2px solid ${ink}`,
              borderLeft:   `2px solid ${ink}`,
              borderRight:  isLast ? `2px solid ${ink}` : 'none',
              borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: Math.floor(cellW * 0.42),
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
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, accent, confirm } = tokens

  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setInput(''); setPicked(null) }, [question])
  // Closure: the marked cell shows its number; the answer is held.
  const { solved, answered, resolve } = useClosure(question, onResolve)

  const handleKey = (key: string) => {
    if (disabled || answered) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) { const g = parseInt(input, 10); resolve(g === operandA, { givenAnswer: g }) } return }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Welk getal staat hier?</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
        <NumberLineStrip target={operandA} max={max} ink={ink} paper={paper} accent={accent} solvedColour={solved ? confirm : null} />
        {/* typed tier: the answer slot sits on the stage, under the line */}
        {tierId !== 'choice' && <AnswerSlot value={solved ? operandA : input} solved={solved} size={52} tokens={tokens} />}
      </ExerciseStage>

      {tierId === 'choice' ? (
        <ChoiceButtons options={options}
          onPick={v => { setPicked(v); resolve(v === operandA, { givenAnswer: v }) }}
          disabled={disabled || answered} picked={picked} solved={solved} tokens={tokens} />
      ) : (
        <NumPad onKey={handleKey} disabled={disabled || answered} tokens={tokens} />
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
  // Retry: the same line and the same options, now to choose from.
  retryStable: ['max', 'options'],
  correctStatement: q => FEEDBACK.wrongMessage(q.answer),
  generateMeta(operandA, _b, score, _problem, ctx) {
    // The line is as long as the skill's numbers, not the number asked: in a
    // tot-10 skill a 3 is read off 0–10 too (playtest, Nov 2026).
    const max = ctx?.retryOf?.max ?? skillRange(ctx?.skillId ?? '', operandA)
    return { max, options: ctx?.retryOf?.options ?? makeNumeralOptions(operandA, max, 0), tierId: pickTier(TIERS, score).id }
  },
  Component: NumberlineReadComponent,
}

registerExercise(NumberlineRead)
