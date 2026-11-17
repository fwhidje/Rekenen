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
// then only the word is asked.

const TIERS: ExerciseTier[] = [
  { id: 'spiegel-zien', minScore: 0,  label: 'spiegel zien',  description: 'A row, a mirror line, and the same row appearing under it. Choice — the options include "one more" and "two more".' },
  { id: 'spiegel-denk', minScore: 30, label: 'zelf spiegelen', description: 'Only the first row is drawn; the mirror row has to be imagined, and appears with the answer. Number strip.' },
  { id: 'woord',        minScore: 60, label: 'het dubbel van', description: 'No picture: "Het dubbel van 4 is ?". The word alone carries the sum.' },
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
  const woord = meta.tierId === 'woord' && !retry
  const useChoice = meta.tierId === 'spiegel-zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // [first row] → [mirror row (zien only)] → [the sum]
  const { step, complete } = useReveal(zien ? [350, 900, 600] : [350, 500], question)
  const mirrorShown = solved || (zien && step >= 2)

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
      <ExerciseTitle tokens={tokens}>Het dubbel van {n}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        {!woord && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
            {row(true)}
            {/* the mirror */}
            <div style={{ alignSelf: 'stretch', height: 0, borderTop: `2px dashed ${ink}66` }} />
            {row(mirrorShown)}
          </div>
        )}
        <Equation x={n} sign="+" y={n} res={answer} hole="res" solved={solved} shown={complete ? 3 : 0} size={40} tokens={tokens} />
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
    progression: 'spiegel-zien: the row and its mirror image appear. spiegel-denk (30): only the first row; the mirror row comes with the answer. woord (60): "het dubbel van 4" and the sum, no picture. A retry shows both rows.',
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
