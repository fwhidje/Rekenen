import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { HandSVG } from '../presentation/components/HandSVG'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'recognise', minScore: 0, label: 'herkennen', description: 'Read a quantity from a finger pattern and pick its numeral. Single tier; hands carry the 5-structure for 6–10.' },
]

interface FingerPatternRecogniseMeta {
  options: number[]
  tierId: string
}

function makeOptions(correct: number): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3]) {
    const v = correct + delta
    if (v >= 1) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
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
    goal: 'Read quantities from finger patterns, reinforcing the 5-anchored structure of numbers.',
    pitfalls: ['Counting fingers one by one instead of seeing 5 + n', 'Off-by-one on two-hand patterns'],
    progression: 'Single tier; the hand image supplies the 5-structure scaffold for 6–10.',
  },
  generateMeta(operandA) { return { options: makeOptions(operandA), tierId: 'recognise' } },
  Component: FingerPatternRecogniseComponent,
}

registerExercise(FingerPatternRecognise)
