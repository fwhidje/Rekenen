import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { FiveRow } from '../presentation/components/FiveRow'
import { HandSVG } from '../presentation/components/HandSVG'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useFlash } from '../presentation/useFlash'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── maak-tien ────────────────────────────────────────────────────────────────
// A full ten with some places taken: how many more to make 10? The tienvrienden
// SEEN before they are known — on a tienveld the empty places are the partner,
// on two hands the fingers that are down. The picture does the work first, then
// only for a moment, then only as the check.

const FLASH_MS = 1400

const TIERS: ExerciseTier[] = [
  { id: 'zien',  minScore: 0,  label: 'beeld blijft', description: 'The picture stays: the empty places (or the fingers that are down) are the answer. Choice.' },
  { id: 'flits', minScore: 30, label: 'flits',        description: 'The picture is shown briefly and covered. Number strip.' },
  { id: 'denk',  minScore: 55, label: 'eerst denken', description: 'No picture until the answer is in; then it shows, as confirmation.' },
]

type Variant = 'tienveld' | 'vingers'

interface MaakTienMeta {
  given: 'A' | 'B'
  variant: Variant
  options: number[]
  tierId: string
}

const shown = (q: Pick<ExerciseQuestion<MaakTienMeta>, 'operandA' | 'operandB' | 'meta'>) => {
  const g = q.meta.given === 'A' ? q.operandA : q.operandB
  return { g, m: 10 - g }
}

const CELL = 34

function MaakTienComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<MaakTienMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { g, m } = shown(question)
  const retry = !!question.isRetry
  const flits = meta.tierId === 'flits' && !retry
  const denk = meta.tierId === 'denk' && !retry
  const useChoice = meta.tierId === 'zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const { step, complete } = useReveal([350, 400], question)
  const flash = useFlash(FLASH_MS, question, { start: flits && complete })
  const pictureOpen = solved || (!denk && (!flits || flash.showing))
  const canAnswer = complete && (!flits || (flash.seen && !flash.showing))

  const pick = (v: number) => {
    if (disabled || answered || !canAnswer) return
    setPicked(v)
    resolve(v === m, { givenAnswer: v, replayCount: flash.replays })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Maak 10!</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: flits && flash.seen && !flash.showing && !answered && !disabled, onClick: flash.replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        <div style={{ position: 'relative', padding: 8, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
          {meta.variant === 'vingers' ? (
            <HandSVG n={g} size={176} />
          ) : (
            // the tienveld: two rows of five, filled in reading order
            <FiveRow n={10} item={CELL} gap={0} renderItem={(i) => (
              <div style={{
                width: CELL, height: CELL, boxSizing: 'border-box', border: `1.5px solid ${ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: tokens.paper,
              }}>
                <div style={{
                  width: CELL - 12, height: CELL - 12, borderRadius: '50%',
                  background: i < g ? tokens.refuse : tokens.confirm,
                  opacity: i < g || solved ? 1 : 0, transition: 'opacity .35s',
                }} />
              </div>
            )} />
          )}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, borderRadius: 12, background: tokens.paperMid,
            border: `2px dashed ${ink}55`, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 26, color: `${ink}55`,
            opacity: pictureOpen ? 0 : 1, transition: 'opacity .25s', pointerEvents: 'none',
          }}>?</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 9, fontFamily: 'Fredoka One, cursive', fontSize: 36, lineHeight: 1.3, color: ink,
          opacity: step >= 2 ? 1 : 0, transition: 'opacity .3s',
        }}>
          <span style={{ color: tokens.pop }}>{g}</span>
          <span style={{ fontSize: 26, opacity: 0.6 }}>en</span>
          <span style={{ color: solved ? tokens.confirm : tokens.accentText }}>{solved ? m : '?'}</span>
          <span style={{ fontSize: 26, opacity: 0.6 }}>is</span>
          <span style={{ color: tokens.accentText }}>10</span>
        </div>
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />
        : <NumberStrip max={10} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />}
    </div>
  )
}

const MaakTien: ExerciseDefinition<MaakTienMeta> = {
  id: 'maak-tien',
  label: 'Maak 10',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'See the tienvrienden: on a full ten the places that are still empty are the partner; on two hands, the fingers that are down. The picture that makes the pairs readable before they are known by heart.',
    pitfalls: [
      'Counting the empty places by ones at zien. For 5–9 the empty places are part of one row and can be seen; for 1–4 they are "the rest of this row and a whole row" — which is why 3 → 7 is harder than 7 → 3.',
      'Naming the number that is shown.',
      'Partner one off (7 → 4).',
    ],
    progression: 'zien: the picture stays. flits (30): a glance, then covered. denk (55): no picture until the answer is in — then it fills, as confirmation. Two pictures alternate: the tienveld and the hands. A retry shows the picture standing still.',
  },
  retryStable: ['given', 'variant'],
  correctStatement: q => { const s = shown(q); return splitText(10, s.g, s.m) },
  // only the splits of 10
  isCompatible: (a, b) => a + b === 10 && a > 0 && b > 0,
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const prev = ctx?.retryOf
    const given = prev?.given ?? (Math.random() < 0.5 ? 'A' : 'B')
    const g = given === 'A' ? operandA : operandB
    return {
      given,
      variant: prev?.variant ?? (Math.random() < 0.65 ? 'tienveld' : 'vingers'),
      options: makeSumOptions(10 - g, [g], 10, 1),
      tierId: tier.id,
    }
  },
  Component: MaakTienComponent,
}

registerExercise(MaakTien)
