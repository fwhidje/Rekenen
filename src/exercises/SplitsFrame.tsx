import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NumPad } from '../ui/components/NumPad'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { DOT_POS } from '../presentation/diePatterns'
import { makeNumeralOptions } from './choiceOptions'

const CELL = 54   // cell size (px)

type Stage = 'die-keuze' | 'getal-keuze' | 'num-pad'
type Phase = 'ask' | 'reveal' | 'merge'

// Tier ids match the Stage values; thresholds (0/30/70) live here.
const TIERS: ExerciseTier[] = [
  { id: 'die-keuze',   minScore: 0,  label: 'stippen kiezen', description: 'Total as a colour-split die; the known part sits in the frame, the missing part is a "?" — pick it as a dot tile. Fully perceptual, but a real decision.' },
  { id: 'getal-keuze', minScore: 30, label: 'getal kiezen',   description: 'The split statement ("5 is 2 en ?") with the known part as dots; pick the missing part as a numeral.' },
  { id: 'num-pad',     minScore: 70, label: 'intikken',        description: 'Same statement, missing part typed on the numpad — symbolic, no choice scaffold.' },
]

interface SplitsFrameMeta {
  showA: boolean
  stage: Stage
  options: number[]
  tierId: string
}

// ─── Die visuals ─────────────────────────────────────────────────────────────

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
  const colours = Array.from({ length: total }, (_, i) => i < splitAt ? colourA : colourB)
  return (
    <div style={{ width: size, height: size, background: paper, borderRadius: r, border: `2px solid ${ink}` }}>
      <DieDots count={total} colours={colours} size={size} />
    </div>
  )
}

// ─── Joined frame ─────────────────────────────────────────────────────────────
// ask:    known cells with dots + ONE fixed-width "?" cell (its width must not
//         leak the size of the missing part).
// reveal: the "?" becomes the missing cells, dots pop in.
// merge:  dividers fade and all dots take one colour — the parts visibly
//         become the whole.

