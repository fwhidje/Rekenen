import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NATURE_TOKENS } from '../presentation/tokens'

const DOT_POS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}

const SLOT = 62

type Stage = 'die-die' | 'die-mix' | 'die-number' | 'number-number'

interface DotPatternDecomposeMeta {
  showA:   boolean
  options: number[]
  stage:   Stage
}

// ─── Die primitives ───────────────────────────────────────────────────────────

function TwoColourDie({ total, splitAt, colourA, colourB, ink, paper, size }: {
  total: number; splitAt: number
  colourA: string; colourB: string
  ink: string; paper: string; size: number
}) {
  const positions = DOT_POS[total] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
      background: paper, border: `2px solid ${ink}`,
      borderRadius: Math.round(size * 0.12),
    }}>
      {positions.map(([x, y], i) => {
        const c = i < splitAt ? colourA : colourB
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: dotSize, height: dotSize, borderRadius: '50%',
            background: c, boxShadow: `0 3px 8px ${c}88`,
          }} />
        )
      })}
    </div>
  )
}

function Die({ n, colour, ink, paper, size }: {
  n: number; colour: string; ink: string; paper: string; size: number
}) {
  return <TwoColourDie total={n} splitAt={n} colourA={colour} colourB={colour} ink={ink} paper={paper} size={size} />
}

// ─── Slot — a bordered square used for known, ?, and choices ──────────────────

function NumSlot({ value, colour, ink, paper }: {
  value: number; colour: string; ink: string; paper: string
}) {
  return (
    <div style={{
      width: SLOT, height: SLOT, flexShrink: 0,
      background: paper, border: `2px solid ${ink}`, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 30, color: colour,
    }}>{value}</div>
  )
}

function QuestionSlot({ colour, ink, paper }: { colour: string; ink: string; paper: string }) {
  return (
    <div style={{
      width: SLOT, height: SLOT, flexShrink: 0,
      background: paper, border: `2px dashed ${colour}`, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 28, color: colour,
    }}>?</div>
  )
}

// ─── Choice button ────────────────────────────────────────────────────────────

function ChoiceButton({ value, colour, ink, paper, showDie, showNumber, onClick, disabled }: {
  value: number; colour: string; ink: string; paper: string
  showDie: boolean; showNumber: boolean
  onClick: () => void; disabled: boolean
}) {
  const dieSize = showNumber ? 46 : 50
  return (
    <button
      onClick={() => !disabled && onClick()}
      onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
      onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
      style={{
        width: '100%', padding: showDie ? '8px 4px' : '14px 4px',
        background: paper, border: `2px solid ${ink}`, borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
        opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
      }}>
      {showDie    && <Die n={value} colour={colour} ink={ink} paper={paper} size={dieSize} />}
      {showNumber && <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink, lineHeight: 1 }}>{value}</span>}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function DotPatternDecomposeComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<DotPatternDecomposeMeta>) {
  const { operandA, operandB, meta } = question
  const { showA, options, stage } = meta
  const { ink, paper, cream, refuse, dot } = scene?.tokens ?? NATURE_TOKENS

  const total       = operandA + operandB
  const colourA     = refuse
  const colourB     = dot
  const knownVal    = showA ? operandA : operandB
  const unknownVal  = showA ? operandB : operandA
  const knownColour = showA ? colourA  : colourB
  const unknownCol  = showA ? colourB  : colourA

  const knownAsNum   = stage === 'number-number'
  const showChoiceDie = stage === 'die-die' || stage === 'die-mix'
  const showChoiceNum = stage !== 'die-die'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Hoeveel?</div>

      <TwoColourDie
        total={total} splitAt={operandA}
        colourA={colourA} colourB={colourB}
        ink={ink} paper={paper} size={130}
      />

      {/* Big box: known + ? header, then choices */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '14px 12px', width: '100%', maxWidth: 320,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      }}>
        {/* Header row: known + ? */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {knownAsNum
            ? <NumSlot value={knownVal} colour={knownColour} ink={ink} paper={paper} />
            : <Die n={knownVal} colour={knownColour} ink={ink} paper={paper} size={SLOT} />
          }
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 26, color: ink }}>+</span>
          <QuestionSlot colour={unknownCol} ink={ink} paper={paper} />
        </div>

        {/* Choices */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${options.length}, 1fr)`,
          gap: 8, width: '100%',
        }}>
          {options.map(opt => (
            <ChoiceButton
              key={opt} value={opt} colour={unknownCol}
              ink={ink} paper={paper}
              showDie={showChoiceDie} showNumber={showChoiceNum}
              onClick={() => onResolve(opt === unknownVal)} disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

function makeOptions(correct: number, total: number): number[] {
  const pool = Array.from({ length: total + 1 }, (_, i) => i).filter(v => v !== correct)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return [...shuffled.slice(0, Math.min(3, pool.length)), correct].sort(() => Math.random() - 0.5)
}

function pickStage(score: number): Stage {
  if (score < 15) return 'die-die'
  if (score < 25) return 'die-mix'
  if (score < 37) return 'die-number'
  return 'number-number'
}

const DotPatternDecompose: ExerciseDefinition<DotPatternDecomposeMeta> = {
  id: 'dot-pattern-decompose',
  label: 'Splits het stippenpatroon',
  supportsReveal: false,
  generateMeta(operandA, operandB, score) {
    const showA = Math.random() < 0.5
    const unknown = showA ? operandB : operandA
    const total = operandA + operandB
    return {
      showA,
      options: makeOptions(unknown, total),
      stage:   pickStage(score),
    }
  },
  Component: DotPatternDecomposeComponent,
}

registerExercise(DotPatternDecompose)
