import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { pickColors } from '../presentation/scenes'
import { DotGroup } from '../presentation/components/DotGroup'

const TIERS: ExerciseTier[] = [
  { id: 'visual', minScore: 0,  label: 'met stippen', description: 'Dots illustrate both addends alongside the equation as a counting aid.' },
  { id: 'plain',  minScore: 50, label: 'enkel som',   description: 'No dots — the child works from the symbolic equation alone.' },
]

function makeOptions(correct: number): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3]) {
    const v = correct + delta
    if (v >= 0) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
}

interface ChoiceMeta {
  options: number[]
  colorA: string
  colorB: string
  showVisual: boolean
  tierId: string
}

function ChoiceComponent({ question, onResolve, disabled }: ExerciseComponentProps<ChoiceMeta>) {
  const { operandA, operandB, answer, meta } = question
  const fs = meta.showVisual ? 38 : 48

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

      {/* Visual dots — additive when score is low, not a replacement for the equation */}
      {meta.showVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <DotGroup n={operandA} color={meta.colorA} />
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: '#FF6B35' }}>+</span>
          <DotGroup n={operandB} color={meta.colorB} />
        </div>
      )}

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: fs }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: Math.round(fs * 0.85) }}>=</span>
        <span style={{ color: '#FF6B35' }}>?</span>
      </div>

      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer, { givenAnswer: v })} disabled={disabled} />
    </div>
  )
}

const Choice: ExerciseDefinition<ChoiceMeta> = {
  id: 'choice',
  label: 'Kies het goede antwoord',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Pick the correct sum from four options — recognition rather than production.',
    pitfalls: ['Choosing an off-by-one distractor', 'Choosing a regurgitated operand'],
    progression: 'Below score 50 supporting dots accompany the equation; from 50 the dots drop and only the symbols remain.',
  },

  generateMeta(_operandA, _operandB, score) {
    const [colorA, colorB] = pickColors()
    const tier = pickTier(TIERS, score)
    return {
      options: makeOptions(_operandA + _operandB),
      colorA,
      colorB,
      showVisual: tier.id === 'visual',
      tierId: tier.id,
    }
  },

  Component: ChoiceComponent,
}

registerExercise(Choice)
