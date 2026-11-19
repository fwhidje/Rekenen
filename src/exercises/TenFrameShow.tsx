import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { FEEDBACK } from '../presentation/feedback'

import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'recognise', minScore: 0, label: 'herkennen', description: 'Read a quantity from a ten-frame and pick its numeral. Single tier; the frame structures around 5 and 10.' },
]

interface TenFrameShowMeta {
  options: number[]
  tierId: string
}


// ─── Ten-frame visual ─────────────────────────────────────────────────────────

function TenFrame({ n, ink, paper }: { n: number; ink: string; paper: string }) {
  const cellSize = 44
  const cells = Array.from({ length: 10 }, (_, i) => i < n)
  return (
    <div style={{
      background: paper, border: `2px solid ${ink}`, borderRadius: 12,
      padding: 6, display: 'grid',
      gridTemplateColumns: `repeat(5, ${cellSize}px)`,
      gridTemplateRows: `repeat(2, ${cellSize}px)`,
      gap: 4,
    }}>
      {cells.map((filled, i) => (
        <div key={i} style={{
          width: cellSize, height: cellSize,
          border: `2px solid ${ink}`, borderRadius: 8,
          background: paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {filled && (
            <div style={{
              width: cellSize - 14, height: cellSize - 14,
              borderRadius: '50%', background: ink,
              boxShadow: `0 2px 4px rgba(0,0,0,.2)`,
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function TenFrameShowComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<TenFrameShowMeta>) {
  const { operandA, answer, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper } = tokens
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <ExerciseTitle tokens={tokens}>Hoeveel?</ExerciseTitle>
      <ExerciseStage tokens={tokens}>
        <TenFrame n={operandA} ink={ink} paper={paper} />
      </ExerciseStage>
      <ChoiceButtons options={meta.options}
        onPick={v => { setPicked(v); resolve(v === answer, { givenAnswer: v }) }}
        disabled={disabled || answered} picked={picked} solved={solved} tokens={tokens} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const TenFrameShow: ExerciseDefinition<TenFrameShowMeta> = {
  id: 'ten-frame-show',
  label: 'Tienveld — hoeveel?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Read a quantity from a ten-frame, using the 5-anchor (top row complete) and the 10-anchor (full frame) as built-in structure — the frame does the chunking.',
    pitfalls: [
      'Counts filled cells one by one instead of seeing the row-of-5 as a chunk.',
      'Reads only the top row when the bottom row also has filled cells.',
    ],
    progression: 'Single tier; the ten-frame itself is the structural scaffold.',
  },
  // Retry: the same frame with the same four options.
  retryStable: ['options'],
  correctStatement: q => FEEDBACK.wrongMessage(q.answer),
  generateMeta(operandA, _b, _score, _problem, ctx) {
    return { options: ctx?.retryOf?.options ?? makeNumeralOptions(operandA, numeralRangeMax(operandA)), tierId: 'recognise' }
  },
  Component: TenFrameShowComponent,
}

registerExercise(TenFrameShow)
