import { useState, useEffect } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { pickScene } from '../presentation/scenes'

interface CountAndTapMeta {
  style: 'emoji' | 'dots'
  sceneIndex: number
}

// Canonical subitising positions for 1–5 as [x%, y%] in a square container
const DOT_POS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}

// ─── Counter chip ──────────────────────────────────────────────────────────

function CounterChip({ count }: { count: number }) {
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (count === 0) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 180)
    return () => clearTimeout(t)
  }, [count])

  if (count === 0) return null

  return (
    <div style={{
      fontFamily: 'Fredoka One, cursive',
      fontSize: 22,
      color: '#FF6B35',
      background: '#FFF3EE',
      border: '2px solid #FF6B35',
      borderRadius: 50,
      padding: '3px 16px',
      transform: bump ? 'scale(1.18)' : 'scale(1)',
      transition: 'transform .15s ease',
    }}>{count}</div>
  )
}

// ─── Dot item (subitising style) ───────────────────────────────────────────

function TapDot({ tapped, onClick, color }: { tapped: boolean; onClick: () => void; color: string }) {
  return (
    <div onClick={onClick} style={{
      width: 30, height: 30, borderRadius: '50%',
      background: color,
      boxShadow: `0 3px 8px ${color}66`,
      cursor: 'pointer',
      opacity: tapped ? 0 : 1,
      transform: tapped ? 'scale(0) rotate(15deg)' : 'scale(1)',
      transition: 'opacity .2s, transform .25s',
    }} />
  )
}

// ─── Component ────────────────────────────────────────────────────────────

function CountAndTapComponent({ question, onResolve }: ExerciseComponentProps<CountAndTapMeta>) {
  const { operandA, meta } = question
  const [tapped, setTapped] = useState(new Set<number>())
  const done = tapped.size === operandA
  const scene = pickScene(meta.sceneIndex)

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => onResolve(true), 700)
      return () => clearTimeout(t)
    }
  }, [done, onResolve])

  const tap = (i: number) => {
    if (done || tapped.has(i)) return
    setTapped(s => new Set([...s, i]))
  }

  const targetBox = (
    <div style={{
      minWidth: 72, height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 48,
      background: done ? '#06D6A0' : '#FF6B35',
      color: 'white',
      borderRadius: 16,
      boxShadow: done ? '0 4px 16px rgba(6,214,160,.4)' : '0 4px 16px rgba(255,107,53,.4)',
      transition: 'background .35s, box-shadow .35s',
    }}>{operandA}</div>
  )

  // ── Emoji style ───────────────────────────────────────────────────────────
  if (meta.style === 'emoji') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          background: scene.bg, borderRadius: 16, padding: '14px 18px',
          display: 'flex', flexWrap: 'wrap', gap: 10,
          justifyContent: 'center', maxWidth: 300,
        }}>
          {Array.from({ length: operandA }, (_, i) => (
            <span key={i} onClick={() => tap(i)} style={{
              fontSize: 38, cursor: 'pointer', display: 'inline-block',
              opacity: tapped.has(i) ? 0 : 1,
              transform: tapped.has(i) ? 'scale(0) rotate(15deg)' : 'scale(1)',
              transition: 'opacity .2s, transform .25s',
            }}>{scene.e}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {targetBox}
          <CounterChip count={tapped.size} />
        </div>
      </div>
    )
  }

  // ── Dots style — subitising patterns ──────────────────────────────────────
  if (operandA <= 5) {
    const positions = DOT_POS[operandA] ?? []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          position: 'relative', width: 130, height: 130,
          background: '#F7F7F7', borderRadius: 16,
        }}>
          {positions.map(([x, y], i) => (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
              <TapDot tapped={tapped.has(i)} onClick={() => tap(i)} color='#4CC9F0' />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {targetBox}
          <CounterChip count={tapped.size} />
        </div>
      </div>
    )
  }

  // 6–10: two rows, top row = 5 (red), bottom row = n-5 (purple), 5-structure
  const row2 = operandA - 5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{
        background: '#F7F7F7', borderRadius: 16, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <TapDot key={i} tapped={tapped.has(i)} onClick={() => tap(i)} color='#EF233C' />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: row2 }, (_, j) => {
            const i = 5 + j
            return <TapDot key={i} tapped={tapped.has(i)} onClick={() => tap(i)} color='#9B5DE5' />
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {targetBox}
        <CounterChip count={tapped.size} />
      </div>
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────

const CountAndTap: ExerciseDefinition<CountAndTapMeta> = {
  id: 'count-and-tap',
  label: 'Tel en tik',
  supportsReveal: false,

  generateMeta(_a, _b, score) {
    return {
      style: score < 20 ? 'emoji' : 'dots',
      sceneIndex: Math.floor(Math.random() * 24),
    }
  },

  Component: CountAndTapComponent,
}

registerExercise(CountAndTap)
