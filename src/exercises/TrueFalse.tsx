import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { TFButtons } from '../ui/components/TFButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { opGlyph, opColor, equationText } from './opDisplay'
import { numeralRangeMax } from './choiceOptions'
import { useClosure } from '../presentation/useClosure'

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
  const { answered, resolve } = useClosure(question, onResolve)
  // closure: the judgement the child gave stays marked during the hold
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <ExerciseTitle tokens={tokens}>Klopt het?</ExerciseTitle>
      <ExerciseStage tokens={tokens}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 48 }}>
          <span style={{ color: tokens.accentText }}>{meta.displayA}</span>
          <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop }}>{meta.displayB}</span>
          <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 40 }}>=</span>
          <span style={{
            background: tokens.accent, borderRadius: 12, padding: '2px 14px',
            border: `2px solid ${tokens.accent}`, color: 'white',
          }}>{meta.shownAnswer}</span>
        </div>
      </ExerciseStage>
      <TFButtons
        onPick={v => { setPicked(v); resolve(v === (meta.isCorrect ? 1 : 0)) }}
        disabled={disabled || answered} picked={picked} tokens={scene?.tokens} />
    </div>
  )
}

// A magnitude near-miss: ±1 or ±2 around the true answer, kept inside the
// skill's number range (0…max — a tot-5 child is never shown "3 + 2 = 7") and
// guaranteed ≠ correct (the old unguarded clamp could collapse a "false"
// statement onto the true answer).
function nearMiss(correct: number, max: number): number {
  const candidates = [correct - 2, correct - 1, correct + 1, correct + 2]
    .filter(v => v >= 0 && v <= max)
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

  // Retry: the FACT is kept (same problem), the statement is drawn afresh on
  // purpose — the overlay has just shown the true equation, so repeating the
  // identical statement would be answered by flipping the previous answer.
  retryStable: [],
  // The true equation, whichever way the statement was wrong.
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),

  generateMeta(operandA, operandB, score, problem) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    const correct = op === '-' ? operandA - operandB : operandA + operandB
    const isCorrect = Math.random() < 0.5
    const max = numeralRangeMax(Math.max(operandA, correct))

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
          : nearMiss(correct, max)
      } else {
        shownAnswer = nearMiss(correct, max)
      }
    }

    return { displayA, displayB, shownAnswer, isCorrect, tierId: tier.id }
  },

  Component: TrueFalseComponent,
}

registerExercise(TrueFalse)
