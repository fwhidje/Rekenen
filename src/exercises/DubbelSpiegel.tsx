import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { FiveRow } from '../presentation/components/FiveRow'
import { Equation } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { equationText } from './opDisplay'

// ─── dubbel-spiegel ───────────────────────────────────────────────────────────
// A dubbel is "twice the same": one row, and the same row again as in a mirror.
// The picture gives the idea and the word ("het dubbel van 3"); the sum under
// it (3 + 3) is the fact to keep. Then the mirror row is left to the child,
// then only the word is asked, then only the question in words (no sum — a
// sanctioned exception to "the equation is always visible", like rekenverhaal's
// top tier: the point is that the word alone is enough).
//
// Reveal (spiegel-zien, spiegel-denk) follows fill-vis: each number appears
// together with its picture — the first row with the first n, the mirror row
// with "+ n" — and then "= ?".

const TIERS: ExerciseTier[] = [
  { id: 'spiegel-zien', minScore: 0,  label: 'spiegel zien',  description: 'A row, a mirror line, and the same row appearing under it. Choice — the options include "one more" and "two more".' },
  { id: 'spiegel-denk', minScore: 30, label: 'zelf spiegelen', description: 'Only the first row is drawn; the mirror row has to be imagined, and appears with the answer. Number strip.' },
  { id: 'woord',        minScore: 50, label: 'het dubbel van', description: 'No picture: "Het dubbel van 4" over the sum 4 + 4 = ?. The word and the sum, shown at once.' },
  { id: 'vraag',        minScore: 75, label: 'enkel de vraag', description: 'Only the question "Wat is het dubbel van 4?" — no picture and no sum; the sum appears with the answer. Sanctioned exception to the visible equation.' },
]

interface DubbelSpiegelMeta {
  color: string
  options: number[]
  tierId: string
}

const ITEM = 28
const GAP = 6

function DubbelSpiegelComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<DubbelSpiegelMeta>) {
  const { operandA: n, answer, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const retry = !!question.isRetry
  const zien = meta.tierId === 'spiegel-zien' || retry
  const woord = (meta.tierId === 'woord' || meta.tierId === 'vraag') && !retry
  // top tier: the question in words only; the sum comes with the answer
  const vraag = meta.tierId === 'vraag' && !retry
  const useChoice = meta.tierId === 'spiegel-zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // As fill-vis: [first row + n] → [mirror (row at zien) + "+ n"] → ["= ?"].
  // Without a picture the sum is there at once.
  const { step, complete } = useReveal(woord ? [] : zien ? [350, 800, 650] : [350, 650, 600], question)
  const mirrorShown = solved || (zien && step >= 2)
  const eqShown = woord ? 3 : Math.min(step, 3)

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    setPicked(v)
    resolve(v === answer, { givenAnswer: v })
  }

  const row = (shown: boolean) => (
    <FiveRow n={n} item={ITEM} gap={GAP} renderItem={() => (
      <div style={{ width: ITEM - 4, height: ITEM - 4, borderRadius: '50%', background: meta.color, opacity: shown ? 1 : 0, transition: 'opacity .45s' }} />
    )} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{vraag ? `Wat is het dubbel van ${n}?` : `Het dubbel van ${n}`}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        {!woord && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            {row(step >= 1)}
            {/* the mirror */}
            <div style={{ alignSelf: 'stretch', height: 0, borderTop: `2px dashed ${ink}66`, opacity: step >= 2 ? 1 : 0, transition: 'opacity .3s' }} />
            {row(mirrorShown)}
          </div>
        )}
        {/* At vraag the sum stays hidden in its place until the answer is in;
            a "?" holds the place meanwhile, so the card is not empty. */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Equation x={n} sign="+" y={n} res={answer} hole="res" solved={solved}
            shown={vraag ? (solved ? 3 : 0) : eqShown} size={40} tokens={tokens} />
          {vraag && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 44, color: `${ink}40`,
              opacity: solved ? 0 : 1, transition: 'opacity .3s', pointerEvents: 'none',
            }}>?</div>
          )}
        </div>
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={10} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const DubbelSpiegel: ExerciseDefinition<DubbelSpiegelMeta> = {
  id: 'dubbel-spiegel',
  label: 'Het dubbel in de spiegel',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Give "het dubbel" a picture and a word: the same row twice, as in a mirror, written as n + n. The five dubbels to 10 are few, symmetric and worth knowing early — they are the anchors of the neighbouring sums (3 + 4 is 3 + 3 and one more).',
    pitfalls: [
      'Dubbel read as "one more" or "two more" (het dubbel van 3 → 4 or 5): the word is not yet "twice".',
      'Counts both rows by ones at spiegel-zien — possible, which is why the mirror row is left out from 30.',
      'Knows 1 + 1 and 2 + 2 and counts the others: the generator serves 3, 4 and 5 more often.',
    ],
    progression: 'spiegel-zien: the row and its mirror image appear, each with its number. spiegel-denk (30): only the first row; the mirror row comes with the answer. woord (50): "het dubbel van 4" and the sum, no picture. vraag (75): "Wat is het dubbel van 4?" alone — the sum appears with the answer. A retry shows both rows.',
  },
  retryStable: ['color'],
  correctStatement: q => equationText('+', q.operandA, q.operandB),
  // only dubbels
  isCompatible: (a, b, problem) => (problem?.op ?? '+') === '+' && a === b && a >= 1 && a <= 5,
  generateMeta(operandA, _b, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    return {
      color: ctx?.retryOf?.color ?? pickColors()[0],
      // "one more", "two more", and the number itself
      options: makeSumOptions(operandA * 2, [operandA + 1, operandA + 2, operandA], 10, 1),
      tierId: tier.id,
    }
  },
  Component: DubbelSpiegelComponent,
}

registerExercise(DubbelSpiegel)
