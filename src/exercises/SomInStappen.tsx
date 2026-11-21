import { useEffect, useRef, useState } from 'react'
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
import type { EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { equationText } from './opDisplay'

// ─── som-in-stappen ───────────────────────────────────────────────────────────
// A sum done in two steps through the five: "4 + 3" — the 3 is split into 1
// and 2, then 4 + 1 = 5 and 5 + 2 = 7. For −: "7 − 3" — 7 − 2 = 5, 5 − 1 = 4.
// A derived fact made explicit, and written the way a derivation is written:
// as a sum of three terms (4 + 1 + 2).
//
// It is the brug procedure — first term kept, second term split — one size
// down: the same steps over 10 are the bridge of the tot-20 range.
//
// Only for sums that cross the five (the start is below 5 and the result above
// it, or the other way round for −).

const TIERS: ExerciseTier[] = [
  { id: 'stappen-zien',  minScore: 0,  label: 'stappen zien',  description: 'The 5-structure picture, the second term split under the sum, the first step written out ("4 + 1 = 5"); the child answers the second step. Choice.' },
  { id: 'eerst-vijf',    minScore: 35, label: 'eerst tot vijf', description: 'No picture. The child does both steps: first how many to (or back to) five, then the rest. Number strip, two taps.' },
  { id: 'drie-termen',   minScore: 65, label: 'drie termen',   description: 'The derivation as one written sum of three terms: "4 + 1 + 2 = ?".' },
]

interface SomInStappenMeta {
  colorA: string
  colorB: string
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

// start ± first = 5, 5 ± second = answer; first + second = the second term.
function steps(op: string, a: number, b: number) {
  const sign: EqSign = op === '-' ? '-' : '+'
  const first = sign === '+' ? 5 - a : a - 5
  const second = b - first
  const answer = sign === '+' ? a + b : a - b
  return { sign, first, second, answer }
}

// Crosses the five with both steps at least 1.
const crosses = (op: string, a: number, b: number) =>
  op === '-' ? a > 5 && a - b < 5 && a - b >= 0 : a < 5 && a >= 1 && a + b > 5 && a + b <= 10

const ITEM = 26
const GAP = 5
const BETWEEN_MS = 650

function SomInStappenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SomInStappenMeta>) {
  const { operandA: a, operandB: b, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { sign, first, second, answer } = steps(op, a, b)
  const retry = !!question.isRetry
  const zien = meta.tierId === 'stappen-zien' || retry
  const drie = meta.tierId === 'drie-termen' && !retry
  const zelf = meta.tierId === 'eerst-vijf' && !retry

  // eerst-vijf: phase 0 asks the first step, phase 1 the second
  const [phase, setPhase] = useState<0 | 1>(0)
  const [picked, setPicked] = useState<number | null>(null)
  const between = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setPhase(0); setPicked(null)
    return () => { if (between.current) clearTimeout(between.current) }
  }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // [sum] → [the split of the second term] → [step 1] → [step 2]
  const { step, complete, replay } = useReveal(zien ? [350, 800, 900, 800] : [350, 500], question)
  const firstKnown = zien ? step >= 2 : phase === 1 || solved
  const waiting = zelf && phase === 0 && picked !== null   // first step answered, second not yet shown

  const pick = (v: number) => {
    if (disabled || answered || !complete || waiting) return
    setPicked(v)
    if (zelf && phase === 0) {
      if (v !== first) { resolve(false, { givenAnswer: v, tapCount: 1 }); return }
      between.current = setTimeout(() => { setPhase(1); setPicked(null) }, BETWEEN_MS)
      return
    }
    resolve(v === answer, { givenAnswer: v, tapCount: zelf ? 2 : 1 })
  }

  const leg = (n: number, known: boolean, color: string) => (
    <span style={{
      width: 34, height: 34, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 9, border: `2px solid ${known ? color : tokens.paperMid}`, color: known ? color : `${ink}55`,
      fontFamily: 'Fredoka One, cursive', fontSize: 22, background: tokens.paper, transition: 'border-color .25s, color .25s',
    }}>{known ? n : '?'}</span>
  )

  // the picture: the start group, then the first step fills the row to five,
  // the second step goes on the next row (for −: the two steps are crossed)
  const picture = () => {
    const total = sign === '+' ? a + b : a
    return (
      <FiveRow n={total} item={ITEM} gap={GAP} renderItem={(i) => {
        const isFirst = sign === '+' ? i >= a && i < 5 : i >= 5
        const isSecond = sign === '+' ? i >= 5 : i >= a - b && i < 5
        const shown = sign === '+' ? (i < a || (isFirst && step >= 3) || (isSecond && (step >= 4 || solved))) : true
        const crossed = sign === '-' && ((isFirst && step >= 3) || (isSecond && solved))
        return (
          <div style={{
            position: 'relative', width: ITEM - 4, height: ITEM - 4, borderRadius: '50%',
            background: i < (sign === '+' ? a : a - b) ? meta.colorA : meta.colorB,
            opacity: !shown ? 0.12 : crossed ? 0.35 : 1, transition: 'opacity .4s',
          }}>
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 20, lineHeight: 1, color: ink,
              opacity: crossed ? 1 : 0, transition: 'opacity .4s',
            }}>✕</span>
          </div>
        )
      }} />
    )
  }

  const glyph = sign === '-' ? '−' : '+'
  const signColor = sign === '-' ? tokens.refuse : tokens.confirm

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{drie ? 'Hoeveel is het?' : 'Eerst naar 5!'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: !waiting && complete && !answered && !disabled, onClick: replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '12px 20px', gap: 6 }}>
        {zien && <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s', marginBottom: 4 }}>{picture()}</div>}

        {drie ? (
          // the derivation as one sum of three terms
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 52, fontFamily: 'Fredoka One, cursive', fontSize: 38, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
            <span style={{ color: tokens.accentText }}>{a}</span>
            <span style={{ color: signColor }}>{glyph}</span>
            <span style={{ color: tokens.pop }}>{first}</span>
            <span style={{ color: signColor }}>{glyph}</span>
            <span style={{ color: tokens.pop }}>{second}</span>
            <span style={{ color: ink, opacity: 0.4, fontSize: 32 }}>=</span>
            <span style={{ color: solved ? tokens.confirm : tokens.accentText }}>{solved ? answer : '?'}</span>
          </div>
        ) : (
          <>
            <Equation x={a} sign={sign} y={b} res={answer} hole="res" solved={solved} shown={step >= 1 ? 3 : 0} size={36} tokens={tokens} />
            {/* the second term, split into the two steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, opacity: step >= 2 ? 1 : 0, transition: 'opacity .3s' }}>
              <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 24, color: tokens.pop }}>{b}</span>
              <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: 18, color: ink, opacity: 0.7 }}>is</span>
              {leg(first, firstKnown, tokens.pop)}
              <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: 18, color: ink, opacity: 0.7 }}>en</span>
              {leg(second, firstKnown, tokens.pop)}
            </div>
            {/* step 1: to five. step 2: the rest. */}
            <Equation x={a} sign={sign} y={first} res={5} hole={zelf ? 'y' : null} solved={firstKnown}
              shown={zien ? (step >= 3 ? 3 : 0) : (complete ? 3 : 0)} size={28} dim={zien ? step >= 4 : phase === 1} tokens={tokens} />
            <Equation x={5} sign={sign} y={second} res={answer} hole="res" solved={solved}
              shown={zien ? (step >= 4 ? 3 : 0) : (phase === 1 || solved ? 3 : 0)} size={28} tokens={tokens} />
          </>
        )}
      </ExerciseStage>

      {zien
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved || waiting} disabled={disabled || answered || !complete || waiting} tokens={scene?.tokens} />}
    </div>
  )
}

