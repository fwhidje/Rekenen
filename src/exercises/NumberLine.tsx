import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'

function makeOptions(correct: number): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3]) {
    const v = correct + delta
    if (v >= 0) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
}

interface NumberLineMeta {
  options: number[]
}

function NumberLineDisplay({ operandA, operandB }: { operandA: number; operandB: number }) {
  const total = operandA + operandB
  const cellW = Math.max(22, Math.min(32, Math.floor(308 / (total + 2))))
  const gap = 3

  return (
    <div style={{ width: '100%', padding: '8px 4px 4px', overflowX: 'auto' }}>
      <div style={{ height: 28, position: 'relative', marginBottom: 4, marginLeft: operandA * (cellW + gap) + cellW / 2 - 2 }}>
        <div style={{ position: 'absolute', left: 0, background: '#EDE6FF', color: '#9B5DE5', borderRadius: 8, padding: '3px 9px', fontFamily: 'Fredoka One, cursive', fontSize: 13, whiteSpace: 'nowrap' }}>
          + {operandB} →
        </div>
      </div>
      <div style={{ display: 'flex', gap, alignItems: 'flex-end' }}>
        {Array.from({ length: total + 1 }, (_, i) => {
          const isStart = i === operandA, isEnd = i === total
          const isJump = i > operandA && i < total, isPre = i < operandA
          const bg = isPre ? '#C8EEFF' : isStart ? '#4CC9F0' : isJump ? '#E9DDFF' : isEnd ? '#9B5DE5' : '#F0F0F0'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: cellW, height: cellW, borderRadius: 7, background: bg,
                border: isStart ? '2.5px solid #4CC9F0' : isEnd ? '2.5px solid #9B5DE5' : '2px solid #DDD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: Math.floor(cellW * .48),
                color: isStart ? '#0077AA' : isEnd ? 'white' : '#888',
              }}>
                {isStart ? operandA : isEnd ? '?' : ''}
              </div>
              <span style={{ fontSize: 10, color: '#AAA', fontFamily: 'Fredoka One, cursive' }}>{i}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NumberLineComponent({ question, onResolve, disabled }: ExerciseComponentProps<NumberLineMeta>) {
  const { operandA, operandB, answer, meta } = question
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 32 }}>=</span>
        <span style={{ color: '#FF6B35' }}>?</span>
      </div>

      <NumberLineDisplay operandA={operandA} operandB={operandB} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer)} disabled={disabled} />
    </div>
  )
}

const NumberLine: ExerciseDefinition<NumberLineMeta> = {
  id: 'number_line',
  label: 'Spring op de getallenlijn',
  supportsReveal: false,
  generateMeta(operandA, operandB) {
    return { options: makeOptions(operandA + operandB) }
  },
  Component: NumberLineComponent,
}

registerExercise(NumberLine)
