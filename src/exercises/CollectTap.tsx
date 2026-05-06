import { useState, useEffect } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { pickScene } from '../presentation/scenes'

interface CollectTapMeta {
  sceneIndex: number
}

function CollectTapComponent({ question, onResolve }: ExerciseComponentProps<CollectTapMeta>) {
  const { operandA, operandB, meta } = question
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

const CollectTap: ExerciseDefinition<CollectTapMeta> = {
  id: 'collect-tap',
  label: 'Tel samen door tikken',
  supportsReveal: false,
  generateMeta: () => ({ sceneIndex: Math.floor(Math.random() * 24) }),
  Component: CollectTapComponent,
}

registerExercise(CollectTap)
