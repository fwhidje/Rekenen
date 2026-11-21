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
import { BeadRod } from '../presentation/components/BeadRod'

// ─── splits-buren ─────────────────────────────────────────────────────────────
// A split that is given, and its neighbour to complete:
//   "7 is 5 en 2"  →  "7 is 4 en ?"
// One part goes down, so the other goes up. This is the pattern behind the
// table of splits, and — more important — a way to FIND a split that is not
// known yet from one that is, without counting: the derived-fact route.
//
// The picture is a bead rod: one row of beads on a rod, a gap between the two
// parts. Beads left of the gap have the first part's colour, beads right of it
// the second's; when the gap moves, the bead that crosses it changes colour.
// The numbers of the statements carry the same two colours (colour rule).
//
// Tiers, concrete → abstract:
//   schuif-zien  0   the gap moves one bead; choice
//   twee-regels  35  the two statements only; number strip
//   rij          55  three rows of the table in order, the first complete
//                    ("7 is 5 en 2 / 7 is 4 en ? / 7 is 3 en ?"): two steps,
//                    one at a time — the bridge to two steps at once
//   sprong       70  two steps at once, with the bead rod (the gap moves twice)
//   sprong-kaal  90  two steps at once, statements only

const TIERS: ExerciseTier[] = [
  { id: 'schuif-zien', minScore: 0,  label: 'kraal schuift', description: 'A bead rod, the two parts in two colours; the gap moves one bead and that bead changes colour. The given split stays on screen, greyed. Choice — the options include "both parts moved the same way".' },
  { id: 'twee-regels', minScore: 35, label: 'twee regels',   description: 'The two statements only. Number strip.' },
  { id: 'rij',         minScore: 55, label: 'rij',           description: 'Three rows of the table in order, the first complete ("7 is 5 en 2 / 7 is 4 en ? / 7 is 3 en ?"); the child fills the middle row, then the last. Number strip.' },
  { id: 'sprong',      minScore: 70, label: 'twee stappen',  description: 'The asked split is two steps away ("7 is 5 en 2 — 7 is 3 en ?"); the bead rod shows the gap moving twice. Number strip.' },
  { id: 'sprong-kaal', minScore: 90, label: 'twee stappen kaal', description: 'Two steps away, the two statements only. Number strip.' },
]

