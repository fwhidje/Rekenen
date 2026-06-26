import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene, pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { DotGroup } from '../presentation/components/DotGroup'
import { SceneGroup } from '../presentation/components/SceneGroup'
import { useReveal } from '../presentation/useReveal'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { opGlyph, opColor } from './opDisplay'

// ─── wegnemen-crossed-out ─────────────────────────────────────────────────────
// The canonical workbook picture: the whole group drawn, the removed part
// crossed out. At the keuze tier the cross-out ANIMATES — group appears, then
// the items strike out one at a time, then the rest of the equation — so the
// child sees the take-away happen (the minus made visible). Positions never
// reflow: all operandA items are laid out from the start, only their crossed
// state animates. At numpad it's the instant static werkboek form — the picture
// she'll meet in every workbook, worth recognising in its own right.

const TIERS: ExerciseTier[] = [
  { id: 'keuze',  minScore: 0,  label: 'kiezen',   description: 'Whole group; the removed part crosses out one item at a time, then the equation completes — the take-away made visible. Pick the remainder from four numerals.' },
  { id: 'numpad', minScore: 50, label: 'intikken', description: 'Same picture, shown instantly (no animation); type the remainder — production instead of recognition.' },
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

  // keuze: staged cross-out — group+a (step1), − (step2), then one ✕ per step
  // (operandB of them), then b/=/? (final step). numpad: instant (no reveal).
  // Positions never reflow: all operandA items render from the start and every
  // equation slot reserves its space — only opacity / crossed-state animates.
  const animate = meta.tierId === 'keuze'
  const delays = animate
    ? [350, 450, ...Array.from({ length: operandB }, () => 550), 500]
    : []
  const { step, complete } = useReveal(delays, question)

  const crossed = complete ? operandB : Math.max(0, Math.min(step - 2, operandB))
  const showA = complete || step >= 1
  const showMinus = complete || step >= 2
  const showRest = complete || step >= 3 + operandB

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); onResolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(s => s + key)
  }

  const fade = (show: boolean) => ({ opacity: show ? 1 : 0, transition: 'opacity .3s' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>

      {/* Prompt */}
      <div style={{
        background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: tokens.ink,
      }}>Hoeveel blijven er over?</div>

      {/* The picture: whole group, removed part crossing out one at a time */}
      <div style={{ display: 'flex', justifyContent: 'center', ...fade(showA) }}>
        {meta.style === 'dots'
          ? <DotGroup n={operandA} color={meta.color} crossed={crossed} />
          : <SceneGroup n={operandA} scene={legacyScene} Counter={scene?.Counter} crossed={crossed} />}
      </div>

      {/* Equation — built piece by piece; each slot keeps its space (no reflow) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 36 }}>
        <span style={{ color: tokens.accentText, ...fade(showA) }}>{operandA}</span>
        <span style={{ color: opColor(op, tokens), ...fade(showMinus) }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop, ...fade(showRest) }}>{operandB}</span>
        <span style={{ color: tokens.ink, opacity: showRest ? 0.4 : 0, transition: 'opacity .3s', fontSize: 30 }}>=</span>
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
          <span style={{ color: tokens.accentText, ...fade(showRest) }}>?</span>
        )}
      </div>

      {meta.tierId === 'numpad'
        ? <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
        : <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer, { givenAnswer: v })} disabled={disabled || !complete} tokens={scene?.tokens} />}
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
    progression: 'keuze: the take-away animates — group appears, items cross out one at a time, then the equation completes — so the minus is seen happening before the child picks the remainder. numpad (50+): the same picture shown instantly (no animation), typed answer — the static workbook form she must learn to read cold.',
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
