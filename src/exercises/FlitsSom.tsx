import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
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
import { opGlyph, opColor, equationText } from './opDisplay'

// ─── flits-som ────────────────────────────────────────────────────────────────
// A sum whose picture is on screen too briefly to count. The sum itself stays;
// the picture — two groups in two colours for +, one group with the leavers
// crossed for − — appears, is covered again, and the child answers from what
// was SEEN: two parts of a whole, not a row to count along.
//
// The first step away from counting in the skills that leave counting behind
// (optellen-tot-5, aftrekken-wegnemen-5; skill map → Exercise design for the
// next set). The same picture, standing still, is fill-vis / wegnemen-crossed-
// out — and that is what a retry shows: on a retry the picture stays.
//
// The picture is covered, never removed, and it comes back with the answer:
// the closure is the check.

// How long the picture is visible. THE tuning knob of this exercise: long
// enough to take in two structured groups, too short to count them one by one.
const FLASH_MS = { lang: 2500, kort: 1200 } as const

const TIERS: ExerciseTier[] = [
  { id: 'lang', minScore: 0,  label: 'lang kijken', description: `The picture stays about ${FLASH_MS.lang / 1000} s — time to see both groups, not to count them. Answer by choice (the options include the numbers that are in the sum).` },
  { id: 'kort', minScore: 30, label: 'kort kijken', description: `About ${FLASH_MS.kort / 1000} s — a glance. Answer on the number strip: nothing to pick from.` },
]

interface FlitsSomMeta {
  flashMs: number
  colorA: string
  colorB: string
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

// Dot size by how wide the picture gets: two full 5-rows side by side (6 + 4)
// must still fit a phone screen.
function dotSize(cols: number): { item: number; gap: number } {
  return cols <= 6 ? { item: 30, gap: 6 } : cols <= 8 ? { item: 24, gap: 5 } : { item: 20, gap: 4 }
}

// One group as a 5-row. A group of 0 is drawn as one empty place — "nothing
// here" must be visible as a place where something could have been.
function Group({ n, color, crossed = 0, ink, item: ITEM, gap: GAP }: { n: number; color: string; crossed?: number; ink: string; item: number; gap: number }) {
  if (n === 0) {
    return (
      <FiveRow n={1} item={ITEM} gap={GAP} renderItem={() => (
        <div style={{ width: ITEM - 4, height: ITEM - 4, boxSizing: 'border-box', borderRadius: '50%', border: `2px dashed ${ink}55` }} />
      )} />
    )
  }
  return (
    <FiveRow n={n} item={ITEM} gap={GAP} renderItem={(i) => {
      const isCrossed = i >= n - crossed
      return (
        <div style={{
          position: 'relative', width: ITEM - 4, height: ITEM - 4, borderRadius: '50%', background: color,
          opacity: isCrossed ? 0.4 : 1,
        }}>
          {isCrossed && (
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: Math.round(ITEM * 0.8), lineHeight: 1, color: ink,
            }}>✕</span>
          )}
        </div>
      )
    }} />
  )
}

function FlitsSomComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FlitsSomMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const minus = op === '-'
  const glyph = opGlyph(op)
  const glyphColor = opColor(op, tokens)
  // A retry is the same sum with more help: the picture stays.
  const hold = !!question.isRetry
  const useStrip = meta.tierId === 'kort' && !hold

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // The sum is read first; then the picture comes.
  const { complete } = useReveal([450], question)
  const flash = useFlash(meta.flashMs, question, { start: complete, hold })
  const open = flash.showing || solved
  const canAnswer = flash.seen && (hold || !flash.showing)

  const pick = (v: number) => {
    if (disabled || answered || !canAnswer) return
    setPicked(v)
    resolve(v === answer, { givenAnswer: v, replayCount: flash.replays })
  }

  // The picture's box is sized for the picture; the cover lies over it.
  const cols = minus ? Math.min(operandA, 5) : Math.min(Math.max(operandA, 1), 5) + Math.min(Math.max(operandB, 1), 5)
  const size = dotSize(cols)
  const rowH = fiveRowSize(Math.max(operandA, operandB, 1), size.item, size.gap).height

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      {/* fixed width: the band does not resize when its text changes */}
      <ExerciseTitle tokens={tokens} style={{ minWidth: 180 }}>{canAnswer ? 'Hoeveel is het?' : 'Kijk goed!'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: flash.seen && !flash.showing && !hold && !answered && !disabled, onClick: flash.replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 12 }}>
        {/* The sum — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38, height: 48 }}>
          <span style={{ color: tokens.accentText }}>{operandA}</span>
          <span style={{ color: glyphColor }}>{glyph}</span>
          <span style={{ color: tokens.pop }}>{operandB}</span>
          <span style={{ color: ink, opacity: 0.4, fontSize: 32 }}>=</span>
          <span style={{ color: solved ? tokens.confirm : tokens.accentText, minWidth: 24, textAlign: 'center' }}>{solved ? answer : '?'}</span>
        </div>

        {/* The picture, and the cover that lies over it most of the time */}
        <div style={{ position: 'relative', padding: '10px 14px', minHeight: rowH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {minus ? (
            <Group n={operandA} color={meta.colorA} crossed={operandB} ink={ink} {...size} />
          ) : (
            <>
              <Group n={operandA} color={meta.colorA} ink={ink} {...size} />
              <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 26, color: glyphColor }}>{glyph}</span>
              <Group n={operandB} color={meta.colorB} ink={ink} {...size} />
            </>
          )}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, borderRadius: 12, background: tokens.paperMid,
            border: `2px dashed ${ink}55`, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 26, color: `${ink}55`,
            opacity: open ? 0 : 1, transition: 'opacity .25s', pointerEvents: 'none',
          }}>?</div>
        </div>
      </ExerciseStage>

      {useStrip
        ? <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />
        : <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />}
    </div>
  )
}

const FlitsSom: ExerciseDefinition<FlitsSomMeta> = {
  id: 'flits-som',
  label: 'Vlug kijken: de som',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'See a sum instead of counting it: the picture shows two parts of a whole (or a whole with a part crossed) for too short a time to count, so the answer has to come from the structure that was seen. The perceptual step between the countable pictures of the +1/+2 skills and the bare sum.',
    pitfalls: [
      'Too short → guessing; too long → counted after all. The flash duration is the tuning knob (FLASH_MS).',
      'Answering one of the two groups that were seen instead of the whole (an echo — the choice options offer both).',
      'Looking again every time and counting on the second view. Replays are recorded (replayCount).',
    ],
    progression: 'lang: a long look and four options. kort (30): a glance, and the number strip — nothing to pick from. A retry shows the picture standing still (that is fill-vis / wegnemen-crossed-out). On a correct answer the picture comes back as the check.',
  },
  // Retry: the same picture (same colours), now standing still.
  retryStable: ['colorA', 'colorB'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const minus = problem?.op === '-'
    const correct = minus ? operandA - operandB : operandA + operandB
    const max = numeralRangeMax(minus ? operandA : correct) as 5 | 10
    // 0 is a possible answer for −, and an option worth offering when a term is 0.
    const min = minus || operandA === 0 || operandB === 0 ? 0 : 1
    const [colorA, colorB] = ctx?.retryOf ? [ctx.retryOf.colorA, ctx.retryOf.colorB] : pickColors()
    return {
      flashMs: FLASH_MS[tier.id as keyof typeof FLASH_MS] ?? FLASH_MS.lang,
      colorA, colorB,
      options: makeSumOptions(correct, [operandA, operandB], max, min),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: FlitsSomComponent,
}

registerExercise(FlitsSom)
