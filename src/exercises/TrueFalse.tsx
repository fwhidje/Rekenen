import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { TFButtons } from '../ui/components/TFButtons'

interface TrueFalseMeta {
  shownAnswer: number   // the (possibly wrong) answer displayed to the child
  isCorrect: boolean
}

function TrueFalseComponent({ question, onResolve, disabled }: ExerciseComponentProps<TrueFalseMeta>) {
  const { operandA, operandB, meta } = question
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 48 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 40 }}>=</span>
        <span style={{
          background: '#FFF9C4', borderRadius: 12, padding: '2px 14px',
          border: '2px solid #FFD166', color: '#2D2D2D',
        }}>{meta.shownAnswer}</span>
      </div>
      <TFButtons onPick={v => onResolve(v === (meta.isCorrect ? 1 : 0))} disabled={disabled} />
    </div>
  )
}

const TrueFalse: ExerciseDefinition<TrueFalseMeta> = {
  id: 'true_false',
  label: 'Waar of niet waar?',
  supportsReveal: false,

  generateMeta(operandA, operandB) {
    const correct = operandA + operandB
    const isCorrect = Math.random() < 0.5
    const offset = isCorrect ? 0 : (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1)
    return {
      shownAnswer: Math.max(1, correct + offset),
      isCorrect,
    }
  },

  Component: TrueFalseComponent,
}

registerExercise(TrueFalse)
