import { useState, useEffect } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'

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

// ─── Counter chip ─────────────────────────────────────────────────────────────

function CounterChip({ count, ink, paper }: { count: number; ink: string; paper: string }) {
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
      fontFamily: 'Fredoka One, cursive', fontSize: 22,
      color: ink, background: paper,
      border: `2px solid ${ink}`, borderRadius: 50,
      padding: '3px 16px',
      transform: bump ? 'scale(1.18)' : 'scale(1)',
      transition: 'transform .15s ease',
    }}>{count}</div>
  )
}

// ─── Tap dot (subitising style) ───────────────────────────────────────────────

function TapDot({ tapped, onClick, color }: { tapped: boolean; onClick: () => void; color: string }) {
  return (
    <div onClick={onClick} style={{
      width: 30, height: 30, borderRadius: '50%',
      background: color, boxShadow: `0 3px 8px ${color}88`,
      cursor: 'pointer',
      opacity: tapped ? 0 : 1,
      transform: tapped ? 'scale(0) rotate(15deg)' : 'scale(1)',
      transition: 'opacity .2s, transform .25s',
    }} />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function CountAndTapComponent({ question, onResolve, scene }: ExerciseComponentProps<CountAndTapMeta>) {
  const { operandA, meta } = question
  const [tapped, setTapped] = useState(new Set<number>())
  const done = tapped.size === operandA
  const legacyScene = pickScene(meta.sceneIndex)
  const { ink, paper, accent, confirm, refuse, dot } = scene?.tokens ?? NATURE_TOKENS

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
      background: done ? confirm : accent,
      color: 'white', border: `2px solid ${ink}`, borderRadius: 16,
      boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)',
      transition: 'background .35s',
    }}>{operandA}</div>
  )

  // ── Counter / emoji style ─────────────────────────────────────────────────
  if (meta.style === 'emoji') {
    const row1 = Math.min(operandA, 5)
    const row2 = operandA - row1
    const Counter = scene?.Counter
    const containerBg = scene?.containerBg ?? legacyScene.bg

    const renderItem = (i: number) => {
      const isTapped = tapped.has(i)
      const itemStyle: React.CSSProperties = {
        cursor: 'pointer',
        opacity: isTapped ? 0 : 1,
        transform: isTapped ? 'scale(0) rotate(15deg)' : 'scale(1)',
        transition: 'opacity .2s, transform .25s',
      }
      return Counter ? (
        <div key={i} onClick={() => tap(i)} style={itemStyle}>
          <Counter size={42} />
        </div>
      ) : (
        <span key={i} onClick={() => tap(i)} style={{ fontSize: 38, display: 'inline-block', ...itemStyle }}>
          {legacyScene.e}
        </span>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {targetBox}
          <CounterChip count={tapped.size} ink={ink} paper={paper} />
        </div>
        <div style={{ background: containerBg, borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {Array.from({ length: row1 }, (_, i) => renderItem(i))}
          </div>
          {row2 > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {Array.from({ length: row2 }, (_, j) => renderItem(5 + j))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Dots style — subitising patterns ─────────────────────────────────────
  const renderDieSquare = (count: number, color: string, indexOffset: number, size: number) => {
    const positions = DOT_POS[count] ?? []
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        {positions.map(([x, y], k) => {
          const i = indexOffset + k
          return (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
              <TapDot tapped={tapped.has(i)} onClick={() => tap(i)} color={color} />
            </div>
          )
        })}
      </div>
    )
  }

  if (operandA <= 5) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {targetBox}
          <CounterChip count={tapped.size} ink={ink} paper={paper} />
        </div>
        <div style={{ position: 'relative', width: 130, height: 130, background: paper, borderRadius: 16, border: `2px solid ${ink}` }}>
          {renderDieSquare(operandA, dot, 0, 130)}
        </div>
      </div>
    )
  }

  // 6–10: one shared box with two die-pattern groups side by side
  const right = operandA - 5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {targetBox}
        <CounterChip count={tapped.size} ink={ink} paper={paper} />
      </div>
      <div style={{
        background: paper, borderRadius: 16, border: `2px solid ${ink}`,
        padding: '10px 14px',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        {renderDieSquare(5, refuse, 0, 110)}
        <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
        {renderDieSquare(right, dot, 5, 110)}
      </div>
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const CountAndTap: ExerciseDefinition<CountAndTapMeta> = {
  id: 'count-and-tap',
  label: 'Tel en tik',
  supportsReveal: false,
  generateMeta(_a, _b, score) {
    return { style: score < 40 ? 'emoji' : 'dots', sceneIndex: Math.floor(Math.random() * 24) }
  },
  Component: CountAndTapComponent,
}

registerExercise(CountAndTap)
