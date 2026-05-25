import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'fill', minScore: 0, label: 'invullen', description: 'Target numeral shown. Kid taps cells of an empty ten-frame to fill exactly N. Cells toggle so an overshoot can be corrected. Single tier; the 5/10 structure of the frame is the built-in scaffold.' },
]

interface ShowMeOnTenFrameMeta {
  tierId: string
}

// ─── Interactive ten-frame ──────────────────────────────────────────────────

function FillableTenFrame({ filled, onToggle, disabled, ink, paper, accent }: {
  filled: Set<number>; onToggle: (i: number) => void; disabled: boolean
  ink: string; paper: string; accent: string
}) {
  const cellSize = 44
  return (
    <div style={{
      background: paper, border: `2px solid ${ink}`, borderRadius: 12,
      padding: 6, display: 'grid',
      gridTemplateColumns: `repeat(5, ${cellSize}px)`,
      gridTemplateRows: `repeat(2, ${cellSize}px)`,
      gap: 4,
    }}>
      {Array.from({ length: 10 }, (_, i) => {
        const isFilled = filled.has(i)
        return (
          <div key={i}
            onClick={() => !disabled && onToggle(i)}
            style={{
              width: cellSize, height: cellSize,
              border: `2px solid ${ink}`, borderRadius: 8, background: paper,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: disabled ? 'default' : 'pointer', userSelect: 'none',
            }}>
            {isFilled && (
              <div style={{
                width: cellSize - 14, height: cellSize - 14,
                borderRadius: '50%', background: accent,
                boxShadow: `0 2px 4px rgba(0,0,0,.2)`,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

function ShowMeOnTenFrameComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ShowMeOnTenFrameMeta>) {
  const { operandA } = question
  const { ink, paper, cream, accent, accentText, confirm } = scene?.tokens ?? NATURE_TOKENS

  const [filled, setFilled] = useState<Set<number>>(new Set())
  const [taps, setTaps] = useState(0)

  useEffect(() => { setFilled(new Set()); setTaps(0) }, [operandA])

  const toggle = (i: number) => {
    setTaps(t => t + 1)
    setFilled(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const submit = () => {
    if (disabled) return
    onResolve(filled.size === operandA, { givenAnswer: filled.size, tapCount: taps })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        Maak <span style={{ color: accentText }}>{operandA}</span>
      </div>

      <FillableTenFrame filled={filled} onToggle={toggle} disabled={disabled} ink={ink} paper={paper} accent={accent} />

      <button onClick={submit} disabled={disabled}
        onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.94)' }}
        onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
        style={{
          padding: '12px 32px', fontFamily: 'Fredoka One, cursive', fontSize: 24,
          background: confirm, color: 'white', border: `2px solid ${ink}`, borderRadius: 16,
          cursor: disabled ? 'default' : 'pointer', boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
          opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
        }}>Klaar</button>
    </div>
  )
}

const ShowMeOnTenFrame: ExerciseDefinition<ShowMeOnTenFrameMeta> = {
  id: 'show-me-on-ten-frame',
  label: 'Toon op de tienveld',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Reverse of ten-frame-show. From a target numeral, produce the quantity on a 5/10-structured frame. Forces active engagement with the 5-structure rather than passive reading.',
    pitfalls: [
      'Fills cells randomly — the task gets done but the 5/10 structure isn\'t used. Diagnostic: order of fills tells you whether the row-of-5 was the kid\'s anchor.',
      'Counts one-by-one as they tap, watching the running count, stopping when it matches — no chunked thinking.',
      'Overshoots and un-taps — counting by ones with poor running-total tracking.',
    ],
    progression: 'Single tier; difficulty scales with N. The 5/10 structure of the ten-frame is the built-in scaffold.',
  },
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: ShowMeOnTenFrameComponent,
}

registerExercise(ShowMeOnTenFrame)
