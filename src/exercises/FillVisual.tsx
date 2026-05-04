import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { DotGroup } from '../presentation/components/DotGroup'
import { SceneGroup } from '../presentation/components/SceneGroup'
import { NumPad } from '../ui/components/NumPad'
import { pickScene, pickColors } from '../presentation/scenes'
import { useState } from 'react'

// ─── Meta ─────────────────────────────────────────────────────────────────────

type VisualKind = 'dots' | 'scene'

interface FillVisualMeta {
  visualKind: VisualKind
  sceneIndex: number
  colorA: string
  colorB: string
}

// ─── Component ────────────────────────────────────────────────────────────────

function FillVisualComponent({
  question,
  onResolve,
  disabled,
}: ExerciseComponentProps<FillVisualMeta>) {
  const [input, setInput] = useState('')
  const { operandA, operandB, answer, meta } = question
  const scene = pickScene(meta.sceneIndex)
  const [colorA, colorB] = [meta.colorA, meta.colorB]

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') {
      if (input) onResolve(parseInt(input, 10) === answer)
      return
    }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {meta.visualKind === 'dots' ? (
          <DotGroup n={operandA} color={colorA} />
        ) : (
          <SceneGroup n={operandA} scene={scene} />
        )}
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: '#FF6B35' }}>+</span>
        {meta.visualKind === 'dots' ? (
          <DotGroup n={operandB} color={colorB} />
        ) : (
          <SceneGroup n={operandB} scene={scene} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 42 }}>
        <span style={{ color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ color: '#FF6B35' }}>+</span>
        <span style={{ color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ color: '#CCC', fontSize: 36 }}>=</span>
        <div style={{
          minWidth: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: input ? '#FF6B35' : '#F5F5F5', color: input ? 'white' : '#CCC',
          borderRadius: 14, fontSize: 36,
          boxShadow: input ? '0 4px 14px rgba(255,107,53,.4)' : 'none',
          transition: 'background .18s',
        }}>{input || '?'}</div>
      </div>

      <NumPad onKey={handleKey} disabled={disabled} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const FillVisual: ExerciseDefinition<FillVisualMeta> = {
  id: 'fill_visual',
  label: 'Tel en tel op',
  supportsReveal: true,

  generateMeta(operandA, operandB, score) {
    const sum = operandA + operandB
    // High score → lean toward plain dots; low score → scenes
    const sceneChance = sum <= 5 ? 0.7 : sum <= 8 ? 0.5 : 0.3
    const visualKind: VisualKind = score < 30 && Math.random() < sceneChance ? 'scene' : 'dots'
    const [colorA, colorB] = pickColors()
    return { visualKind, sceneIndex: Math.floor(Math.random() * 24), colorA, colorB }
  },

  Component: FillVisualComponent,
}

registerExercise(FillVisual)
