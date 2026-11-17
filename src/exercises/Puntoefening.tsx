import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { FiveRow } from '../presentation/components/FiveRow'
import { Equation, eqText } from '../presentation/components/Equation'
import type { EqHole, EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage, Reserve } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useFlash } from '../presentation/useFlash'
import { useClosure } from '../presentation/useClosure'

// ─── puntoefening ─────────────────────────────────────────────────────────────
// The sum whose unknown is not at the end: "2 + ? = 5" (in a workbook: 2 + . = 5).
// It is the missing part of a split, written as a sum — and the first place
// where "= means: now comes the answer" goes wrong: the child who reads it that
// way adds the two numbers on screen and answers 7.
//
// The entry gives the aanvullen picture: the whole as places to fill, the given
// part filled, the rest open. Then the picture flashes, then it is gone; then
// the open place moves ("? + 2 = 5", "5 − ? = 3").

const FLASH_MS = 1600

const TIERS: ExerciseTier[] = [
  { id: 'doel-beeld', minScore: 0,  label: 'doel in beeld', description: 'The whole is drawn as places: the given part filled, the rest open. Choice — the options include the sum of the two numbers shown and the whole.' },
  { id: 'doel-flits', minScore: 25, label: 'beeld flitst',  description: 'The same picture, shown briefly and covered. Number strip.' },
  { id: 'kaal',       minScore: 45, label: 'kaal',          description: 'The bare puntoefening "2 + ? = 5".' },
  { id: 'voor',       minScore: 65, label: 'vooraan',       description: 'The open place comes first: "? + 2 = 5".' },
  { id: 'min',        minScore: 80, label: 'in een minsom', description: 'The open place inside a − sum: "5 − ? = 3".' },
]

interface PuntoefeningMeta {
  given: 'A' | 'B'     // which part of the family is shown
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

// The statement for this tier: its numbers and which place is open.
function statement(q: Pick<ExerciseQuestion<PuntoefeningMeta>, 'operandA' | 'operandB' | 'meta'>) {
  const total = q.operandA + q.operandB
  const g = q.meta.given === 'A' ? q.operandA : q.operandB
  const m = total - g
  switch (q.meta.tierId) {
    case 'voor': return { g, m, total, eq: { x: m, sign: '+' as EqSign, y: g, res: total }, hole: 'x' as EqHole }
    case 'min':  return { g, m, total, eq: { x: total, sign: '-' as EqSign, y: m, res: g }, hole: 'y' as EqHole }
    default:     return { g, m, total, eq: { x: g, sign: '+' as EqSign, y: m, res: total }, hole: 'y' as EqHole }
  }
}

const ITEM = 28
const GAP = 6

function PuntoefeningComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<PuntoefeningMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { g, m, total, eq, hole } = statement(question)
  const retry = !!question.isRetry
  const tier = meta.tierId
  const hasPicture = tier === 'doel-beeld' || tier === 'doel-flits' || retry
  const flits = tier === 'doel-flits' && !retry
  const useChoice = tier === 'doel-beeld'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const { step, complete } = useReveal([350, 500], question)
  const flash = useFlash(FLASH_MS, question, { start: flits && complete })
  const pictureOpen = solved || !flits || flash.showing
  const canAnswer = complete && (!flits || (flash.seen && !flash.showing))

  const pick = (v: number) => {
    if (disabled || answered || !canAnswer) return
    setPicked(v)
    resolve(v === m, { givenAnswer: v, replayCount: flash.replays })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Welk getal ontbreekt?</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        {hasPicture && (
          <div style={{ position: 'relative', padding: '8px 12px', opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
            {/* the whole as places: the given part is there, the rest is still to come */}
            <FiveRow n={total} item={ITEM} gap={GAP} renderItem={(i) => {
              const filled = i < g || solved
              return (
                <div style={{
                  width: ITEM - 4, height: ITEM - 4, boxSizing: 'border-box', borderRadius: '50%',
                  background: filled ? (i < g ? tokens.dot : tokens.confirm) : 'transparent',
                  border: filled ? 'none' : `2px dashed ${ink}77`, transition: 'background .3s',
                }} />
              )
            }} />
            <div aria-hidden style={{
              position: 'absolute', inset: 0, borderRadius: 12, background: tokens.paperMid,
              border: `2px dashed ${ink}55`, boxSizing: 'border-box',
              opacity: pictureOpen ? 0 : 1, transition: 'opacity .25s', pointerEvents: 'none',
            }} />
          </div>
        )}

        <Equation {...eq} hole={hole} solved={solved} shown={step >= 2 ? 3 : 0} size={40} tokens={tokens} />

        {flits && (
          <Reserve show={flash.seen && !flash.showing && !answered}>
            <button onClick={() => { if (!disabled && !answered) flash.replay() }}
              style={{
                padding: '6px 18px', fontFamily: 'Patrick Hand, cursive', fontSize: 17,
                background: tokens.paper, color: ink, border: `2px solid ${ink}`, borderRadius: 14,
                cursor: 'pointer', userSelect: 'none',
              }}>↻ Nog eens kijken</button>
          </Reserve>
        )}
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />}
    </div>
  )
}

const Puntoefening: ExerciseDefinition<PuntoefeningMeta> = {
  id: 'puntoefening',
  label: 'Puntoefening',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Solve a sum whose unknown is not at the end — "2 + ? = 5" — from the split the child already knows, and read = as "is evenveel als" instead of "now comes the answer". The written form of aanvullen tot.',
    pitfalls: [
      'Adds the two numbers on screen (2 + ? = 5 → 7): the + is there, and = is read as the signal to work out what stands before it.',
      'Answers the whole (5): counts up to it and reports where the count ended.',
      'At doel-beeld the open places can be counted — intended at the entry, gone from 25.',
    ],
    progression: 'doel-beeld: the whole drawn as places, the given part filled. doel-flits (25): that picture, briefly. kaal (45): the bare puntoefening. voor (65): the open place first. min (80): the open place inside a − sum. A retry brings the picture back, standing still.',
  },
  // Retry: the same part stays given — otherwise it is another question.
  retryStable: ['given'],
  correctStatement: q => { const s = statement(q); return eqText(s.eq.x, s.eq.sign, s.eq.y, s.eq.res) },
  // A puntoefening with a 0 in it has no picture and no point.
  isCompatible: (a, b) => a > 0 && b > 0,
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const given = ctx?.retryOf?.given ?? (Math.random() < 0.5 ? 'A' : 'B')
    const total = operandA + operandB
    const g = given === 'A' ? operandA : operandB
    const max = numeralRangeMax(total) as 5 | 10
    return {
      given,
      // the sum of the two numbers shown, the whole, the given part
      options: makeSumOptions(total - g, [total, g, total + g], max, 0),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: PuntoefeningComponent,
}

registerExercise(Puntoefening)
