import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'

interface NumberlinePlaceMeta {
  showLabels: boolean
  max: number
}

function NumberlinePlaceComponent({ question, onResolve, disabled }: ExerciseComponentProps<NumberlinePlaceMeta>) {
  const { operandA, answer, meta } = question
  const { showLabels, max } = meta
  const cellW = Math.max(28, Math.min(40, Math.floor(300 / (max + 1))))
  const gap = 4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 32, color: '#FF6B35' }}>
        Waar staat <span style={{ color: '#4CC9F0' }}>{operandA}</span>?
      </div>

      <div style={{ display: 'flex', gap, alignItems: 'center' }}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <div
            key={i}
            onClick={() => !disabled && onResolve(i === answer)}
            style={{
              width: cellW, height: cellW,
              borderRadius: 10,
              background: '#F0F0F0',
              border: '2px solid #DDD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive',
              fontSize: Math.floor(cellW * 0.45),
              color: '#888',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background .15s, transform .1s',
            }}
            onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.92)' }}
            onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
          >
            {showLabels ? i : ''}
          </div>
        ))}
      </div>

      {!showLabels && (
        <div style={{ display: 'flex', gap, alignItems: 'center' }}>
          {Array.from({ length: max + 1 }, (_, i) => (
            <div key={i} style={{
              width: cellW,
              fontFamily: 'Fredoka One, cursive', fontSize: 11,
              color: i === 0 || i === max ? '#AAA' : 'transparent',
              textAlign: 'center',
            }}>{i}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const NumberlinePlace: ExerciseDefinition<NumberlinePlaceMeta> = {
  id: 'numberline-place',
  label: 'Zet het getal op de lijn',
  supportsReveal: false,

  generateMeta(operandA, _b, score) {
    const max = operandA <= 5 ? 5 : 10
    return {
      showLabels: score < 25,
      max,
    }
  },

  Component: NumberlinePlaceComponent,
}

registerExercise(NumberlinePlace)
