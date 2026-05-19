import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NATURE_TOKENS } from '../presentation/tokens'

interface NumberlinePlaceMeta {
  showLabels: boolean
  max: number
}

function NumberlinePlaceComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberlinePlaceMeta>) {
  const { operandA, answer, meta } = question
  const { showLabels, max } = meta
  const { ink, paper, cream, accentText } = scene?.tokens ?? NATURE_TOKENS

  const numbers = Array.from({ length: max + 1 }, (_, i) => i)
  const cellW = Math.max(26, Math.min(42, Math.floor(300 / (max + 1))))

  const labelFor = (n: number) => {
    if (showLabels) return String(n)
    if (n === 0 || n === max) return String(n)
    if (n % 5 === 0) return String(n)
    return ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        Waar staat <span style={{ color: accentText }}>{operandA}</span>?
      </div>

      <div style={{ display: 'flex' }}>
        {numbers.map((n, idx) => {
          const isFirst = idx === 0
          const isLast  = idx === numbers.length - 1
          return (
            <div
              key={n}
              onClick={() => !disabled && onResolve(n === answer)}
              onPointerDown={e => { if (!disabled) (e.currentTarget as HTMLDivElement).style.background = cream }}
              onPointerUp={e =>   { (e.currentTarget as HTMLDivElement).style.background = paper }}
              onPointerLeave={e =>{ (e.currentTarget as HTMLDivElement).style.background = paper }}
              style={{
                width: cellW, height: cellW, background: paper,
                borderTop:    `2px solid ${ink}`, borderBottom: `2px solid ${ink}`,
                borderLeft:   `2px solid ${ink}`,
                borderRight:  isLast ? `2px solid ${ink}` : 'none',
                borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: Math.floor(cellW * 0.42), color: ink,
                cursor: disabled ? 'default' : 'pointer',
                boxSizing: 'border-box', transition: 'background .12s', userSelect: 'none',
              }}
            >{labelFor(n)}</div>
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
    return { showLabels: score < 50, max: _a <= 5 ? 5 : 10 }
  },
  Component: NumberlinePlaceComponent,
}

registerExercise(NumberlinePlace)
