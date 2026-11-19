import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { FEEDBACK } from '../presentation/feedback'

import { DOT_POS } from '../presentation/diePatterns'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'recognise', minScore: 0, label: 'herkennen', description: 'Read a die / dot pattern and pick its numeral — the 5-structure carries 6–10.' },
]

interface DotPatternRecogniseMeta {
  options: number[]
  tierId: string
}



// ─── Dot pattern visual ───────────────────────────────────────────────────────

function DieSquare({ n, color, size }: { n: number; color: string; size: number }) {
  const positions = DOT_POS[n] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: color, boxShadow: `0 3px 8px ${color}88`,
        }} />
      ))}
    </div>
  )
}

// The pattern sits on the exercise stage; a 1–5 pattern keeps its own die face.
function DotPattern({ n, ink, paper, dot, refuse }: { n: number; ink: string; paper: string; dot: string; refuse: string }) {
  if (n <= 5) {
    return (
      <div style={{ position: 'relative', width: 130, height: 130, background: paper, borderRadius: 16, border: `2px solid ${ink}` }}>
        <DieSquare n={n} color={dot} size={130} />
      </div>
    )
  }

  // 6–10: one shared box with two die-pattern groups side by side
  const right = n - 5
  return (
    <div style={{
      background: paper, borderRadius: 16, border: `2px solid ${ink}`,
      padding: '10px 14px',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <DieSquare n={5} color={refuse} size={110} />
      <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
      <DieSquare n={right} color={dot} size={110} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function DotPatternRecogniseComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<DotPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, dot, refuse } = tokens
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <ExerciseTitle tokens={tokens}>Hoeveel?</ExerciseTitle>
      <ExerciseStage tokens={tokens}>
        <DotPattern n={operandA} ink={ink} paper={paper} dot={dot} refuse={refuse} />
      </ExerciseStage>
      <ChoiceButtons options={meta.options}
        onPick={v => { setPicked(v); resolve(v === answer, { givenAnswer: v }) }}
        disabled={disabled || answered} picked={picked} solved={solved} tokens={tokens} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const DotPatternRecognise: ExerciseDefinition<DotPatternRecogniseMeta> = {
  id: 'dot-pattern-recognise',
  label: 'Herken het stippenpatroon',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Conceptual subitising: read a structured die / dot pattern as a single quantity, without counting. For 6–10, see it as 5 + n.',
    pitfalls: [
      'Reverts to one-by-one counting (defeats the purpose — the pattern is meant to be seen).',
      'Off-by-one on 6–10 by counting the second die-group from 1 instead of continuing from 5.',
    ],
    progression: 'Single tier; difficulty scales with the quantity, leaning on the 5-structure for 6–10.',
  },
  // Retry: the same pattern with the same four options.
  retryStable: ['options'],
  correctStatement: q => FEEDBACK.wrongMessage(q.answer),
  generateMeta(operandA, _b, _score, _problem, ctx) {
    return { options: ctx?.retryOf?.options ?? makeNumeralOptions(operandA, numeralRangeMax(operandA)), tierId: 'recognise' }
  },
  Component: DotPatternRecogniseComponent,
}

registerExercise(DotPatternRecognise)
