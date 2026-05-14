import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import type { CounterProps } from '../presentation/nature/Counters'
import type { ComponentType } from 'react'

interface CompareMoreLessMeta {
  other: number
  askMore: boolean
  leftIsA: boolean
  style: 'counters' | 'both' | 'numbers'
}

// ─── Counter group ────────────────────────────────────────────────────────────

function CounterGroup({ n, Counter, size }: { n: number; Counter: ComponentType<CounterProps>; size: number }) {
  const row1 = Math.min(n, 5)
  const row2 = n - row1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
        {Array.from({ length: row1 }, (_, i) => <Counter key={i} size={size} />)}
      </div>
      {row2 > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
          {Array.from({ length: row2 }, (_, i) => <Counter key={5 + i} size={size} />)}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const INK   = '#3d2f1e'
const CREAM = 'rgba(244,236,216,0.90)'

function CompareMoreLessComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<CompareMoreLessMeta>) {
  const { operandA, meta } = question
  const { other, askMore, leftIsA, style } = meta
  const Counter = scene?.Counter

  const leftVal  = leftIsA ? operandA : other
  const rightVal = leftIsA ? other    : operandA

  const winnerVal = askMore ? Math.max(operandA, other) : Math.min(operandA, other)
  const leftWins  = leftVal === winnerVal

  const handlePick = (pickedLeft: boolean) => {
    if (disabled) return
    onResolve(pickedLeft === leftWins)
  }

  // Size counters so the largest group fits without wrapping
  const maxN  = Math.max(leftVal, rightVal)
  const size  = maxN <= 5 ? 44 : 32

  const GroupPanel = ({ val, onPick }: { val: number; onPick: () => void }) => (
    <div onClick={onPick} style={{
      flex: 1, minHeight: 120,
      background: CREAM, border: `2px solid ${INK}`, borderRadius: 18,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, padding: '14px 10px',
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      userSelect: 'none',
    }}>
      {/* Numbers only */}
      {style === 'numbers' && (
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 64, color: INK, lineHeight: 1 }}>
          {val}
        </div>
      )}
      {/* Counters (with optional numeral above) */}
      {style !== 'numbers' && (
        <>
          {style === 'both' && (
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 26, color: INK, lineHeight: 1 }}>
              {val}
            </div>
          )}
          {Counter ? (
            <CounterGroup n={val} Counter={Counter} size={size} />
          ) : (
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 52, color: INK }}>{val}</div>
          )}
        </>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      {/* Question */}
      <div style={{
        background: CREAM, border: `2px solid ${INK}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: INK,
      }}>
        {askMore ? 'Meer' : 'Minder'}
      </div>

      {/* Two groups */}
      <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 380 }}>
        <GroupPanel val={leftVal}  onPick={() => handlePick(true)}  />
        <GroupPanel val={rightVal} onPick={() => handlePick(false)} />
      </div>
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const CompareMoreLess: ExerciseDefinition<CompareMoreLessMeta> = {
  id: 'compare-more-less',
  label: 'Meer of minder?',
  supportsReveal: false,

  generateMeta(operandA, _b, score) {
    const max   = operandA <= 5 ? 5 : 10
    const pool  = Array.from({ length: max }, (_, i) => i + 1).filter(n => n !== operandA)
    const other = pool[Math.floor(Math.random() * pool.length)]
    return {
      other,
      askMore:  Math.random() < 0.6,
      leftIsA:  Math.random() < 0.5,
      style:    score < 15 ? 'counters' : score < 35 ? 'both' : 'numbers',
    }
  },

  Component: CompareMoreLessComponent,
}

registerExercise(CompareMoreLess)
