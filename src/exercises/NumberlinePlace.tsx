import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'labelled', minScore: 0,  label: 'met getallen', description: 'Every cell is labelled — the child matches the numeral to its position.' },
  { id: 'sparse',   minScore: 50, label: 'enkel ankers', description: 'Only 0, the max and multiples of 5 are labelled — the child reasons about position from the anchors.' },
]

interface NumberlinePlaceMeta {
  showLabels: boolean
  max: number
  tierId: string
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
              onClick={() => !disabled && onResolve(n === answer, { givenAnswer: n })}
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
  tiers: TIERS,
  didactics: {
    goal: 'Locate a numeral by its position on the number line — ordinal/positional number sense.',
    pitfalls: ['Off-by-one (counting cells from 1 instead of 0)', 'Losing the position once labels are sparse'],
    progression: 'labelled (all cells numbered) → sparse (only anchor labels), forcing positional reasoning as score rises.',
  },
  generateMeta(_a, _b, score) {
    const tier = pickTier(TIERS, score)
    return { showLabels: tier.id === 'labelled', max: _a <= 5 ? 5 : 10, tierId: tier.id }
  },
  Component: NumberlinePlaceComponent,
}

registerExercise(NumberlinePlace)
