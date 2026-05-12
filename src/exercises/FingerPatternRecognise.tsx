import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { HandSVG } from '../presentation/components/HandSVG'

interface FingerPatternRecogniseMeta {
  options: number[]
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

function FingerPattern({ n }: { n: number }) {
  if (n <= 5) {
    return <HandSVG n={n} />
  }
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
      <HandSVG n={5} />
      <HandSVG n={n - 5} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function FingerPatternRecogniseComponent({ question, onResolve, disabled }: ExerciseComponentProps<FingerPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: '#888' }}>Hoeveel?</div>
      <FingerPattern n={operandA} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer)} disabled={disabled} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const FingerPatternRecognise: ExerciseDefinition<FingerPatternRecogniseMeta> = {
  id: 'finger-pattern-recognise',
  label: 'Herken het vingerpatroon',
  supportsReveal: false,

  generateMeta(operandA) {
    return { options: makeOptions(operandA) }
  },

  Component: FingerPatternRecogniseComponent,
}

registerExercise(FingerPatternRecognise)
