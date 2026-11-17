import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── splits-buren ─────────────────────────────────────────────────────────────
// A split that is given, and its neighbour to complete:
//   "7 is 5 en 2"  →  "7 is 4 en ?"
// One part goes down, so the other goes up. This is the pattern behind the
// table of splits, and — more important — a way to FIND a split that is not
// known yet from one that is, without counting: the derived-fact route.
//
// At the entry a row of beads (coloured per five, like the rekenrek) shows it:
// one bead crosses the gap between the two parts.
//
// Designed, not built: a middle tier with three consecutive rows of the table.

const TIERS: ExerciseTier[] = [
  { id: 'schuif-zien', minScore: 0,  label: 'kraal schuift', description: 'A bead row with a gap between the parts; one bead crosses the gap. The given split stays on screen, greyed. Choice — the options include "both parts moved the same way".' },
  { id: 'twee-regels', minScore: 35, label: 'twee regels',   description: 'The two statements only. Number strip.' },
  { id: 'sprong',      minScore: 70, label: 'twee stappen',  description: 'The asked split is two steps away from the given one ("7 is 5 en 2 — 7 is 3 en ?").' },
]

interface SplitsBurenMeta {
  dir: 1 | -1        // the given split's first part is this much above (+) or below (−) the asked one
  step: number       // 1, or 2 at the top tier
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

const BEAD = 22
const BGAP = 6

function SplitsBurenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsBurenMeta>) {
  const { operandA: a, operandB: b, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const t = a + b
  const d = meta.dir * meta.step
  const givenA = a + d, givenB = b - d
  const picture = meta.tierId === 'schuif-zien' || !!question.isRetry
  const useChoice = meta.tierId === 'schuif-zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // [given split] → [the bead crosses, the asked split]
  const { step, complete } = useReveal([400, 1400], question)
  const second = step >= 2

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    setPicked(v)
    resolve(v === b, { givenAnswer: v })
  }

  // the gap sits after `cut` beads: first the given split, then the asked one
  const cut = second ? a : givenA
  const rowW = t * BEAD + (t - 1) * BGAP

  const line = (x: number, y: number | null, dim: boolean, shown: boolean, size: number) => (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: Math.round(size * 0.25), fontFamily: 'Fredoka One, cursive', fontSize: size, lineHeight: 1.3,
      color: ink, opacity: !shown ? 0 : dim ? 0.5 : 1, transition: 'opacity .3s',
    }}>
      <span style={{ color: tokens.accentText }}>{t}</span>
      <span style={{ fontSize: Math.round(size * 0.72), opacity: 0.6 }}>is</span>
      <span style={{ color: tokens.pop }}>{x}</span>
      <span style={{ fontSize: Math.round(size * 0.72), opacity: 0.6 }}>en</span>
      <span style={{ color: y === null ? (solved ? tokens.confirm : tokens.accentText) : tokens.pop, minWidth: Math.round(size * 0.6), textAlign: 'center' }}>
        {y === null ? (solved ? b : '?') : y}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>En deze splitsing?</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 6 }}>
        {picture && (
          <div style={{ position: 'relative', width: rowW, height: BEAD + 14, marginBottom: 6, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
            {Array.from({ length: t }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', top: 7, left: i * (BEAD + BGAP), width: BEAD, height: BEAD, borderRadius: '50%',
                // coloured per five, like the rekenrek
                background: i < 5 ? tokens.refuse : tokens.dot, boxShadow: '0 2px 3px rgba(0,0,0,.15)',
              }} />
            ))}
            {/* the gap between the two parts: it moves, the beads stay */}
            <div style={{
              position: 'absolute', top: 0, left: cut * (BEAD + BGAP) - BGAP / 2 - 2, width: 4, height: BEAD + 14,
              background: ink, borderRadius: 2, transition: 'left .7s ease',
            }} />
          </div>
        )}
        {line(givenA, givenB, second, step >= 1, 28)}
        {line(a, null, false, second, 38)}
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const SplitsBuren: ExerciseDefinition<SplitsBurenMeta> = {
  id: 'splits-buren',
  label: 'De buursplitsing',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Derive a split from its neighbour: one part down means the other up. Gives the child a way back to a split that is not known yet that is not counting, and shows the order behind the table of splits.',
    pitfalls: [
      'Both parts moved the same way (5 → 4, so 2 → 1): the total is not kept. The informative error — it is among the choice options.',
      'Repeats the second part of the given split.',
    ],
    progression: 'schuif-zien: a bead crosses the gap between the parts; the given split stays greyed. twee-regels (35): the statements only. sprong (70): two steps away. A retry brings the beads back.',
  },
  // Retry: the given split stays on the same side of the asked one.
  retryStable: ['dir'],
  correctStatement: q => splitText(q.operandA + q.operandB, q.operandA, q.operandB),
  // needs a neighbour with two parts of at least 1
  isCompatible: (a, b) => a > 0 && b > 0 && a + b >= 3,
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const fits = (d: number) => operandA + d >= 1 && operandB - d >= 1
    // prefer the direction of the original question (retry), else a random one that fits
    const prefer = ctx?.retryOf?.dir ?? (Math.random() < 0.5 ? 1 : -1)
    const dir: 1 | -1 = fits(prefer) ? prefer : (prefer === 1 ? -1 : 1)
    const step = tier.id === 'sprong' && fits(dir * 2) ? 2 : 1
    const d = dir * step
    const max = numeralRangeMax(operandA + operandB) as 5 | 10
    return {
      dir, step,
      // the given second part, and "moved the same way as the first part"
      options: makeSumOptions(operandB, [operandB - d, operandB - 2 * d, operandA], max, 0),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: SplitsBurenComponent,
}

registerExercise(SplitsBuren)
