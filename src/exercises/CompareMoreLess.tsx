import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { CounterProps } from '../presentation/nature/Counters'
import type { ComponentType } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'counters', minScore: 0,  label: 'enkel beeld',   description: 'Compare two counter groups by quantity alone — no numerals shown.' },
  { id: 'both',     minScore: 30, label: 'beeld + getal', description: 'Counter groups labelled with their numerals — links quantity to symbol.' },
  { id: 'numbers',  minScore: 70, label: 'enkel getal',   description: 'Compare two bare numerals — purely symbolic magnitude judgement.' },
]

interface CompareMoreLessMeta {
  other: number
  askMore: boolean
  leftIsA: boolean
  style: 'counters' | 'both' | 'numbers'
  tierId: string
}

// ─── Counter group ────────────────────────────────────────────────────────────

function CounterGroup({ n, Counter, size }: { n: number; Counter: ComponentType<CounterProps>; size: number }) {
  const row1 = Math.min(n, 5)
  const row2 = n - row1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: row1 }, (_, i) => <Counter key={i} size={size} />)}
      </div>
      {row2 > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: row2 }, (_, i) => <Counter key={5 + i} size={size} />)}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function CompareMoreLessComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<CompareMoreLessMeta>) {
  const { operandA, meta } = question
  const { other, askMore, leftIsA, style } = meta
  const { ink, cream } = scene?.tokens ?? NATURE_TOKENS
  const Counter = scene?.Counter

  const leftVal  = leftIsA ? operandA : other
  const rightVal = leftIsA ? other    : operandA

  const winnerVal = askMore ? Math.max(operandA, other) : Math.min(operandA, other)
  const leftWins  = leftVal === winnerVal

  const handlePick = (pickedLeft: boolean) => {
    if (disabled) return
    onResolve(pickedLeft === leftWins)
  }

  const maxN = Math.max(leftVal, rightVal)
  const size = maxN <= 5 ? 44 : 32
  const rows = Math.ceil(maxN / 5)
  const counterAreaH = rows * size + (rows - 1) * 4
  const panelH = style === 'numbers'
    ? 64 + 28
    : style === 'both' ? counterAreaH + 26 + 8 + 28 : counterAreaH + 28

  const GroupPanel = ({ val, onPick }: { val: number; onPick: () => void }) => (
    <div onClick={onPick} style={{
      height: panelH,
      background: cream, border: `2px solid ${ink}`, borderRadius: 18,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, padding: '0 10px',
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      userSelect: 'none',
    }}>
      {style === 'numbers' && (
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 64, color: ink, lineHeight: 1 }}>
          {val}
        </div>
      )}
      {style !== 'numbers' && (
        <>
          {style === 'both' && (
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 26, color: ink, lineHeight: 1 }}>
              {val}
            </div>
          )}
          {Counter ? (
            <CounterGroup n={val} Counter={Counter} size={size} />
          ) : (
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 52, color: ink }}>{val}</div>
          )}
        </>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        {askMore ? 'Welke is meer?' : 'Welke is minder?'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 380 }}>
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
  tiers: TIERS,
  didactics: {
    goal: 'Judge which of two quantities is more / less — ordinal number sense.',
    pitfalls: ['Picking the longer row regardless of count', 'Confusing "meer" and "minder"'],
    progression: 'counters (quantity only) → both (quantity + numeral) → numbers (numeral only). Symbol replaces image as score rises.',
  },
  generateMeta(operandA, _b, score) {
    const max  = operandA <= 5 ? 5 : 10
    const pool = Array.from({ length: max }, (_, i) => i + 1).filter(n => n !== operandA)
    const other = pool[Math.floor(Math.random() * pool.length)]
    const tier = pickTier(TIERS, score)
    return {
      other,
      askMore:  Math.random() < 0.6,
      leftIsA:  Math.random() < 0.5,
      style:    tier.id as CompareMoreLessMeta['style'],
      tierId:   tier.id,
    }
  },
  Component: CompareMoreLessComponent,
}

registerExercise(CompareMoreLess)
