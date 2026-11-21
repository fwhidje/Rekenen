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
import type { EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { equationText } from './opDisplay'

// ─── omkeer-som ───────────────────────────────────────────────────────────────
// A finished sum, and under it the sum to complete: "3 + 2 = 5, dus 5 − 3 = ?".
// Optellen and aftrekken as each other's omgekeerde bewerking: a difference is
// found from a sum the child knows, not counted back.
//
// The top tier swaps the given line for a NEIGHBOUR of the asked sum
// ("5 − 2 = 3, dus 5 − 3 = ?"). Children tend to carry "one more gives one
// more" over from + to −, where one more taken away gives one LESS; this tier
// asks exactly that.

const TIERS: ExerciseTier[] = [
  { id: 'omkeer-beeld', minScore: 0,  label: 'met beeld',  description: 'A two-colour row above the two lines: together for the given sum, then one colour is crossed for the asked one. Choice.' },
  { id: 'omkeer-kaal',  minScore: 35, label: 'twee regels', description: 'The two lines only — the reverse has to come from the numbers. Number strip.' },
  { id: 'buur',         minScore: 65, label: 'buursom',    description: 'The given line is a neighbour, not the reverse: "5 − 2 = 3, dus 5 − 3 = ?". Tests whether one more taken away is understood as one less left.' },
]

interface Line { x: number; sign: EqSign; y: number; res: number }

interface OmkeerSomMeta {
  given: Line            // the finished sum
  colorA: string
  colorB: string
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

const ITEM = 28
const GAP = 6

// The asked sum and, per tier, the line that is given with it.
function lines(op: string, a: number, b: number, buur: boolean): { asked: Line; given: Line } {
  if (op === '-') {
    const rest = a - b
    const asked: Line = { x: a, sign: '-', y: b, res: rest }
    if (buur) {
      // the neighbouring − sum: one less taken away (or one more, when b is 1)
      const nb = b >= 2 ? b - 1 : b + 1
      if (nb >= 1 && nb <= a) return { asked, given: { x: a, sign: '-', y: nb, res: a - nb } }
    }
    return { asked, given: { x: b, sign: '+', y: rest, res: a } }
  }
  const sum = a + b
  const asked: Line = { x: a, sign: '+', y: b, res: sum }
  if (buur && b >= 2) return { asked, given: { x: a, sign: '+', y: b - 1, res: sum - 1 } }
  return { asked, given: { x: sum, sign: '-', y: b, res: a } }
}

function OmkeerSomComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<OmkeerSomMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const minus = op === '-'
  const asked: Line = { x: operandA, sign: minus ? '-' : '+', y: operandB, res: answer }
  const { given } = meta
  const picture = meta.tierId === 'omkeer-beeld' || !!question.isRetry
  const useChoice = meta.tierId === 'omkeer-beeld'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // [given sum] → ["dus" + asked sum, the picture changes with it]
  const { step, complete, replay } = useReveal([400, 1300], question)
  const second = step >= 2

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    setPicked(v)
    resolve(v === answer, { givenAnswer: v })
  }

  // The picture: the whole in two colours. For the given + line both groups
  // stand; for the asked − line the part that leaves is crossed (and the other
  // way round when a + sum is asked: the crossed part comes back).
  const whole = minus ? operandA : operandA + operandB
  const partFirst = minus ? operandB : operandA          // drawn first, colour A
  const crossedNow = minus ? second : !second
  const crossFrom = minus ? 0 : operandA                  // which dots get crossed
  const crossN = operandB

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Keer de som om!</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: complete && !answered && !disabled, onClick: replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 6 }}>
        {picture && (
          <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s', marginBottom: 6 }}>
            <FiveRow n={whole} item={ITEM} gap={GAP} renderItem={(i) => {
              const crossed = crossedNow && i >= crossFrom && i < crossFrom + crossN
              return (
                <div style={{
                  position: 'relative', width: ITEM - 4, height: ITEM - 4, borderRadius: '50%',
                  background: i < partFirst ? meta.colorA : meta.colorB,
                  opacity: crossed ? 0.35 : 1, transition: 'opacity .5s',
                }}>
                  <span style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Fredoka One, cursive', fontSize: 22, lineHeight: 1, color: ink,
                    opacity: crossed ? 1 : 0, transition: 'opacity .5s',
                  }}>✕</span>
                </div>
              )
            }} />
          </div>
        )}

        <Equation {...given} hole={null} shown={step >= 1 ? 3 : 0} size={30} dim={second} tokens={tokens} />
        <div style={{
          fontFamily: 'Patrick Hand, cursive', fontSize: 20, color: ink, lineHeight: 1,
          opacity: second ? 0.7 : 0, transition: 'opacity .3s',
        }}>dus</div>
        <Equation {...asked} hole="res" solved={solved} shown={second ? 3 : 0} size={38} tokens={tokens} />
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const OmkeerSom: ExerciseDefinition<OmkeerSomMeta> = {
  id: 'omkeer-som',
  label: 'Keer de som om',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Use one known sum to answer its reverse: optellen and aftrekken as each other\'s omgekeerde bewerking ("3 + 2 = 5, dus 5 − 3 = 2"). The step from knowing the sums to knowing the differences without counting back.',
    pitfalls: [
      'Pattern-matching: the answer is always a number of the given line, so the first two tiers can be done by elimination. The buur tier cannot.',
      'buur: "one more taken away, so one more left" — the + rule carried over to − (answers res + 1 instead of res − 1).',
      'Repeats the result of the given line.',
    ],
    progression: 'omkeer-beeld: a two-colour row shows both lines — together, then one colour crossed. omkeer-kaal (35): the two lines only. buur (65): the given line is the neighbouring sum, so the answer has to be reasoned from it, not read off it. A retry brings the picture back.',
  },
  // Retry: the same picture colours. The given line follows the tier (a retry
  // from buur gives the plain reverse — more help).
  retryStable: ['colorA', 'colorB'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  // Needs two different, non-zero numbers to reverse: no zero term, no a − a.
  isCompatible: (a, b) => a > 0 && b > 0 && a !== b,
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op === '-' ? '-' : '+'
    const { asked, given } = lines(op, operandA, operandB, tier.id === 'buur')
    const whole = op === '-' ? operandA : operandA + operandB
    const max = numeralRangeMax(whole) as 5 | 10
    const [colorA, colorB] = ctx?.retryOf ? [ctx.retryOf.colorA, ctx.retryOf.colorB] : pickColors()
    return {
      given, colorA, colorB,
      // the numbers of the given line are the natural wrong answers
      options: makeSumOptions(asked.res, [given.res, given.x, given.y], max, 0),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: OmkeerSomComponent,
}

registerExercise(OmkeerSom)
