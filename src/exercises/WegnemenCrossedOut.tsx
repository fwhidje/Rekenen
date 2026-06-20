import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene, pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { DotGroup } from '../presentation/components/DotGroup'
import { SceneGroup } from '../presentation/components/SceneGroup'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { opGlyph, opColor } from './opDisplay'

// ─── wegnemen-crossed-out ─────────────────────────────────────────────────────
// The canonical workbook picture: the whole group drawn, the removed part
// crossed out. Static — no action to ride — so it sits one step more abstract
// than wegneem-tap: the child reads a take-away that already happened. This is
// the form she'll meet in every werkboek, so recognising it has transfer value
// of its own.

const TIERS: ExerciseTier[] = [
  { id: 'keuze',  minScore: 0,  label: 'kiezen',   description: 'Whole group with the removed part crossed out; pick the remainder from four numerals.' },
  { id: 'numpad', minScore: 50, label: 'intikken', description: 'Same picture; type the remainder — production instead of recognition.' },
]

interface WegnemenCrossedOutMeta {
  style: 'dots' | 'scene'
  sceneIndex: number
  color: string
  options: number[]
  tierId: string
}

function WegnemenCrossedOutComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<WegnemenCrossedOutMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const legacyScene = pickScene(meta.sceneIndex)
  const [input, setInput] = useState('')

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); onResolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(s => s + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>

      {/* Prompt */}
      <div style={{
        background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: tokens.ink,
      }}>Hoeveel blijven er over?</div>

      {/* The picture: whole group, removed part crossed out */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {meta.style === 'dots'
          ? <DotGroup n={operandA} color={meta.color} crossed={operandB} />
          : <SceneGroup n={operandA} scene={legacyScene} Counter={scene?.Counter} crossed={operandB} />}
      </div>

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 36 }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
        <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 30 }}>=</span>
        {meta.tierId === 'numpad' ? (
          <div style={{
            minWidth: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: input ? tokens.accent : tokens.paper,
            color: input ? 'white' : `${tokens.ink}55`,
            border: `2px solid ${input ? tokens.accent : tokens.paperMid}`,
            borderRadius: 12, fontSize: 30, fontFamily: 'Fredoka One, cursive',
            transition: 'background .18s, border-color .18s',
          }}>{input || '?'}</div>
        ) : (
          <span style={{ color: tokens.accentText }}>?</span>
        )}
      </div>

      {meta.tierId === 'numpad'
        ? <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
        : <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer, { givenAnswer: v })} disabled={disabled} tokens={scene?.tokens} />}
    </div>
  )
}

const WegnemenCrossedOut: ExerciseDefinition<WegnemenCrossedOutMeta> = {
  id: 'wegnemen-crossed-out',
  label: 'Doorgestreept',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Read a take-away that already happened: the crossed-out items are the removed part, the rest is the answer. The standard werkboek presentation of wegnemen.',
    pitfalls: [
      'Counting everything, crosses included — the whole instead of the remainder.',
      'Answering the crossed-out count (what left) instead of what remains.',
    ],
    progression: 'keuze: read the picture, pick the remainder. numpad (50+): same picture, typed answer. The picture itself never scaffolds further — its job is recognising the workbook form.',
  },
  generateMeta(operandA, operandB, score) {
    const tier = pickTier(TIERS, score)
    const [color] = pickColors()
    return {
      style: Math.random() < 0.5 ? 'dots' : 'scene',
      sceneIndex: Math.floor(Math.random() * 24),
      color,
      options: makeNumeralOptions(operandA - operandB, numeralRangeMax(operandA), 0),
      tierId: tier.id,
    }
  },
  Component: WegnemenCrossedOutComponent,
}

registerExercise(WegnemenCrossedOut)
