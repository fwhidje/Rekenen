import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { TFButtons } from '../ui/components/TFButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { opGlyph, opColor } from './opDisplay'

const TIERS: ExerciseTier[] = [
  { id: 'judge', minScore: 0, label: 'waar/niet', description: 'Judge whether a shown equation is correct — recognition of a stated equation. False answers are near-misses (off-by-one/two).' },
]

interface TrueFalseMeta {
  shownAnswer: number   // the (possibly wrong) answer displayed to the child
  isCorrect: boolean
  tierId: string
}

function TrueFalseComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<TrueFalseMeta>) {
  const { operandA, operandB, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 48 }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
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

// A false shown answer is a near-miss: ±1 or ±2 around the true answer,
// clamped to ≥ 0 and guaranteed ≠ correct (the old unguarded clamp could
// collapse a "false" statement onto the true answer).
function makeFalseAnswer(correct: number): number {
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
    pitfalls: ['Saying "waar" without actually evaluating', 'Missing a near-miss (off-by-one) false statement'],
    progression: 'Single tier; the difficulty lives in how close the false distractor sits to the true answer.',
  },

  generateMeta(operandA, operandB, _score, problem) {
    const op = problem?.op ?? '+'
    const correct = op === '-' ? operandA - operandB : operandA + operandB
    const isCorrect = Math.random() < 0.5
    return {
      shownAnswer: isCorrect ? correct : makeFalseAnswer(correct),
      isCorrect,
      tierId: 'judge',
    }
  },

  Component: TrueFalseComponent,
}

registerExercise(TrueFalse)