interface SplitsBurenMeta {
  dir: 1 | -1        // the given split's first part is this much above (+) or below (−) the asked one
  step: number       // 1, or 2 (rij, sprong, sprong-kaal)
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

function SplitsBurenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsBurenMeta>) {
  const { operandA: a, operandB: b, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const colA = tokens.refuse, colB = tokens.dot
  const t = a + b
  const unit = meta.dir                       // one step
  const d = unit * meta.step
  const givenA = a + d, givenB = b - d
  const tier = meta.tierId
  const retry = !!question.isRetry
  const rij = tier === 'rij' && !retry && meta.step === 2
  const picture = tier === 'schuif-zien' || tier === 'sprong' || retry
  const useChoice = tier === 'schuif-zien'

  const [picked, setPicked] = useState<number | null>(null)
  // rij: the middle row's answer, once given
  const [middle, setMiddle] = useState<number | null>(null)
  useEffect(() => { setPicked(null); setMiddle(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // [given split] → [the gap moves (once per step)] → [the asked split]
  // rij: [given row] → [middle row] → [last row]
  const delays = rij ? [400, 600, 600] : meta.step === 2 && picture ? [400, 1000, 900] : [400, 1400]
  const { step, complete, replay } = useReveal(delays, question)
  // how many beads the gap has moved so far
  const moved = Math.max(0, Math.min(step - 1, meta.step))
  const asking = step >= delays.length

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    if (rij && middle === null) {
      // first the middle row; a wrong one ends the question
      if (v !== b - unit) { setPicked(v); resolve(false, { givenAnswer: v, tapCount: 1 }); return }
      setMiddle(v)
      setPicked(null)
      return
    }
    setPicked(v)
    resolve(v === b, { givenAnswer: v, tapCount: rij ? 2 : 1 })
  }

  // the gap sits after `cut` beads: it starts at the given split and moves
  const cut = givenA - unit * moved

  // one statement; `open` marks the second part as the asked one
  const line = (x: number, y: number, open: boolean, dim: boolean, shown: boolean, size: number) => (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: Math.round(size * 0.25), fontFamily: 'Fredoka One, cursive', fontSize: size, lineHeight: 1.3,
      color: ink, opacity: !shown ? 0 : dim ? 0.5 : 1, transition: 'opacity .3s',
    }}>
      <span>{t}</span>
      <span style={{ fontSize: Math.round(size * 0.72), opacity: 0.6 }}>is</span>
      <span style={{ color: colA }}>{x}</span>
      <span style={{ fontSize: Math.round(size * 0.72), opacity: 0.6 }}>en</span>
      <span style={{ color: open ? (solved ? tokens.confirm : colB) : colB, minWidth: Math.round(size * 0.6), textAlign: 'center' }}>
        {open ? (solved ? y : '?') : y}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{rij ? 'Maak de rij af' : 'En deze splitsing?'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: complete && !answered && !disabled && middle === null, onClick: replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 6 }}>
        {picture && (
          <div style={{ marginBottom: 6, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
            <BeadRod n={t} cut={cut} colA={colA} colB={colB} tokens={tokens} />
          </div>
        )}
        {rij ? (
          <>
            {line(givenA, givenB, false, false, step >= 1, 30)}
            <div style={{ display: 'flex', alignItems: 'baseline', opacity: step >= 2 ? 1 : 0, transition: 'opacity .3s' }}>
              {/* the middle row: open until the child fills it */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32, lineHeight: 1.3, color: ink,
              }}>
                <span>{t}</span>
                <span style={{ fontSize: 23, opacity: 0.6 }}>is</span>
                <span style={{ color: colA }}>{a + unit}</span>
                <span style={{ fontSize: 23, opacity: 0.6 }}>en</span>
                <span style={{ color: colB, minWidth: 20, textAlign: 'center', borderBottom: middle === null ? `3px solid ${tokens.accent}` : '3px solid transparent' }}>{middle ?? '?'}</span>
              </div>
            </div>
            <div style={{ opacity: step >= 3 ? (middle === null ? 0.45 : 1) : 0, transition: 'opacity .3s' }}>
              {line(a, b, true, false, true, 32)}
            </div>
          </>
        ) : (
          <>
            {line(givenA, givenB, false, asking, step >= 1, 28)}
            {line(a, b, true, false, asking, 38)}
          </>
        )}
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
      'At rij, keeps the step of the first row but loses it in the second (7 is 3 en 3) — the middle row is checked first, so the record shows which step went wrong.',
    ],
    progression: 'schuif-zien: on a bead rod the gap moves one bead and that bead changes colour; the given split stays greyed. twee-regels (35): the statements only. rij (55): three rows of the table, the middle and the last to fill — two steps, one at a time. sprong (70): two steps at once, the rod shows the gap moving twice. sprong-kaal (90): two steps, statements only. A retry is one tier down, and always brings the beads back.',
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
    const twoSteps = tier.id === 'rij' || tier.id === 'sprong' || tier.id === 'sprong-kaal'
    const reach = twoSteps ? 2 : 1
    const prev = ctx?.retryOf?.dir
    const prefer = prev ?? (Math.random() < 0.5 ? 1 : -1)
    // a fresh question takes a direction with room for its steps; a retry keeps its own
    const dir: 1 | -1 = prev !== undefined
      ? (fits(prev) ? prev : (prev === 1 ? -1 : 1))
      : fits(prefer * reach) ? prefer : fits(-prefer * reach) ? (prefer === 1 ? -1 : 1) : fits(prefer) ? prefer : (prefer === 1 ? -1 : 1)
    const step = twoSteps && fits(dir * 2) ? 2 : 1
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
