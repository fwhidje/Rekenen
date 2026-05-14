import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'

const INK        = '#3d2f1e'
const CREAM      = 'rgba(244,236,216,0.94)'
const PAPER      = '#fbf6e6'
const POLLEN     = '#c79023'

interface NumberlinePlaceMeta {
  showLabels: boolean
  max: number
}

function NumberlinePlaceComponent({ question, onResolve, disabled }: ExerciseComponentProps<NumberlinePlaceMeta>) {
  const { operandA, answer, meta } = question
  const { showLabels, max } = meta

  const numbers = Array.from({ length: max + 1 }, (_, i) => i)
  const cellW = Math.max(26, Math.min(42, Math.floor(300 / (max + 1))))

  const labelFor = (n: number) => {
    if (showLabels) return String(n)
    if (n === 0 || n === max) return String(n)
    return ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* Question banner */}
      <div style={{
        background: CREAM, border: `2px solid ${INK}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: INK,
      }}>
        Waar staat <span style={{ color: POLLEN }}>{operandA}</span>?
      </div>

      {/* Number line */}
      <div style={{ display: 'flex' }}>
        {numbers.map((n, idx) => {
          const isFirst = idx === 0
          const isLast  = idx === numbers.length - 1
          return (
            <div
              key={n}
              onClick={() => !disabled && onResolve(n === answer)}
              onPointerDown={e => { if (!disabled) (e.currentTarget as HTMLDivElement).style.background = CREAM }}
              onPointerUp={e =>   { (e.currentTarget as HTMLDivElement).style.background = PAPER }}
              onPointerLeave={e =>{ (e.currentTarget as HTMLDivElement).style.background = PAPER }}
              style={{
                width: cellW, height: cellW,
                background: PAPER,
                borderTop:    `2px solid ${INK}`,
                borderBottom: `2px solid ${INK}`,
                borderLeft:   `2px solid ${INK}`,
                borderRight:  isLast ? `2px solid ${INK}` : 'none',
                borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive',
                fontSize: Math.floor(cellW * 0.42),
                color: INK,
                cursor: disabled ? 'default' : 'pointer',
                boxSizing: 'border-box',
                transition: 'background .12s',
                userSelect: 'none',
              }}
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
    return { showLabels: score < 25, max }
  },

  Component: NumberlinePlaceComponent,
}

registerExercise(NumberlinePlace)
