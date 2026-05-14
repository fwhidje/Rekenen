import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'

interface NumberlinePlaceMeta {
  showLabels: boolean
  max: number
}

function NumberlinePlaceComponent({ question, onResolve, disabled }: ExerciseComponentProps<NumberlinePlaceMeta>) {
  const { operandA, answer, meta } = question
  const { showLabels, max } = meta

  // Numbers 0..max
  const numbers = Array.from({ length: max + 1 }, (_, i) => i)
  const cellW = Math.max(26, Math.min(42, Math.floor(300 / (max + 1))))

  const labelFor = (n: number) => {
    if (showLabels) return String(n)
    if (n === 0 || n === max) return String(n)
    return ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 32, color: '#FF6B35' }}>
        Waar staat <span style={{ color: '#4CC9F0' }}>{operandA}</span>?
      </div>

      <div style={{ display: 'flex' }}>
        {numbers.map((n, idx) => {
          const isFirst = idx === 0
          const isLast = idx === numbers.length - 1
          return (
            <div
              key={n}
              onClick={() => !disabled && onResolve(n === answer)}
              style={{
                width: cellW, height: cellW,
                background: '#F0F0F0',
                borderTop: '2px solid #DDD',
                borderBottom: '2px solid #DDD',
                borderLeft: '2px solid #DDD',
                borderRight: isLast ? '2px solid #DDD' : 'none',
                borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive',
                fontSize: Math.floor(cellW * 0.45),
                color: '#888',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                transition: 'background .15s',
              }}
              onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLDivElement).style.background = '#E0E0E0' }}
              onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.background = '#F0F0F0' }}
            >
              {labelFor(n)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const NumberlinePlace: ExerciseDefinition<NumberlinePlaceMeta> = {
  id: 'numberline-place',
  label: 'Zet het getal op de lijn',
  supportsReveal: false,

  generateMeta(_a, _b, score) {
    const max = _a <= 5 ? 5 : 10
    return {
      showLabels: score < 25,
      max,
    }
  },

  Component: NumberlinePlaceComponent,
}

registerExercise(NumberlinePlace)
