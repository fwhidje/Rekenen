import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { TFButtons } from '../ui/components/TFButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { opGlyph, opColor } from './opDisplay'

const TIERS: ExerciseTier[] = [
  { id: 'judge',  minScore: 0,  label: 'waar/niet', description: 'Judge whether a shown equation is correct. False answers are near-misses (off-by-one/two).' },
  { id: 'strikt', minScore: 60, label: 'strenge traps', description: 'Adds operand-echo traps ("3 + 2 = 3") and — for − — reversal traps ("2 − 5 = 3"): the only place order-sensitivity gets tested, since the generator never produces smaller-first.' },
]

interface TrueFalseMeta {
  // The equation as DISPLAYED — usually the problem's own operands, but a
  // reversal trap shows them swapped ("2 − 5 = 3"), so the component must not
  // read question.operandA/B directly.
  displayA: number
  displayB: number
  shownAnswer: number   // the (possibly wrong) answer displayed to the child
  isCorrect: boolean
  tierId: string
}

function TrueFalseComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<TrueFalseMeta>) {
  const { op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 48 }}>
        <span style={{ color: tokens.accentText }}>{meta.displayA}</span>
        <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{meta.displayB}</span>
        <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 40 }}>=</span>
        <span style={{
          background: tokens.cream, borderRadius: 12, padding: '2px 14px',
          border: `2px solid ${tokens.accent}`, color: tokens.ink,
        }}>{meta.shownAnswer}</span>
      </div>
      <TFButtons onPick={v => onResolve(v === (meta.isCorrect ? 1 : 0))} disabled={disabled} tokens={scene?.tokens} />
    </div>
  )
}

// A magnitude near-miss: ±1 or ±2 around the true answer, clamped to ≥ 0 and
// guaranteed ≠ correct (the old unguarded clamp could collapse a "false"
// statement onto the true answer).
function nearMiss(correct: number): number {
  const candidates = [correct - 2, correct - 1, correct + 1, correct + 2]
    .filter(v => v >= 0)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const TrueFalse: ExerciseDefinition<TrueFalseMeta> = {
  id: 'tf',
  label: 'Waar of niet waar?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Decide whether a presented equation is true — checks whether the child can verify, not just compute.',
    pitfalls: ['Saying "waar" without actually evaluating', 'Missing a near-miss (off-by-one) false statement', 'Accepting a reversed − equation ("2 − 5 = 3") because subtraction-as-removal ignores order'],
    progression: 'judge: false statements are magnitude near-misses. strikt (60+): adds operand-echo and order-reversal traps, probing misconceptions rather than computation slips.',
  },

  generateMeta(operandA, operandB, score, problem) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    const correct = op === '-' ? operandA - operandB : operandA + operandB
    const isCorrect = Math.random() < 0.5

    let displayA = operandA
    let displayB = operandB
    let shownAnswer = correct

    if (!isCorrect) {
      const r = Math.random()
      const canReverse = op === '-' && operandA !== operandB
      if (tier.id === 'strikt' && canReverse && r < 0.3) {
        // Reversal trap: "2 − 5 = 3" — true for the swapped equation, false as
        // shown. Order-insensitive subtraction says "waar".
        displayA = operandB
        displayB = operandA
        shownAnswer = correct
      } else if (tier.id === 'strikt' && r < 0.6) {
        // Operand-echo trap: the shown answer just repeats an operand.
        const echoes = [operandA, operandB].filter(v => v !== correct)
        shownAnswer = echoes.length > 0
          ? echoes[Math.floor(Math.random() * echoes.length)]
          : nearMiss(correct)
      } else {
        shownAnswer = nearMiss(correct)
      }
    }

    return { displayA, displayB, shownAnswer, isCorrect, tierId: tier.id }
  },

  Component: TrueFalseComponent,
}

registerExercise(TrueFalse)
