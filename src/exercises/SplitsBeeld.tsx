import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { FiveRow, fiveRowSize } from '../presentation/components/FiveRow'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useFlash } from '../presentation/useFlash'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── splits-beeld ─────────────────────────────────────────────────────────────
// A split of 6–10 as a picture in the 5-structure: the whole in two colours on
// 5-rows, so that 8 reads as "five and three" and its split as two coloured
// parts. The recognition entry of the split bands — what the dice exercises
// are for the totals up to 5 (dice stop at 6, and a part of 7 has no die).
//
// The picture carries less and less: both parts in view, then one part covered,
// then the whole picture only for a moment.

const FLASH_MS = 1500

const TIERS: ExerciseTier[] = [
  { id: 'zien',   minScore: 0,  label: 'beide delen', description: 'The whole in two colours; the child names the second colour\'s part. Choice.' },
  { id: 'bedekt', minScore: 25, label: 'één deel bedekt', description: 'Only the given part is drawn; the other is under a cover whose size says nothing. The whole is known as a number. Number strip.' },
  { id: 'flits',  minScore: 50, label: 'flits',       description: 'The two-colour picture is shown briefly, then covered: the split is seen, not counted.' },
]

interface SplitsBeeldMeta {
  given: 'A' | 'B'
  colorA: string
  colorB: string
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

const parts = (q: Pick<ExerciseQuestion<SplitsBeeldMeta>, 'operandA' | 'operandB' | 'meta'>) => {
  const t = q.operandA + q.operandB
  const g = q.meta.given === 'A' ? q.operandA : q.operandB
  return { t, g, m: t - g }
}

const ITEM = 30
const GAP = 6

function SplitsBeeldComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsBeeldMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { t, g, m } = parts(question)
  const retry = !!question.isRetry
  const tier = meta.tierId
  const bedekt = tier === 'bedekt' && !retry
  const flits = tier === 'flits' && !retry
  const useChoice = tier === 'zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const { step, complete } = useReveal([350, 450], question)
  const flash = useFlash(FLASH_MS, question, { start: flits && complete })
  const canAnswer = complete && (!flits || (flash.seen && !flash.showing))
  // which dots are drawn: all of them, unless one part is under the cover
  const allShown = solved || !bedekt
  const covered = flits && !flash.showing && !solved

  const pick = (v: number) => {
    if (disabled || answered || !canAnswer) return
    setPicked(v)
    resolve(v === m, { givenAnswer: v, replayCount: flash.replays })
  }

  const box = fiveRowSize(t, ITEM, GAP)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>En het andere deel?</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: flits && flash.seen && !flash.showing && !answered && !disabled, onClick: flash.replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        <div style={{ position: 'relative', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
          {/* the whole, laid out for all its places from the start */}
          <FiveRow n={t} item={ITEM} gap={GAP} style={{ width: box.width, height: box.height }} renderItem={(i) => (
            <div style={{
              width: ITEM - 4, height: ITEM - 4, borderRadius: '50%',
              background: i < g ? meta.colorA : meta.colorB,
              opacity: i < g || allShown ? 1 : 0, transition: 'opacity .35s',
            }} />
          )} />
          {/* bedekt: a cover of fixed size stands for the hidden part */}
          {tier === 'bedekt' && !retry && (
            <div style={{
              width: 44, height: 44, boxSizing: 'border-box', borderRadius: 10, background: tokens.paperMid,
              border: `2px dashed ${ink}66`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 24, color: `${ink}66`,
              opacity: solved ? 0 : 1, transition: 'opacity .3s',
            }}>?</div>
          )}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, borderRadius: 12, background: tokens.paperMid,
            border: `2px dashed ${ink}55`, boxSizing: 'border-box',
            opacity: covered ? 1 : 0, transition: 'opacity .25s', pointerEvents: 'none',
          }} />
        </div>

        {/* the split statement — always visible */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 9, fontFamily: 'Fredoka One, cursive', fontSize: 36, lineHeight: 1.3, color: ink,
          opacity: step >= 2 ? 1 : 0, transition: 'opacity .3s',
        }}>
          <span style={{ color: tokens.accentText }}>{t}</span>
          <span style={{ fontSize: 26, opacity: 0.6 }}>is</span>
          <span style={{ color: tokens.pop }}>{g}</span>
          <span style={{ fontSize: 26, opacity: 0.6 }}>en</span>
          <span style={{ color: solved ? tokens.confirm : tokens.accentText }}>{solved ? m : '?'}</span>
        </div>
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />}
    </div>
  )
}

const SplitsBeeld: ExerciseDefinition<SplitsBeeldMeta> = {
  id: 'splits-beeld',
  label: 'De splitsing in beeld',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'See the splits of 6–10 through the 5-structure: the whole on 5-rows in two colours, so a part is read as "five and some" or "what is left of the row", not counted by ones. The picture entry of the split bands.',
    pitfalls: [
      'Counting the second colour by ones at zien — possible, and why the tier is short.',
      'Naming the whole or the given part (both are among the choice options).',
      'One off, from an unsure picture of the total next door.',
    ],
    progression: 'zien: both parts in view. bedekt (25): one part under a cover of fixed size — the whole is a number now, the answer comes from knowing. flits (50): the two-colour picture for a moment only. A retry shows the whole picture, standing still.',
  },
  retryStable: ['given', 'colorA', 'colorB'],
  correctStatement: q => { const p = parts(q); return splitText(p.t, p.g, p.m) },
  isCompatible: (a, b) => a > 0 && b > 0,
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const prev = ctx?.retryOf
    const given = prev?.given ?? (Math.random() < 0.5 ? 'A' : 'B')
    const t = operandA + operandB
    const g = given === 'A' ? operandA : operandB
    const max = numeralRangeMax(t) as 5 | 10
    const [colorA, colorB] = prev ? [prev.colorA, prev.colorB] : pickColors()
    return {
      given, colorA, colorB,
      options: makeSumOptions(t - g, [t, g], max, 1),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: SplitsBeeldComponent,
}

registerExercise(SplitsBeeld)