function Frame({ knownVal, unknownVal, knownColour, unknownCol, mergeColour, ink, paper, phase }: {
  knownVal: number; unknownVal: number
  knownColour: string; unknownCol: string; mergeColour: string
  ink: string; paper: string
  phase: Phase
}) {
  const dotSize = Math.round(CELL * 0.52)
  const merged = phase === 'merge'
  const revealed = phase !== 'ask'

  const cell = (key: string, content: React.ReactNode, withDivider: boolean) => (
    <div key={key} style={{
      width: CELL, height: CELL,
      background: paper,
      borderRight: withDivider ? `2px solid ${merged ? `${ink}00` : ink}` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color .5s',
      userSelect: 'none',
    }}>{content}</div>
  )

  const dot = (colour: string, key: string) => (
    <div key={key} style={{
      width: dotSize, height: dotSize, borderRadius: '50%',
      background: colour, boxShadow: `0 2px 6px ${colour}88`,
      transition: 'background-color .45s, box-shadow .45s',
    }} />
  )

  const cells: React.ReactNode[] = []
  for (let i = 0; i < knownVal; i++) {
    const colour = merged ? mergeColour : knownColour
    // Known cells always have a divider: the "?" or the revealed cells follow.
    cells.push(cell(`k${i}`, dot(colour, `kd${i}`), true))
  }
  if (!revealed) {
    cells.push(cell('q', (
      <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 30, color: unknownCol }}>?</span>
    ), false))
  } else {
    for (let i = 0; i < unknownVal; i++) {
      const colour = merged ? mergeColour : unknownCol
      cells.push(cell(`u${i}`, dot(colour, `ud${i}`), i < unknownVal - 1))
    }
  }

  return (
    <div style={{
      display: 'inline-flex',
      border: `2px solid ${ink}`, borderRadius: 10,
      overflow: 'hidden',
    }}>{cells}</div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

function SplitsFrameComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsFrameMeta>) {
  const { operandA, operandB, meta } = question
  const { showA, stage, options } = meta
  const { ink, paper, cream, accentText, confirm, refuse, dot } = scene?.tokens ?? NATURE_TOKENS

  const total       = operandA + operandB
  const knownVal    = showA ? operandA : operandB
  const unknownVal  = showA ? operandB : operandA
  const knownColour = showA ? refuse : dot
  const unknownCol  = showA ? dot   : refuse

  const [phase, setPhase] = useState<Phase>('ask')
  const [input, setInput] = useState('')

  useEffect(() => {
    setPhase('ask')
    setInput('')
  }, [operandA, operandB, showA, stage])

  const answer = (given: number) => {
    if (disabled || phase !== 'ask') return
    if (given === unknownVal) {
      setPhase('reveal')
      setTimeout(() => setPhase('merge'), 500)
      setTimeout(() => onResolve(true, { givenAnswer: given }), 1500)
    } else {
      onResolve(false, { givenAnswer: given })
    }
  }

  const handleKey = (key: string) => {
    if (disabled || phase !== 'ask') return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) answer(parseInt(input, 10)); return }
    if (input.length < 2) setInput(v => v + key)
  }

  const solved = phase !== 'ask'

  // Prompt: the split statement IS the equation-visible invariant for splitsen.
  const prompt = stage === 'die-keuze'
    ? <>Wat hoort erbij?</>
    : <>
        {total} is <span style={{ color: knownColour }}>{knownVal}</span> en{' '}
        <span style={{ color: solved ? unknownCol : accentText }}>{solved ? unknownVal : '?'}</span>
      </>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>{prompt}</div>

      {/* Puzzle box */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      }}>
        {stage === 'die-keuze' && (
          <SplitDie total={total} splitAt={operandA} colourA={refuse} colourB={dot}
            ink={ink} paper={paper} size={90} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Frame
            knownVal={knownVal} unknownVal={unknownVal}
            knownColour={knownColour} unknownCol={unknownCol} mergeColour={confirm}
            ink={ink} paper={paper} phase={phase}
          />
          {/* The whole, named — appears as the parts merge */}
          <div style={{
            minWidth: 46, height: 46, padding: '0 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: confirm, color: 'white',
            borderRadius: 12, border: `2px solid ${ink}`,
            fontFamily: 'Fredoka One, cursive', fontSize: 28,
            opacity: phase === 'merge' ? 1 : 0,
            transform: phase === 'merge' ? 'scale(1)' : 'scale(0.6)',
            transition: 'opacity .4s, transform .4s',
          }}>{total}</div>
        </div>

        {stage === 'num-pad' && (
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

      {/* Input */}
      {stage === 'die-keuze' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%', maxWidth: 380 }}>
          {options.map((v, i) => (
            <div key={i} onClick={() => answer(v)} style={{
              background: cream, border: `2px solid ${ink}`, borderRadius: 16,
              padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: disabled || solved ? 'default' : 'pointer',
              boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: disabled && !solved ? 0.45 : 1, userSelect: 'none',
            }}>
              <DieDots count={v} colours={Array(v).fill(unknownCol)} size={56} />
            </div>
          ))}
        </div>
      )}
      {stage === 'getal-keuze' && (
        <ChoiceButtons options={options} onPick={answer} disabled={disabled || solved} tokens={scene?.tokens} />
      )}
      {stage === 'num-pad' && (
        <NumPad onKey={handleKey} disabled={disabled || solved} tokens={scene?.tokens} />
      )}
    </div>
  )
}

// ─── Definition ──────────────────────────────────────────────────────────────

const SplitsFrame: ExerciseDefinition<SplitsFrameMeta> = {
  id: 'splits-frame',
  label: 'Vul het frame in',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Complete a part-whole frame: given the total and one part, identify the other — then watch the parts visibly merge back into the whole. The only splitsen exercise that shows composition (parts become the whole), not just decomposition.',
    pitfalls: [
      'Echoes the known part — picks the value that is already visible instead of the missing one.',
      'Off-by-one on the missing part, especially reading the die at die-keuze.',
      'At getal-keuze, answers the total instead of the part — reads "5 is 2 en ?" as "how many in total?".',
    ],
    progression: 'die-keuze (split die + dot-tile options — perceptual matching, but a real decision) → getal-keuze (split statement + numeral choice — the part must be derived) → num-pad (typed, no choice scaffold). The merge animation plays at every tier: composition stays visible while the scaffolds fade.',
  },
  isCompatible: (a, b) => a > 0 && b > 0,
  generateMeta(a, b, score) {
    const stage = pickTier(TIERS, score).id as Stage
    const showA = Math.random() < 0.5
    const unknown = showA ? b : a
    return {
      showA,
      stage,
      // Parts in tot-5 run 1..4 — keep distractors in that range.
      options: makeNumeralOptions(unknown, 4),
      tierId: stage,
    }
  },
  Component: SplitsFrameComponent,
}

registerExercise(SplitsFrame)
