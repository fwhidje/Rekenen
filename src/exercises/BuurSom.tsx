import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { FiveRow } from '../presentation/components/FiveRow'
import { Equation } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { equationText } from './opDisplay'

// ─── buur-som ─────────────────────────────────────────────────────────────────
// A sum from a neighbour you know: "3 + 3 = 6, dus 3 + 4 = ?".
// The given line is an ANCHOR one step away — a dubbel, a sum that makes 10, a
// sum with or of five, or the +2 sum the child already has — and the asked sum
// is one more or one less. The derived-fact route for optellen, where
// omkeer-som's buur tier is the one for aftrekken.

const TIERS: ExerciseTier[] = [
  { id: 'buur-beeld',     minScore: 0,  label: 'met beeld',      description: 'Two colours on 5-rows show the anchor sum; one more dot arrives (or one is crossed). Choice — the options include the anchor\'s outcome and the step the wrong way.' },
  { id: 'buur-kaal',      minScore: 35, label: 'twee regels',    description: 'The two lines only. Number strip.' },
  { id: 'buur-zonder',    minScore: 65, label: 'zonder uitkomst', description: 'The anchor is named without its outcome ("3 + 3, dus 3 + 4 = ?"): it has to be known, not read.' },
]

interface Anchor { x: number; y: number }

interface BuurSomMeta {
  anchor: Anchor     // the given sum, one step from the asked one
  colorA: string
  colorB: string
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

// How good an anchor a sum is: a dubbel, a sum of 10, a sum of 5, a term of 5,
// or the +1 / +2 sum the child already knows.
function anchorValue(x: number, y: number): number {
  if (x === y) return 5
  if (x + y === 10) return 4
  if (x + y === 5) return 3
  if (x === 5 || y === 5) return 2
  if (y <= 2 || x <= 2) return 1
  return 0
}

// The best neighbour of a + b: one term one more or one less, both terms ≥ 1,
// sum ≤ 10. There is always one (a, b − 1) when b ≥ 2.
function pickAnchor(a: number, b: number): Anchor {
  const candidates: Anchor[] = [{ x: a, y: b - 1 }, { x: a, y: b + 1 }, { x: a - 1, y: b }, { x: a + 1, y: b }]
    .filter(c => c.x >= 1 && c.y >= 1 && c.x + c.y <= 10)
  let best = candidates[0]
  for (const c of candidates) if (anchorValue(c.x, c.y) > anchorValue(best.x, best.y)) best = c
  return best
}

const ITEM = 24
const GAP = 5

function BuurSomComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<BuurSomMeta>) {
  const { operandA: a, operandB: b, answer, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { anchor } = meta
  const anchorSum = anchor.x + anchor.y
  const more = answer > anchorSum            // the asked sum is one more than the anchor
  const retry = !!question.isRetry
  const picture = meta.tierId === 'buur-beeld' || retry
  const withoutOutcome = meta.tierId === 'buur-zonder' && !retry
  const useChoice = meta.tierId === 'buur-beeld'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // [anchor] → ["dus" + the asked sum; the picture gains or loses one]
  const { step, complete } = useReveal([400, 1300], question)
  const second = step >= 2

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    setPicked(v)
    resolve(v === answer, { givenAnswer: v })
  }

  // The picture holds the larger of the two sums; the one dot that differs
  // appears (one more) or is crossed (one less) when the asked sum comes.
  const big = Math.max(anchorSum, answer)
  const firstGroup = Math.max(anchor.x, a)   // colour A: the first term, at its larger size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{more ? 'Eentje meer!' : 'Eentje minder!'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 6 }}>
        {picture && (
          <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s', marginBottom: 6 }}>
            <FiveRow n={big} item={ITEM} gap={GAP} renderItem={(i) => {
              // the dot the two sums differ by: the last of the group whose term differs
              const isExtra = i === (anchor.y !== b ? big - 1 : firstGroup - 1)
              const gone = isExtra && (more ? !second : second)
              return (
                <div style={{
                  position: 'relative', width: ITEM - 4, height: ITEM - 4, borderRadius: '50%',
                  background: i < firstGroup ? meta.colorA : meta.colorB,
                  opacity: gone ? (more ? 0.12 : 0.35) : 1, transition: 'opacity .5s',
                  boxShadow: isExtra && second && more ? `0 0 0 3px ${tokens.accent}` : 'none',
                }}>
                  <span style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Fredoka One, cursive', fontSize: 19, lineHeight: 1, color: ink,
                    opacity: gone && !more ? 1 : 0, transition: 'opacity .5s',
                  }}>✕</span>
                </div>
              )
            }} />
          </div>
        )}

        {/* the anchor — with or without its outcome */}
        <Equation x={anchor.x} sign="+" y={anchor.y} res={anchorSum} hole={null}
          shown={step >= 1 ? (withoutOutcome && !solved ? 2 : 3) : 0} size={30} dim={second} tokens={tokens} />
        <div style={{
          fontFamily: 'Patrick Hand, cursive', fontSize: 20, color: ink, lineHeight: 1,
          opacity: second ? 0.7 : 0, transition: 'opacity .3s',
        }}>dus</div>
        <Equation x={a} sign="+" y={b} res={answer} hole="res" solved={solved} shown={second ? 3 : 0} size={38} tokens={tokens} />
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const BuurSom: ExerciseDefinition<BuurSomMeta> = {
  id: 'buur-som',
  label: 'De buursom',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Derive a sum from a neighbour that is known: one more in a term is one more in the sum. The anchors are the facts worth knowing first — dubbels, the sums that make 10, the sums with five — so the exercise also shows what they are good for.',
    pitfalls: [
      'Repeats the anchor\'s outcome (3 + 3 = 6, dus 3 + 4 → 6).',
      'Steps the wrong way (one more in the term, one less in the answer).',
      'buur-zonder: the anchor itself is not known, so there is nothing to derive from — a signal about the anchor (the dubbels), not about this sum.',
    ],
    progression: 'buur-beeld: the anchor as two colours on 5-rows; one dot arrives or is crossed. buur-kaal (35): the two lines. buur-zonder (65): the anchor without its outcome. A retry brings the picture and the outcome back.',
  },
  // Retry: the same anchor, the same picture.
  retryStable: ['anchor', 'colorA', 'colorB'],
  correctStatement: q => equationText('+', q.operandA, q.operandB),
  // optellen only; both terms at least 1 and something to step from. Not for a
  // dubbel: that is an anchor itself, not something to derive.
  isCompatible: (a, b, problem) => (problem?.op ?? '+') === '+' && a >= 1 && b >= 1 && a + b >= 3 && a !== b,
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const prev = ctx?.retryOf
    const anchor = prev?.anchor ?? pickAnchor(operandA, operandB)
    const sum = operandA + operandB
    const anchorSum = anchor.x + anchor.y
    const max = numeralRangeMax(Math.max(sum, anchorSum)) as 5 | 10
    const [colorA, colorB] = prev ? [prev.colorA, prev.colorB] : pickColors()
    return {
      anchor, colorA, colorB,
      // the anchor's outcome, and the step taken the wrong way
      options: makeSumOptions(sum, [anchorSum, anchorSum - (sum - anchorSum)], max, 1),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: BuurSomComponent,
}

registerExercise(BuurSom)