const SomInStappen: ExerciseDefinition<SomInStappenMeta> = {
  id: 'som-in-stappen',
  label: 'De som in twee stappen',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Work out a sum that crosses the five in two known steps instead of counting: fill up to five, then add the rest (and for −: back to five, then the rest). The derivation is written as a sum of three terms. Rehearses, one size down, the procedure of the brug over 10.',
    pitfalls: [
      'Splits the second term wrongly: the first step does not land on five (4 + 3 as 4 + 2 + 1).',
      'Does the first step and stops — answers 5.',
      'At drie-termen: adds only two of the three terms.',
    ],
    progression: 'stappen-zien: the picture in the 5-structure, the split of the second term and the first step are given; the child does the second step. eerst-vijf (35): no picture, both steps are the child\'s — first "how many to five". drie-termen (65): the bare sum of three terms. A retry is the fully shown version.',
  },
  retryStable: ['colorA', 'colorB'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  // only sums that cross the five
  isCompatible: (a, b, problem) => crosses(problem?.op ?? '+', a, b),
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op === '-' ? '-' : '+'
    const s = steps(op, operandA, operandB)
    const max = numeralRangeMax(Math.max(operandA, s.answer)) as 5 | 10
    const [colorA, colorB] = ctx?.retryOf ? [ctx.retryOf.colorA, ctx.retryOf.colorB] : pickColors()
    return {
      colorA, colorB,
      // stopping at five, and the two steps themselves
      options: makeSumOptions(s.answer, [5, s.second, s.first], max, 0),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: SomInStappenComponent,
}

registerExercise(SomInStappen)
