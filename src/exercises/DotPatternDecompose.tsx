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

const SLOT = 62
const GREY = '#b9aa92'

type Stage = 'die-die' | 'die-numchoice' | 'num-num' | 'all-num'

interface DotPatternDecomposeMeta {
  showA:   boolean
  options: number[]
  stage:   Stage
}

// ─── Primitive: positioned dots ──────────────────────────────────────────────

function DieDots({ count, colours, size }: {
  count: number; colours: string[]; size: number
}) {
  const positions = DOT_POS[count] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: colours[i], boxShadow: `0 3px 8px ${colours[i]}88`,
          transition: 'background 0.4s, box-shadow 0.4s',
        }} />
      ))}
    </div>
  )
}

// ─── Total pattern: 1 or 2 die squares; first fills, then second ─────────────

function TotalPattern({ total, splitAt, litA, litB, colourA, colourB, ink, paper, size = 130 }: {
  total: number; splitAt: number; litA: boolean; litB: boolean
  colourA: string; colourB: string
  ink: string; paper: string; size?: number
}) {
  const cA = litA ? colourA : GREY
  const cB = litB ? colourB : GREY
  const colourFor = (i: number) => i < splitAt ? cA : cB
  const radius = Math.max(8, Math.round(size * 0.12))

  if (total <= 5) {
    const colours = Array.from({ length: total }, (_, i) => colourFor(i))
    return (
      <div style={{ width: size, height: size, background: paper, borderRadius: radius, border: `2px solid ${ink}` }}>
        <DieDots count={total} colours={colours} size={size} />
      </div>
    )
  }

  const leftCount = 5
  const rightCount = total - 5
  const leftColours  = Array.from({ length: leftCount },  (_, i) => colourFor(i))
  const rightColours = Array.from({ length: rightCount }, (_, i) => colourFor(leftCount + i))
  const innerSize = Math.round(size * 0.85)
  const padV = Math.max(4, Math.round(size * 0.08))
  const padH = Math.max(6, Math.round(size * 0.11))
  const gap  = Math.max(6, Math.round(size * 0.09))
  return (
    <div style={{
      background: paper, borderRadius: radius, border: `2px solid ${ink}`,
      padding: `${padV}px ${padH}px`,
      display: 'flex', gap, alignItems: 'center',
    }}>
      <DieDots count={leftCount}  colours={leftColours}  size={innerSize} />
      <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
      <DieDots count={rightCount} colours={rightColours} size={innerSize} />
    </div>
  )
}

// ─── Slots ───────────────────────────────────────────────────────────────────

function PartDie({ n, colour, ink, paper, size }: {
  n: number; colour: string; ink: string; paper: string; size: number
}) {
  const colours = Array.from({ length: n }, () => colour)
  return (
    <div style={{ width: size, height: size, background: paper, borderRadius: 10, border: `2px solid ${ink}` }}>
      <DieDots count={n} colours={colours} size={size} />
    </div>
  )
}

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

function QuestionSlot({ colour, paper }: { colour: string; paper: string }) {
  return (
    <div style={{
      width: SLOT, height: SLOT, flexShrink: 0,
      background: paper, border: `2px dashed ${colour}`, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 28, color: colour,
    }}>?</div>
  )
}

