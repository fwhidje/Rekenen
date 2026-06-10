import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { HandSVG } from '../presentation/components/HandSVG'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'recognise', minScore: 0, label: 'herkennen', description: 'Read a finger pattern and pick its numeral — one open hand carries the 5-anchor.' },
]

interface FingerPatternRecogniseMeta {
  options: number[]
  tierId: string
}


function FingerPattern({ n, ink, paper }: { n: number; ink: string; paper: string }) {
  const inner = n <= 5
    ? <HandSVG n={n} />
    : (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <HandSVG n={5} />
        <HandSVG n={n - 5} />
      </div>
    )
  return (
    <div style={{
      background: paper, border: `2px solid ${ink}`, borderRadius: 16,
      padding: '14px 18px', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {inner}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function FingerPatternRecogniseComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FingerPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question
  const { ink, paper, cream } = scene?.tokens ?? NATURE_TOKENS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Hoeveel?</div>
      <FingerPattern n={operandA} ink={ink} paper={paper} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer, { givenAnswer: v })} disabled={disabled} tokens={scene?.tokens} />
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
  generateMeta(operandA) { return { options: makeNumeralOptions(operandA, numeralRangeMax(operandA)), tierId: 'recognise' } },
  Component: FingerPatternRecogniseComponent,
}

registerExercise(FingerPatternRecognise)
