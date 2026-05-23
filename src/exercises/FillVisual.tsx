import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { DotGroup } from '../presentation/components/DotGroup'
import { SceneGroup } from '../presentation/components/SceneGroup'
import { NumPad } from '../ui/components/NumPad'
import { pickScene, pickColors } from '../presentation/scenes'
import { useReveal } from '../presentation/useReveal'

// ─── Meta ─────────────────────────────────────────────────────────────────────

type VisualKind = 'dots' | 'scene' | 'none'
type RevealKind = 'visual' | 'equation' | 'instant'

interface FillVisualMeta {
  visualKind: VisualKind
  revealKind: RevealKind
  sceneIndex: number
  colorA: string
  colorB: string
  tierId: string
}

// Tier ids double as the reveal kind: the score band picks how much of the
// equation is built up before input unlocks.
const TIERS: ExerciseTier[] = [
  { id: 'visual',   minScore: 0,  label: 'volledige opbouw', description: 'Full piece-by-piece reveal: visual groups, then numbers, then "= ?". Maximum support.' },
  { id: 'equation', minScore: 40, label: 'som opbouw',       description: 'Numbers-only reveal — no visual groups; the equation animates in then unlocks.' },
  { id: 'instant',  minScore: 80, label: 'meteen',           description: 'Equation shown instantly, no reveal — the child works abstractly at speed.' },
]

// ─── Reveal timing ────────────────────────────────────────────────────────────
// visual (7 steps):  visA → visPlus → visB → numA → eqPlus → numB → complete
// equation (4 steps): numA → eqPlus → numB → complete
// instant (0 steps): complete immediately

const VISUAL_DELAYS   = [400, 600, 600, 700, 500, 500, 600]
const EQUATION_DELAYS = [400, 500, 500, 600]

// ─── Fade helper ──────────────────────────────────────────────────────────────

function fade(visible: boolean): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.4)',
    transition: 'opacity .3s ease, transform .35s ease',
    display: 'inline-block',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function FillVisualComponent({ question, onResolve, disabled }: ExerciseComponentProps<FillVisualMeta>) {
  const [input, setInput] = useState('')
  const { operandA, operandB, answer, meta } = question
  const scene = meta.visualKind === 'scene' ? pickScene(meta.sceneIndex) : null

  const delays = meta.revealKind === 'visual' ? VISUAL_DELAYS
               : meta.revealKind === 'equation' ? EQUATION_DELAYS
               : []

  const { step, complete } = useReveal(delays, question)

  // Visibility flags per element
  const v = meta.revealKind === 'instant' ? {
    visA: true, visPlus: true, visB: true,
    numA: true, eqPlus: true, numB: true, eq: true,
  } : meta.revealKind === 'visual' ? {
    visA:    step >= 1,
    visPlus: step >= 2,
    visB:    step >= 3,
    numA:    step >= 4,
    eqPlus:  step >= 5,
    numB:    step >= 6,
    eq:      complete,
  } : {
    // equation reveal — no visual
    visA: false, visPlus: false, visB: false,
    numA:    step >= 1,
    eqPlus:  step >= 2,
    numB:    step >= 3,
    eq:      complete,
  }

  const hasVisual = meta.visualKind !== 'none'
  const fs        = hasVisual ? 42 : 60
  const slotSize  = hasVisual ? 54 : 72

  const handleKey = (key: string) => {
    if (disabled || !complete) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); onResolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(s => s + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

      {/* Visual row — only present for visual reveal kind */}
      {hasVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', minHeight: 80 }}>
          <div style={{ opacity: v.visA ? 1 : 0, transform: v.visA ? 'scale(1)' : 'scale(0.4)', transition: 'opacity .3s ease, transform .35s ease' }}>
            {meta.visualKind === 'dots'
              ? <DotGroup n={operandA} color={meta.colorA} />
              : <SceneGroup n={operandA} scene={scene!} />}
          </div>
          <span style={{ ...fade(v.visPlus), fontFamily: 'Fredoka One, cursive', fontSize: 28, color: '#FF6B35' }}>+</span>
          <div style={{ opacity: v.visB ? 1 : 0, transform: v.visB ? 'scale(1)' : 'scale(0.4)', transition: 'opacity .3s ease, transform .35s ease' }}>
            {meta.visualKind === 'dots'
              ? <DotGroup n={operandB} color={meta.colorB} />
              : <SceneGroup n={operandB} scene={scene!} />}
          </div>
        </div>
      )}

      {/* Equation row — always in DOM, elements animate in via opacity/transform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: hasVisual ? 10 : 14, flexWrap: 'wrap', justifyContent: 'center', minHeight: hasVisual ? 60 : 80 }}>
        <span style={{ ...fade(v.numA),   fontFamily: 'Fredoka One, cursive', fontSize: fs, color: '#4CC9F0' }}>{operandA}</span>
        <span style={{ ...fade(v.eqPlus), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: '#FF6B35' }}>+</span>
        <span style={{ ...fade(v.numB),   fontFamily: 'Fredoka One, cursive', fontSize: fs, color: '#9B5DE5' }}>{operandB}</span>
        <span style={{ ...fade(v.eq),     fontFamily: 'Fredoka One, cursive', fontSize: Math.round(fs * 0.85), color: '#CCC' }}>=</span>
        <div style={{
          ...fade(v.eq),
          minWidth: slotSize, height: slotSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: Math.round(fs * 0.85),
          background: input ? '#FF6B35' : '#F5F5F5',
          color: input ? 'white' : '#CCC',
          borderRadius: 14,
          boxShadow: input ? '0 4px 14px rgba(255,107,53,.4)' : 'none',
          // override transition to also animate background/shadow
          transition: 'background .18s, box-shadow .18s, opacity .3s ease, transform .35s ease',
        }}>{input || '?'}</div>
      </div>

      <NumPad onKey={handleKey} disabled={disabled || !complete} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const FillVisual: ExerciseDefinition<FillVisualMeta> = {
  id: 'fill-vis',
  label: 'Tel en tel op',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Compute a sum, scaffolded by a timed reveal that builds the equation from concrete groups to symbols.',
    pitfalls: ['Counting all from 1 instead of counting on', 'Off-by-one', 'Typing before the reveal completes'],
    progression: 'visual (full concrete→symbolic reveal) → equation (symbols only) → instant (no reveal). Support fades as score rises.',
  },

  generateMeta(_operandA, _operandB, score) {
    const tier = pickTier(TIERS, score)
    const revealKind = tier.id as RevealKind
    const visualKind: VisualKind =
      revealKind === 'visual' ? (Math.random() < 0.5 ? 'dots' : 'scene') : 'none'
    const [colorA, colorB] = pickColors()
    return { visualKind, revealKind, sceneIndex: Math.floor(Math.random() * 24), colorA, colorB, tierId: tier.id }
  },

  Component: FillVisualComponent,
}

registerExercise(FillVisual)
