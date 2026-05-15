import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NumPad } from '../ui/components/NumPad'
import { NATURE_TOKENS } from '../presentation/tokens'

const DOT_POS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}

const CELL = 54
const GAP  = 6

type Stage = 'die-tap' | 'num-tap' | 'num-pad'

interface SplitsFrameMeta {
  showA: boolean
  stage: Stage
}

// ─── Die visual (tier 1) ─────────────────────────────────────────────────────

function DieDots({ count, colours, size }: { count: number; colours: string[]; size: number }) {
  const positions = DOT_POS[count] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: colours[i], boxShadow: `0 2px 6px ${colours[i]}88`,
        }} />
      ))}
    </div>
  )
}

function SplitDie({ total, splitAt, colourA, colourB, ink, paper, size }: {
  total: number; splitAt: number
  colourA: string; colourB: string
  ink: string; paper: string; size: number
}) {
  const r = Math.max(8, Math.round(size * 0.12))
  if (total <= 5) {
    const colours = Array.from({ length: total }, (_, i) => i < splitAt ? colourA : colourB)
    return (
      <div style={{ width: size, height: size, background: paper, borderRadius: r, border: `2px solid ${ink}` }}>
        <DieDots count={total} colours={colours} size={size} />
      </div>
    )
  }
  const leftCount = 5, rightCount = total - 5
  const leftC  = Array.from({ length: leftCount },  (_, i) => i < splitAt ? colourA : colourB)
  const rightC = Array.from({ length: rightCount }, (_, i) => (leftCount + i) < splitAt ? colourA : colourB)
  const sq = Math.round(size * 0.85)
  return (
    <div style={{ background: paper, borderRadius: r, border: `2px solid ${ink}`, padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
      <DieDots count={leftCount}  colours={leftC}  size={sq} />
      <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
      <DieDots count={rightCount} colours={rightC} size={sq} />
    </div>
  )
}

// ─── Frame cell ──────────────────────────────────────────────────────────────

function FrameCell({ filled, tapped, colour, ink, onTap }: {
  filled: boolean; tapped: boolean; colour: string; ink: string; onTap?: () => void
}) {
  const dotSize = Math.round(CELL * 0.55)
  const isGhost = !filled && !tapped
  return (
    <div
      onClick={onTap}
      style={{
        width: CELL, height: CELL, flexShrink: 0,
        border: `2px solid ${ink}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: onTap ? 'pointer' : 'default', userSelect: 'none',
      }}
    >
      <div style={{
        width: dotSize, height: dotSize, borderRadius: '50%',
        background: isGhost ? `${colour}28` : colour,
        boxShadow: isGhost ? 'none' : `0 2px 6px ${colour}88`,
        transition: 'background 0.18s, box-shadow 0.18s',
      }} />
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

function SplitsFrameComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsFrameMeta>) {
  const { operandA, operandB, meta } = question
  const { showA, stage } = meta
  const { ink, paper, cream, refuse, dot } = scene?.tokens ?? NATURE_TOKENS

  const total       = operandA + operandB
  const knownVal    = showA ? operandA : operandB
  const unknownVal  = showA ? operandB : operandA
  const knownColour = showA ? refuse : dot
  const unknownCol  = showA ? dot   : refuse

  const knownGroupW   = Math.max(0, knownVal   * CELL + (knownVal   - 1) * GAP)
  const unknownGroupW = Math.max(0, unknownVal * CELL + (unknownVal - 1) * GAP)

  const showDie    = stage === 'die-tap'
  const showLabels = stage !== 'die-tap'
  const showNumpad = stage === 'num-pad'

  const [tapped, setTapped] = useState<boolean[]>(() => Array(unknownVal).fill(false))
  const handleTap = (i: number) => {
    if (disabled || tapped[i]) return
    const next = [...tapped]
    next[i] = true
    setTapped(next)
    if (next.every(Boolean)) setTimeout(() => onResolve(true), 300)
  }

  const [input, setInput] = useState('')
  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) onResolve(parseInt(input, 10) === unknownVal); return }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Hoeveel?</div>

      {/* Puzzle box */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      }}>
        {/* Total: die at tier 1, number at tiers 2/3 */}
        {showDie
          ? <SplitDie total={total} splitAt={operandA} colourA={refuse} colourB={dot} ink={ink} paper={paper} size={90} />
          : <div style={{
              width: 70, height: 70, flexShrink: 0,
              background: paper, border: `2px solid ${ink}`, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 42, color: ink,
            }}>{total}</div>
        }

        {/* Frame + optional labels */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          {showLabels && (
            <div style={{ display: 'flex', gap: GAP }}>
              <div style={{
                width: knownGroupW, textAlign: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 20, color: knownColour,
              }}>{knownVal}</div>
              <div style={{
                width: unknownGroupW, textAlign: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 20, color: unknownCol,
              }}>?</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: GAP }}>
            {Array.from({ length: knownVal }, (_, i) => (
              <FrameCell key={i} filled={true} tapped={false} colour={knownColour} ink={ink} />
            ))}
            {Array.from({ length: unknownVal }, (_, i) => (
              <FrameCell
                key={knownVal + i}
                filled={false}
                tapped={!showNumpad && tapped[i]}
                colour={unknownCol}
                ink={ink}
                onTap={!showNumpad && !tapped[i] && !disabled ? () => handleTap(i) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Numpad tier: answer display + numpad */}
      {showNumpad && (
        <>
          <div style={{
            width: 70, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: input ? unknownCol : `${unknownCol}33`,
            color: input ? 'white' : unknownCol,
            borderRadius: 12, border: `2px solid ${ink}`,
            fontFamily: 'Fredoka One, cursive', fontSize: 32,
            transition: 'background .18s',
          }}>{input || '?'}</div>
          <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
        </>
      )}
    </div>
  )
}

// ─── Definition ──────────────────────────────────────────────────────────────

function pickStage(score: number): Stage {
  if (score < 15) return 'die-tap'
  if (score < 35) return 'num-tap'
  return 'num-pad'
}

const SplitsFrame: ExerciseDefinition<SplitsFrameMeta> = {
  id: 'splits-frame',
  label: 'Vul het frame in',
  supportsReveal: false,
  generateMeta(_a, _b, score) {
    const stage = pickStage(score)
    return {
      showA: stage === 'die-tap' ? true : Math.random() < 0.5,
      stage,
    }
  },
  Component: SplitsFrameComponent,
}

registerExercise(SplitsFrame)
