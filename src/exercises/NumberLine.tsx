import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { Panel } from '../presentation/components/Panel'
import { useReveal } from '../presentation/useReveal'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { opGlyph, opColor } from './opDisplay'

// ─── numberline-jump ──────────────────────────────────────────────────────────
// +1/+2 as sprongetjes: counting on (or back, for '−') made spatial. The line
// always spans the skill's full range (0–5 / 0–10) so the landing is never
// simply "the last cell". Written order: the jump starts at operandA and moves
// operandB (no start-from-larger reordering — that lives only in the fill-vis
// commutativity swap). Direction comes from question.op — the same component
// backs the numberline-jump-back id for the − skills.

const TIERS: ExerciseTier[] = [
  { id: 'sprong-zien', minScore: 0,  label: 'sprong zien', description: 'Staged reveal: the sum builds, then the line appears, the start cell lights, the jump animates cell by cell to the landing "?"; the child picks it from four numerals.' },
  { id: 'sprong-zelf', minScore: 40, label: 'zelf springen', description: 'No animation: the start and the jump chip are given, the child taps the landing cell on the line — doing the jump instead of watching it.' },
  { id: 'kale-sprong', minScore: 70, label: 'kale sprong',  description: 'Sparse line: only the ends are labelled. The child places the landing from the structure of the line, not by reading labels.' },
]

interface NumberLineMeta {
  options: number[]
  tierId: string
}

// sprong-zien opening reveal: [sum A] → [op + B] → [= ?] → [line appears].
const REVEAL_DELAYS = [450, 550, 500, 500]
const HOP_START_DELAY = 600
const HOP_STEP_MS = 480
// Hold the filled equation before the feedback overlay (see ErbijTap).
const CLOSURE_MS = 850

function NumberLineComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberLineMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const dir = op === '-' ? -1 : 1
  const start = operandA   // written order: jump departs from the first operand
  const jumpN = operandB   // …and moves the second
  const range = numeralRangeMax(Math.max(start, answer))
  const tier = meta.tierId
  const isZien = tier === 'sprong-zien'

  // Staged opening reveal for sprong-zien only; other tiers show instantly.
  const { step, complete: revealDone } = useReveal(isZien ? REVEAL_DELAYS : [], question)
  const showA = !isZien || step >= 1
  const showOpB = !isZien || step >= 2
  const showTail = !isZien || step >= 3
  const showLine = !isZien || step >= 4

  // sprong-zien: hop = jumps taken so far (0..jumpN), starting after the reveal.
  const [hop, setHop] = useState(0)
  const [committed, setCommitted] = useState<number | null>(null)
  const [resolved, setResolved] = useState(false)
  const animDone = !isZien || hop >= jumpN

  useEffect(() => { setHop(0); setCommitted(null); setResolved(false) }, [question])
  useEffect(() => {
    if (!isZien || !revealDone || hop >= jumpN) return
    const t = setTimeout(() => setHop(h => h + 1), hop === 0 ? HOP_START_DELAY : HOP_STEP_MS)
    return () => clearTimeout(t)
  }, [isZien, revealDone, hop, jumpN, question])

  const tappable = !isZien
  const sparse = tier === 'kale-sprong'

  // On a correct answer, fill the equation and hold it briefly so the completed
  // sum is seen before the full-screen feedback overlay covers it.
  const resolve = (v: number) => {
    if (resolved) return
    setResolved(true)
    const ok = v === answer
    if (ok) {
      setCommitted(answer)
      setTimeout(() => onResolve(true, { givenAnswer: v }), CLOSURE_MS)
    } else {
      onResolve(false, { givenAnswer: v })
    }
  }

  const tapCell = (i: number) => {
    if (!tappable || disabled || resolved) return
    resolve(i)
  }

  const cellW = Math.max(24, Math.min(34, Math.floor(320 / (range + 1))))
  const gap = 3
  const startOffset = start * (cellW + gap)

  const glyphColor = opColor(op, tokens)
  const current = start + dir * hop
  const tail = committed !== null ? committed : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>

      <Panel bg={scene?.containerBg ?? 'rgba(255,255,255,.5)'} style={{ width: '100%', maxWidth: 380 }}>
        {/* Equation — built by the reveal, then always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38, minHeight: 46 }}>
          <span style={{ color: tokens.accentText, opacity: showA ? 1 : 0, transition: 'opacity .3s' }}>{operandA}</span>
          <span style={{ color: glyphColor, opacity: showOpB ? 1 : 0, transition: 'opacity .3s' }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop, opacity: showOpB ? 1 : 0, transition: 'opacity .3s' }}>{operandB}</span>
          <span style={{ color: tokens.ink, opacity: showTail ? 0.4 : 0, fontSize: 32, transition: 'opacity .3s' }}>=</span>
          <span style={{ color: tokens.accentText, opacity: showTail ? 1 : 0, transition: 'opacity .3s' }}>{tail}</span>
        </div>

        <div style={{ width: '100%', padding: '8px 4px 4px', overflowX: 'auto', opacity: showLine ? 1 : 0, transition: 'opacity .4s' }}>
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
              const isLanding = isZien && animDone && i === answer
              const isTrail = isZien && hop > 0 &&
                (dir === 1 ? i > start && i <= current : i < start && i >= current)
              const isCurrent = isZien && hop > 0 && i === current && !animDone
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
      </Panel>

      {isZien && (
        <ChoiceButtons
          options={meta.options}
          onPick={resolve}
          disabled={disabled || !animDone || resolved}
          tokens={scene?.tokens}
        />
      )}
    </div>
  )
}

function makeMeta(operandA: number, operandB: number, score: number, op: string): NumberLineMeta {
  const tier = pickTier(TIERS, score)
  const answer = op === '-' ? operandA - operandB : operandA + operandB
  return {
    options: makeNumeralOptions(answer, numeralRangeMax(Math.max(operandA, answer)), 0),
    tierId: tier.id,
  }
}

const NumberLine: ExerciseDefinition<NumberLineMeta> = {
  id: 'numberline-jump',
  label: 'Spring op de getallenlijn',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Model +1/+2 as forward jumps on the number line — counting on given spatial structure; the buurgetal relation made visible.',
    pitfalls: ['Off-by-one from counting the start cell as the first jump', 'Tapping the start instead of the landing', 'Reading cell labels instead of using the structure (probed by the sparse tier)'],
    progression: 'sprong-zien: the sum builds, the line appears, and the jump animates from the first operand to the landing the child reads. sprong-zelf: the child makes the jump by tapping the landing. kale-sprong: same, on a line with only the ends labelled — the structure has to carry it. Watching → doing → doing without labels.',
  },
  generateMeta(operandA, operandB, score, problem) {
    return makeMeta(operandA, operandB, score, problem?.op ?? '+')
  },
  Component: NumberLineComponent,
}

registerExercise(NumberLine)

// The backward twin — same component, direction follows question.op. A
// separate id so the − skills weight it independently and the answer stream
// distinguishes forward from backward jumping (backward counting is the
// documented weak spot).
const NumberLineBack: ExerciseDefinition<NumberLineMeta> = {
  id: 'numberline-jump-back',
  label: 'Spring terug op de getallenlijn',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Model −1/−2 as backward jumps on the number line — counting back given spatial structure. Doubles as backward-counting practice, which is genuinely weaker than forward and needs its own airtime.',
    pitfalls: ['Off-by-one from counting the start cell as the first backward step', 'Jumping forward out of habit', 'Tapping the start instead of the landing'],
    progression: 'Same ladder as the forward twin: watch the backward jump → tap the landing yourself → sparse labels.',
  },
  generateMeta(operandA, operandB, score, problem) {
    return makeMeta(operandA, operandB, score, problem?.op ?? '-')
  },
  Component: NumberLineComponent,
}

registerExercise(NumberLineBack)
