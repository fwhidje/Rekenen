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
// The picture carries less and less: both parts in view, then the asked part
// fades away while the child looks (it comes back with the answer), then the
// whole picture only for a moment.
//
// Colour rule (CLAUDE.md): a number has the colour of its quantity — the given
// part and its dots share one colour, the asked part ("?") and its dots the
// other; the whole is ink.

const FLASH_MS = 1500
// vervaag: how long the asked part stays before it fades, and the fade itself
const FADE_AFTER_MS = 1300

const TIERS: ExerciseTier[] = [
  { id: 'zien',   minScore: 0,  label: 'beide delen', description: 'The whole in two colours; the child names the second colour\'s part. Choice.' },
  { id: 'vervaag', minScore: 25, label: 'deel vervaagt', description: 'The whole in two colours, then the asked part fades away ("7 is 4 en ?"); it comes back with the answer. The part is remembered, not counted. Number strip.' },
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
  const vervaag = tier === 'vervaag' && !retry
  const flits = tier === 'flits' && !retry
  const useChoice = tier === 'zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const { step, complete } = useReveal([350, 450], question)
  // flits covers the whole picture after a moment; vervaag fades the asked part
  const flash = useFlash(vervaag ? FADE_AFTER_MS : FLASH_MS, question, { start: (flits || vervaag) && complete })
  const canAnswer = complete && (!(flits || vervaag) || (flash.seen && !flash.showing))
  // the asked part is drawn unless it has faded (vervaag); it returns when solved
  const askedShown = solved || !vervaag || !complete || flash.showing
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

      <ExerciseStage tokens={tokens} replay={{ show: (flits || vervaag) && flash.seen && !flash.showing && !answered && !disabled, onClick: flash.replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        <div style={{ position: 'relative', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
          {/* the whole, laid out for all its places from the start */}
          <FiveRow n={t} item={ITEM} gap={GAP} style={{ width: box.width, height: box.height }} renderItem={(i) => (
            <div style={{
              width: ITEM - 4, height: ITEM - 4, borderRadius: '50%',
              background: i < g ? meta.colorA : meta.colorB,
              opacity: i < g || askedShown ? 1 : 0, transition: vervaag ? 'opacity .9s' : 'opacity .35s',
            }} />
          )} />
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
          <span>{t}</span>
          <span style={{ fontSize: 26, opacity: 0.6 }}>is</span>
          <span style={{ color: meta.colorA, WebkitTextStroke: `1px ${ink}` }}>{g}</span>
          <span style={{ fontSize: 26, opacity: 0.6 }}>en</span>
          <span style={{ color: solved ? tokens.confirm : meta.colorB, WebkitTextStroke: solved ? undefined : `1px ${ink}` }}>{solved ? m : '?'}</span>
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
    progression: 'zien: both parts in view. vervaag (25): the asked part fades away while the child looks and comes back with the answer — it has to be held in mind, not counted. flits (50): the two-colour picture for a moment only. A retry shows the whole picture, standing still.',
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
