import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { HandSVG } from '../presentation/components/HandSVG'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { FEEDBACK } from '../presentation/feedback'

import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'recognise', minScore: 0, label: 'herkennen', description: 'Read a finger pattern and pick its numeral — one open hand carries the 5-anchor.' },
]

interface FingerPatternRecogniseMeta {
  options: number[]
  tierId: string
}


// The hands sit straight on the exercise stage.
function FingerPattern({ n }: { n: number }) {
  return n <= 5
    ? <HandSVG n={n} />
    : (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <HandSVG n={5} />
        <HandSVG n={n - 5} />
      </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

function FingerPatternRecogniseComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FingerPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <ExerciseTitle tokens={tokens}>Hoeveel?</ExerciseTitle>
      <ExerciseStage tokens={tokens}>
        <FingerPattern n={operandA} />
      </ExerciseStage>
      <ChoiceButtons options={meta.options}
        onPick={v => { setPicked(v); resolve(v === answer, { givenAnswer: v }) }}
        disabled={disabled || answered} picked={picked} solved={solved} tokens={tokens} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const FingerPatternRecognise: ExerciseDefinition<FingerPatternRecogniseMeta> = {
  id: 'finger-pattern-recognise',
  label: 'Herken het vingerpatroon',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Read a structured finger pattern as a quantity, without counting. Hands are an embodied 5-anchor: one open hand = 5, two hands and you\'re past 5 into 5 + n.',
    pitfalls: [
      'Counts fingers one by one (1, 2, 3, 4, 5) instead of seeing the whole hand as 5.',
      'On two-hand patterns, restarts the second hand from 1 instead of continuing from 5.',
    ],
    progression: 'Single tier; the hand image supplies the 5-structure scaffold for 6–10.',
  },
  // Retry: the same hands with the same four options.
  retryStable: ['options'],
  correctStatement: q => FEEDBACK.wrongMessage(q.answer),
  generateMeta(operandA, _b, _score, _problem, ctx) {
    return { options: ctx?.retryOf?.options ?? makeNumeralOptions(operandA, numeralRangeMax(operandA)), tierId: 'recognise' }
  },
  Component: FingerPatternRecogniseComponent,
}

registerExercise(FingerPatternRecognise)
