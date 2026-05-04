import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { pickScene } from '../presentation/scenes'
import { useState, useEffect } from 'react'

// Collect has two interaction modes:
//   tap  — child taps each emoji to "collect" it (low score)
//   counter — child uses +/− to count up to the total (higher score)
type CollectMode = 'tap' | 'counter'

interface CollectMeta {
  mode: CollectMode
  sceneIndex: number
}

// ─── Tap variant ──────────────────────────────────────────────────────────────

function TapCollect({ operandA, operandB, meta, onResolve }: {
  operandA: number; operandB: number; meta: CollectMeta; onResolve: (ok: boolean) => void
}) {
  const [gone, setGone] = useState(new Set<string>())
  const scene = pickScene(meta.sceneIndex)
  const total = operandA + operandB
  const done = gone.size === total

  useEffect(() => { if (done) setTimeout(() => onResolve(true), 700) }, [done, onResolve])

  const items = [
    ...Array.from({ length: operandA }, (_, i) => ({ key: `a${i}` })),
    ...Array.from({ length: operandB }, (_, i) => ({ key: `b${i}` })),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 42 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 36 }}>=</span>
        <span style={{ color: '#FF6B35' }}>?</span>
      </div>
      <div style={{
        background: scene.bg, borderRadius: 16, padding: '12px 14px',
        display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 280,
      }}>
        {items.map(({ key }) => (
          <span key={key} onClick={() => !gone.has(key) && !done && setGone(s => new Set([...s, key]))}
            style={{
              fontSize: 32, cursor: 'pointer', display: 'inline-block',
              opacity: gone.has(key) ? 0 : 1,
              transform: gone.has(key) ? 'scale(0) rotate(20deg)' : 'scale(1)',
              transition: 'transform .25s, opacity .2s',
            }}>{scene.e}</span>
        ))}
      </div>
      <div style={{
        minWidth: 80, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: done ? '#06D6A0' : 'white', border: `3px ${done ? 'solid' : 'dashed'} ${done ? '#06D6A0' : '#FF6B35'}`,
        borderRadius: 16, fontFamily: 'Fredoka One, cursive', fontSize: 22,
        color: done ? 'white' : '#FF6B35', transition: 'all .3s',
      }}>{gone.size}/{total}</div>
    </div>
  )
}

// ─── Counter variant ──────────────────────────────────────────────────────────

function CounterCollect({ operandA, operandB, onResolve, disabled }: {
  operandA: number; operandB: number; onResolve: (ok: boolean) => void; disabled: boolean
}) {
  const [count, setCount] = useState(operandA)
  const target = operandA + operandB

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 52 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 44 }}>=</span>
        <div style={{
          minWidth: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: count > 0 ? '#FF6B35' : '#F5F5F5', color: count > 0 ? 'white' : '#CCC',
          borderRadius: 14, fontSize: 44, fontFamily: 'Fredoka One, cursive',
          transition: 'background .18s',
        }}>{count || '?'}</div>
      </div>
      <div style={{ display: 'flex', gap: 18 }}>
        {[['−', '#EF233C', () => setCount(c => Math.max(0, c - 1))], ['+', '#4CC9F0', () => setCount(c => c + 1)]].map(([label, color, fn]) => (
          <button key={label as string} onClick={() => !disabled && (fn as () => void)()}
            style={{ width: 72, height: 72, fontSize: 44, fontFamily: 'Fredoka One, cursive', background: color as string, color: 'white', border: 'none', borderRadius: 18, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: `0 5px 16px ${color as string}55` }}>{label as string}</button>
        ))}
      </div>
      <button onClick={() => !disabled && count > 0 && onResolve(count === target)}
        disabled={disabled || count === 0}
        style={{ padding: '14px 44px', fontSize: 22, fontFamily: 'Fredoka One, cursive', background: '#FF6B35', color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer', boxShadow: '0 5px 16px rgba(255,107,53,.4)' }}>
        ✓ Klaar!
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function CollectComponent({ question, onResolve, disabled }: ExerciseComponentProps<CollectMeta>) {
  const { operandA, operandB, meta } = question
  if (meta.mode === 'tap') return <TapCollect operandA={operandA} operandB={operandB} meta={meta} onResolve={onResolve} />
  return <CounterCollect operandA={operandA} operandB={operandB} onResolve={onResolve} disabled={disabled} />
}

// ─── Definition ───────────────────────────────────────────────────────────────

const Collect: ExerciseDefinition<CollectMeta> = {
  id: 'collect',
  label: 'Tel samen!',
  supportsReveal: false,

  generateMeta(_operandA, _operandB, score) {
    return {
      mode: score < 20 ? 'tap' : 'counter',
      sceneIndex: Math.floor(Math.random() * 24),
    }
  },

  Component: CollectComponent,
}

registerExercise(Collect)
