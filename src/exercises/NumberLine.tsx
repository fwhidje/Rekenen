import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { opGlyph, opColor } from './opDisplay'

// ─── numberline-jump ──────────────────────────────────────────────────────────
// +1/+2 as sprongetjes: counting on (or back, for '−') made spatial. The line
// always spans the skill's full range (0–5 / 0–10) so the landing is never
// simply "the last cell". Direction comes from question.op — the same
// component will back the numberline-jump-back id for the − skills.

const TIERS: ExerciseTier[] = [
  { id: 'sprong-zien', minScore: 0,  label: 'sprong zien', description: 'The jump animates cell by cell from the start number; the landing shows "?" and the child picks it from four numerals.' },
  { id: 'sprong-zelf', minScore: 40, label: 'zelf springen', description: 'No animation: the start and the jump chip are given, the child taps the landing cell on the line — doing the jump instead of watching it.' },
  { id: 'kale-sprong', minScore: 70, label: 'kale sprong',  description: 'Sparse line: only the ends are labelled. The child places the landing from the structure of the line, not by reading labels.' },
]

interface NumberLineMeta {
  options: number[]
  tierId: string
}

const HOP_START_DELAY = 700
const HOP_STEP_MS = 480

function NumberLineComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberLineMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const dir = op === '-' ? -1 : 1
  // The jump always departs from the larger '+' operand — a flipped problem
  // ("1 + 4") starts at 4 and hops 1, start-from-the-larger made spatial. The
  // equation above keeps the written order. For '−' it's whole then part.
  const start = op === '-' ? operandA : Math.max(operandA, operandB)
  const jumpN = op === '-' ? operandB : Math.min(operandA, operandB)
  const range = numeralRangeMax(Math.max(start, answer))
  const tier = meta.tierId

  // sprong-zien: hop = jumps taken so far (0..jumpN); other tiers skip it.
  const [hop, setHop] = useState(0)
  const animDone = tier !== 'sprong-zien' || hop >= jumpN

  useEffect(() => { setHop(0) }, [question])
  useEffect(() => {
    if (tier !== 'sprong-zien' || hop >= jumpN) return
    const t = setTimeout(() => setHop(h => h + 1), hop === 0 ? HOP_START_DELAY : HOP_STEP_MS)
    return () => clearTimeout(t)
  }, [tier, hop, jumpN, question])

  const tappable = tier !== 'sprong-zien'
  const sparse = tier === 'kale-sprong'

  const tapCell = (i: number) => {
    if (!tappable || disabled) return
    onResolve(i === answer, { givenAnswer: i })
  }

  const cellW = Math.max(24, Math.min(34, Math.floor(320 / (range + 1))))
  const gap = 3
  const startOffset = start * (cellW + gap)

  const glyphColor = opColor(op, tokens)
  const current = start + dir * hop

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>

      {/* Equation — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38 }}>
        <span style={{ color: tokens.accentText }}>{operandA}</span>
        <span style={{ color: glyphColor }}>{opGlyph(op)}</span>
        <span style={{ color: tokens.pop }}>{operandB}</span>
        <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 32 }}>=</span>
        <span style={{ color: tokens.accentText }}>?</span>
      </div>

      <div style={{ width: '100%', padding: '8px 4px 4px', overflowX: 'auto' }}>
        {/* Jump chip above the start cell, pointing the direction */}
        <div style={{ height: 28, position: 'relative', marginBottom: 4 }}>
          <div style={{
            position: 'absolute',
            left: dir === 1 ? startOffset + cellW / 2 : undefined,
            right: dir === -1 ? `calc(100% - ${startOffset + cellW / 2}px)` : undefined,
            background: tokens.cream, color: glyphColor, border: `2px solid ${glyphColor}`,
            borderRadius: 8, padding: '2px 9px',
            fontFamily: 'Fredoka One, cursive', fontSize: 13, whiteSpace: 'nowrap',
          }}>
            {dir === 1 ? `${opGlyph(op)} ${jumpN} →` : `← ${opGlyph(op)} ${jumpN}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap, alignItems: 'flex-end' }}>
          {Array.from({ length: range + 1 }, (_, i) => {
            const isStart = i === start
            const isLanding = tier === 'sprong-zien' && animDone && i === answer
            const isTrail = tier === 'sprong-zien' && hop > 0 &&
              (dir === 1 ? i > start && i <= current : i < start && i >= current)
            const isCurrent = tier === 'sprong-zien' && hop > 0 && i === current && !animDone
            const showLabel = !sparse || i === 0 || i === range
            const bg = isStart ? tokens.dot
                     : isLanding ? tokens.pop
                     : isTrail ? `${tokens.accent}55`
                     : tokens.paper
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div
                  onClick={() => tapCell(i)}
                  style={{
                    width: cellW, height: cellW, borderRadius: 7, background: bg,
                    border: isStart ? `2.5px solid ${tokens.ink}` : isLanding ? `2.5px solid ${tokens.pop}` : `2px solid ${tokens.paperMid}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Fredoka One, cursive', fontSize: Math.floor(cellW * .48),
                    color: isStart ? tokens.ink : isLanding ? 'white' : `${tokens.ink}88`,
                    cursor: tappable && !disabled ? 'pointer' : 'default',
                    transform: isCurrent || isTrail && i === current ? 'scale(1.18)' : 'scale(1)',
                    transition: 'transform .2s ease, background .25s',
                  }}>
                  {isStart ? start : isLanding ? '?' : ''}
                </div>
                <span style={{ fontSize: 10, color: `${tokens.ink}66`, fontFamily: 'Fredoka One, cursive', minHeight: 12 }}>
                  {showLabel ? i : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {tier === 'sprong-zien' && (
        <ChoiceButtons
          options={meta.options}
          onPick={v => onResolve(v === answer, { givenAnswer: v })}
          disabled={disabled || !animDone}
          tokens={scene?.tokens}
        />
      )}
    </div>
  )
}

const NumberLine: ExerciseDefinition<NumberLineMeta> = {
  id: 'numberline-jump',
  label: 'Spring op de getallenlijn',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Model +1/+2 (and −1/−2) as jumps on the number line — counting on/back given spatial structure; the buurgetal relation made visible.',
    pitfalls: ['Off-by-one from counting the start cell as the first jump', 'Tapping the start instead of the landing', 'Reading cell labels instead of using the structure (probed by the sparse tier)'],
    progression: 'sprong-zien: the jump animates and the child reads the landing. sprong-zelf: the child makes the jump by tapping the landing. kale-sprong: same, on a line with only the ends labelled — the structure has to carry it. Watching → doing → doing without labels.',
  },
  generateMeta(operandA, operandB, score, problem) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    const answer = op === '-' ? operandA - operandB : operandA + operandB
    return {
      options: makeNumeralOptions(answer, numeralRangeMax(Math.max(operandA, answer)), 0),
      tierId: tier.id,
    }
  },
  Component: NumberLineComponent,
}

registerExercise(NumberLine)
