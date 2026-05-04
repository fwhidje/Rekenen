import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { pickColors } from '../presentation/scenes'
import { DotGroup } from '../presentation/components/DotGroup'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOptions(correct: number): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3]) {
    const v = correct + delta
    if (v >= 0) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

interface ChoiceMeta {
  options: number[]
  colorA: string
  colorB: string
  showVisual: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

function ChoiceComponent({ question, onResolve, disabled }: ExerciseComponentProps<ChoiceMeta>) {
  const { operandA, operandB, answer, meta } = question

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {meta.showVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <DotGroup n={operandA} color={meta.colorA} />
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: '#FF6B35' }}>+</span>
          <DotGroup n={operandB} color={meta.colorB} />
        </div>
      )}
      {!meta.showVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 48 }}>
          <span style={{ color: '#4CC9F0' }}>{operandA}</span>
          <span style={{ color: '#FF6B35' }}>+</span>
          <span style={{ color: '#9B5DE5' }}>{operandB}</span>
          <span style={{ color: '#CCC', fontSize: 40 }}>=</span>
          <span style={{ color: '#FF6B35' }}>?</span>
        </div>
      )}
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer)} disabled={disabled} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const Choice: ExerciseDefinition<ChoiceMeta> = {
  id: 'choice',
  label: 'Kies het goede antwoord',
  supportsReveal: false,

  generateMeta(operandA, operandB, score) {
    const [colorA, colorB] = pickColors()
    return {
      options: makeOptions(operandA + operandB),
      colorA,
      colorB,
      showVisual: score < 25,
    }
  },

  Component: ChoiceComponent,
}

registerExercise(Choice)