// ─── Choice button ───────────────────────────────────────────────────────────

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
      {showDie    && <PartDie n={value} colour={colour} ink={ink} paper={paper} size={dieSize} />}
      {showNumber && <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink, lineHeight: 1 }}>{value}</span>}
    </button>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

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

  const showTotalNum     = stage === 'all-num'
  const showNumberAssist = stage === 'die-numchoice' || stage === 'num-num'
  const knownAsNum       = stage === 'num-num' || stage === 'all-num'
  const useNumpad        = stage !== 'die-die'

  // Reveal sequencer.
  // step 0: total visible, all grey.
  // step 1: given side appears + given side's dots in total light up.
  // step 2: ? appears + remaining dots in total light up.
  // step 3: input ready (numpad) OR options fade in one by one (choices).
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  useEffect(() => {
    setStep(0)
    setInput('')
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 600))
    timers.push(setTimeout(() => setStep(2), 1400))
    if (useNumpad) {
      timers.push(setTimeout(() => setStep(3), 2200))
    } else {
      options.forEach((_, i) => {
        timers.push(setTimeout(() => setStep(3 + i), 2200 + i * 160))
      })
    }
    return () => timers.forEach(clearTimeout)
  }, [operandA, operandB, showA, stage])

  const fullyRevealed = useNumpad ? step >= 3 : step >= 2 + options.length

  const handleKey = (key: string) => {
    if (disabled || !fullyRevealed) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) onResolve(parseInt(input, 10) === unknownVal); return }
    if (input.length < 2) setInput(v => v + key)
  }

  const showGiven    = step >= 1
  const showQ        = step >= 2
  const litA         = (step >= 1 && showA) || step >= 2
  const litB         = (step >= 1 && !showA) || step >= 2
  const revealedOpts = Math.max(0, step - 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Hoeveel?</div>

      {/* Puzzle box: total + given/? row */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      }}>
        {showTotalNum
          ? <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{
                width: 90, height: 90, flexShrink: 0,
                background: paper, border: `2px solid ${ink}`, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 52, color: ink,
              }}>{total}</div>
              <TotalPattern
                total={total} splitAt={0}
                litA={true} litB={true}
                colourA={GREY} colourB={GREY}
                ink={ink} paper={paper} size={60}
              />
            </div>
          : showNumberAssist
            ? <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <TotalPattern
                  total={total} splitAt={operandA}
                  litA={litA} litB={litB}
                  colourA={colourA} colourB={colourB}
                  ink={ink} paper={paper}
                />
                <div style={{
                  width: 60, height: 60, flexShrink: 0,
                  background: paper, border: `2px solid ${ink}`, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fredoka One, cursive', fontSize: 36, color: ink,
                }}>{total}</div>
              </div>
            : <TotalPattern
                total={total} splitAt={operandA}
                litA={litA} litB={litB}
                colourA={colourA} colourB={colourB}
                ink={ink} paper={paper}
              />
        }

        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <div style={{ opacity: showGiven ? 1 : 0, transition: 'opacity 0.3s' }}>
            {knownAsNum
              ? <NumSlot value={knownVal} colour={knownColour} ink={ink} paper={paper} />
              : <PartDie n={knownVal} colour={knownColour} ink={ink} paper={paper} size={SLOT} />
            }
          </div>
          <div style={{ opacity: showQ ? 1 : 0, transition: 'opacity 0.3s' }}>
            <QuestionSlot colour={unknownCol} paper={paper} />
          </div>
        </div>

        {useNumpad && fullyRevealed && (
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

      {useNumpad
        ? fullyRevealed && <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
        : <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${options.length}, 1fr)`,
            gap: 10, width: '100%', maxWidth: 320,
          }}>
            {options.map((opt, i) => (
              <div key={opt} style={{ opacity: i < revealedOpts ? 1 : 0, transition: 'opacity 0.25s' }}>
                <ChoiceButton
                  value={opt} colour={unknownCol}
                  ink={ink} paper={paper}
                  showDie={true} showNumber={false}
                  onClick={() => onResolve(opt === unknownVal)}
                  disabled={disabled || !fullyRevealed}
                />
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── Definition ──────────────────────────────────────────────────────────────

function makeOptions(correct: number, total: number): number[] {
  const pool = Array.from({ length: total + 1 }, (_, i) => i).filter(v => v !== correct)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return [...shuffled.slice(0, Math.min(3, pool.length)), correct].sort(() => Math.random() - 0.5)
}

function pickStage(score: number): Stage {
  if (score < 12) return 'die-die'
  if (score < 25) return 'die-numchoice'
  if (score < 37) return 'num-num'
  return 'all-num'
}

const DotPatternDecompose: ExerciseDefinition<DotPatternDecomposeMeta> = {
  id: 'dot-pattern-decompose',
  label: 'Splits het stippenpatroon',
  supportsReveal: false,
  generateMeta(operandA, operandB, score) {
    const stage = pickStage(score)
    const showA = stage === 'die-die' ? true : Math.random() < 0.5
    const unknown = showA ? operandB : operandA
    const total = operandA + operandB
    return {
      showA,
      options: stage === 'die-die' ? makeOptions(unknown, total) : [],
      stage,
    }
  },
  Component: DotPatternDecomposeComponent,
}

registerExercise(DotPatternDecompose)
