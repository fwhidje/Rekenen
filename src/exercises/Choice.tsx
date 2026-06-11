import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { pickColors } from '../presentation/scenes'
import { DotGroup } from '../presentation/components/DotGroup'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { opGlyph, opColor } from './opDisplay'

const TIERS: ExerciseTier[] = [
  { id: 'visual', minScore: 0,  label: 'met stippen', description: 'Dots illustrate the operation alongside the equation as a counting aid — two groups for +, a crossed-out group for −.' },
  { id: 'plain',  minScore: 50, label: 'enkel som',   description: 'No dots — the child works from the symbolic equation alone.' },
]

interface ChoiceMeta {
  options: number[]
  colorA: string
  colorB: string
  showVisual: boolean
  tierId: string
}

function ChoiceComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ChoiceMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const fs = meta.showVisual ? 38 : 48
  const glyph = opGlyph(op)
  const glyphColor = opColor(op, tokens)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

      {/* Visual dots — additive when score is low, not a replacement for the
          equation. For '+' two groups combine; for '−' one whole group with
          the removed part crossed out (the wegnemen after-image). */}
      {meta.showVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {op === '-' ? (
            <DotGroup n={operandA} color={meta.colorA} crossed={operandB} />
          ) : (
            <>
              <DotGroup n={operandA} color={meta.colorA} />
              <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: glyphColor }}>{glyph}</span>
              <DotGroup n={operandB} color={meta.colorB} />
            </>
          )}
        </div>
      )}

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: fs }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: glyphColor }}>{glyph}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
        <span style={{ color: tokens.ink, opacity: 0.4, fontSize: Math.round(fs * 0.85) }}>=</span>
        <span style={{ color: tokens.accentText }}>?</span>
      </div>

      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer, { givenAnswer: v })} disabled={disabled} tokens={scene?.tokens} />
    </div>
  )
}

const Choice: ExerciseDefinition<ChoiceMeta> = {
  id: 'choice',
  label: 'Kies het goede antwoord',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Pick the correct answer to a bare equation from four options — recognition rather than production.',
    pitfalls: ['Choosing an off-by-one distractor', 'Choosing a regurgitated operand'],
    progression: 'Below score 50 supporting dots accompany the equation (combining groups for +, crossed-out group for −); from 50 the dots drop and only the symbols remain.',
  },

  generateMeta(operandA, operandB, score, problem) {
    const [colorA, colorB] = pickColors()
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    // Distractors stay within the plausible range of the problem: for '+' near
    // the sum; for '−' between 0 and the whole (0 can be the right answer).
    const correct = op === '-' ? operandA - operandB : operandA + operandB
    const rangeAnchor = op === '-' ? operandA : correct
    const options = makeNumeralOptions(correct, numeralRangeMax(rangeAnchor), op === '-' ? 0 : 1)
    return {
      options,
      colorA,
      colorB,
      showVisual: tier.id === 'visual',
      tierId: tier.id,
    }
  },

  Component: ChoiceComponent,
}

registerExercise(Choice)
