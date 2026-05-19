import { useEffect, useState } from 'react'
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

const CELL = 54   // cell size (px)

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

// ─── Joined frame ─────────────────────────────────────────────────────────────
// All cells share borders — one outer border, internal dividers only.

function JoinedFrame({ knownVal, unknownVal, knownColour, unknownCol, ink, paper, tapped, showNumpad, onTap, disabled }: {
  knownVal: number; unknownVal: number
  knownColour: string; unknownCol: string
  ink: string; paper: string
  tapped: boolean[]; showNumpad: boolean
  onTap: (i: number) => void; disabled: boolean
}) {
  const total = knownVal + unknownVal
  const dotSize = Math.round(CELL * 0.52)

  return (
    <div style={{
      display: 'inline-flex',
      border: `2px solid ${ink}`, borderRadius: 10,
      overflow: 'hidden',
    }}>
      {Array.from({ length: total }, (_, idx) => {
        const isKnown  = idx < knownVal
        const ghostIdx = idx - knownVal
        const isTapped = !isKnown && (tapped[ghostIdx] || showNumpad)
        const colour   = isKnown ? knownColour : unknownCol
        const filled   = isKnown || isTapped
        const ghost    = !isKnown && !isTapped
        const tappable = !isKnown && !showNumpad && !tapped[ghostIdx] && !disabled

        return (
          <div
            key={idx}
            onClick={tappable ? () => onTap(ghostIdx) : undefined}
            style={{
              width: CELL, height: CELL,
              background: paper,
              borderRight: idx < total - 1 ? `2px solid ${ink}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: tappable ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            <div style={{
              width: dotSize, height: dotSize, borderRadius: '50%',
              background: ghost ? `${colour}28` : colour,
              boxShadow: filled ? `0 2px 6px ${colour}88` : 'none',
              transition: 'background 0.18s, box-shadow 0.18s',
            }} />
          </div>
        )
      })}
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

  const showDie    = stage === 'die-tap'
  const showLabels = stage !== 'die-tap'
  const showNumpad = stage === 'num-pad'

  // Briefly true once the right answer is in: flips the "?" label to unknownVal
  // before onResolve hands control to the success screen.
  const [solved, setSolved] = useState(false)

  // Tier 1 & 2: tap state
  const [tapped, setTapped] = useState<boolean[]>(() => Array(unknownVal).fill(false))

  // Tier 3: numpad
  const [input, setInput] = useState('')

  // Reset per-question state when the question changes — the component is
  // reused across questions, so useState initialisers don't re-run.
  useEffect(() => {
    setSolved(false)
    setTapped(Array(unknownVal).fill(false))
    setInput('')
  }, [operandA, operandB, showA, stage, unknownVal])

  const handleTap = (i: number) => {
    if (disabled || tapped[i]) return
    const next = [...tapped]
    next[i] = true
    setTapped(next)
    if (next.every(Boolean)) {
      setSolved(true)
      setTimeout(() => onResolve(true), 300)
    }
  }

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') {
      if (!input) return
      const correct = parseInt(input, 10) === unknownVal
      if (correct) {
        setSolved(true)
        setTimeout(() => onResolve(true), 500)
      } else {
        onResolve(false)
      }
      return
    }
    if (input.length < 2) setInput(v => v + key)
  }

  // Label widths: one label per group, each spans its group's cells.
  // Each cell is CELL wide; internal borders are part of the cell, so widths add up exactly.
  const knownLabelW   = knownVal   * CELL + (knownVal   - 1) * 2  // each internal border = 2px counted in right cell
  const unknownLabelW = unknownVal * CELL + (unknownVal - 1) * 2

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
        {showDie
          ? <SplitDie total={total} splitAt={operandA} colourA={refuse} colourB={dot} ink={ink} paper={paper} size={90} />
          : <div style={{
              width: 70, height: 70, flexShrink: 0,
              background: paper, border: `2px solid ${ink}`, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 42, color: ink,
            }}>{total}</div>
        }

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          {showLabels && (
            <div style={{ display: 'flex' }}>
              <div style={{
                width: knownLabelW, textAlign: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 20, color: knownColour,
              }}>{knownVal}</div>
              <div style={{ width: 2 }} />
              <div style={{
                width: unknownLabelW, textAlign: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 20, color: unknownCol,
              }}>{solved ? unknownVal : '?'}</div>
            </div>
          )}
          <JoinedFrame
            knownVal={knownVal} unknownVal={unknownVal}
            knownColour={knownColour} unknownCol={unknownCol}
            ink={ink} paper={paper}
            tapped={tapped} showNumpad={showNumpad}
            onTap={handleTap} disabled={disabled}
          />
        </div>
        {showNumpad && (
          <div style={{
            width: 70, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: input ? unknownCol : `${unknownCol}33`,
            color: input ? 'white' : unknownCol,
            borderRadius: 12, border: `2px solid ${ink}`,
            fontFamily: 'Fredoka One, cursive', fontSize: 32,
            transition: 'background .18s',
          }}>{input || '?'}</div>
        )}
      </div>

      {showNumpad && (
        <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
      )}
    </div>
  )
}

// ─── Definition ──────────────────────────────────────────────────────────────

function pickStage(score: number): Stage {
  if (score < 30) return 'die-tap'
  if (score < 70) return 'num-tap'
  return 'num-pad'
}

const SplitsFrame: ExerciseDefinition<SplitsFrameMeta> = {
  id: 'splits-frame',
  label: 'Vul het frame in',
  supportsReveal: false,
  isCompatible: (a, b) => a > 0 && b > 0,
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
