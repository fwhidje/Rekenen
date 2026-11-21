import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { Equation, eqText } from '../presentation/components/Equation'
import type { EqHole, EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'

// ─── numberline-gap ───────────────────────────────────────────────────────────
// Two marks on the number line and the jump between them: how far is it from
// here to there? This is aanvullend optellen made spatial — a difference found
// by going UP from the smaller number — and verschil as a distance.
//
// Two readings of the same picture, by the problem that is served:
//   a family (split)  → aanvullen: "2 + ? = 5", from the part to the whole
//   a − problem       → verschil:  "5 − 2 = ?", the two numbers as two marks
//
// The jump is drawn as ONE bow. Hops would invite counting the marks, and
// counting marks instead of steps is the classic one-too-many.

const TIERS: ExerciseTier[] = [
  { id: 'sprong-zien', minScore: 0,  label: 'sprong zien', description: 'The bow from the one mark to the other is drawn, with small steps under it. Choice.' },
  { id: 'sprong-kaal', minScore: 40, label: 'geen sprong', description: 'The two marks only; the bow appears with the answer. Number strip.' },
  { id: 'kale-lijn',   minScore: 70, label: 'kale lijn',   description: 'Only the ends of the line are labelled: the distance comes from the two numbers in the sum.' },
]

type Variant = 'aanvullen' | 'verschil'

interface NumberlineGapMeta {
  variant: Variant
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

// From where to where, and the sum that says it.
function view(q: Pick<ExerciseQuestion, 'op' | 'operandA' | 'operandB'>) {
  if (q.op === '-') {
    const from = q.operandB, to = q.operandA
    return { from, to, gap: to - from, eq: { x: to, sign: '-' as EqSign, y: from, res: to - from }, hole: 'res' as EqHole }
  }
  const from = q.operandA, to = q.operandA + q.operandB
  return { from, to, gap: q.operandB, eq: { x: from, sign: '+' as EqSign, y: q.operandB, res: to }, hole: 'y' as EqHole }
}

const MAX_CELL = 50
const CELL_GAP = 4
const BOW_H = 46

function NumberlineGapComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberlineGapMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { from, to, gap, eq, hole } = view(question)
  const range = numeralRangeMax(to)
  const cells = range + 1
  const retry = !!question.isRetry
  const drawBow = meta.tierId === 'sprong-zien' || retry
  const sparse = meta.tierId === 'kale-lijn' && !retry
  const useChoice = meta.tierId === 'sprong-zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // [sum] → [line with its two marks] → [bow]
  const { step, complete, replay } = useReveal([350, 500, 600], question)
  const bowShown = (drawBow && step >= 3) || solved

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    setPicked(v)
    resolve(v === gap, { givenAnswer: v })
  }

  // Bow geometry in a 0..cells × BOW_H box (cell centres at i + 0.5).
  const x0 = from + 0.5, x1 = to + 0.5
  const bow = `M ${x0} ${BOW_H} Q ${(x0 + x1) / 2} ${-BOW_H * 0.55} ${x1} ${BOW_H}`
  const hops = Array.from({ length: gap }, (_, i) => `M ${x0 + i} ${BOW_H} Q ${x0 + i + 0.5} ${BOW_H * 0.55} ${x0 + i + 1} ${BOW_H}`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{meta.variant === 'verschil' ? 'Hoe ver uit elkaar?' : 'Hoe groot is de sprong?'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: complete && !answered && !disabled, onClick: replay }} style={{ width: '100%', maxWidth: 380, boxSizing: 'border-box', padding: '14px 16px', gap: 8 }}>
        <Equation {...eq} hole={hole} solved={solved} shown={step >= 1 ? 3 : 0} size={38} tokens={tokens} />

        <div style={{ width: '100%', maxWidth: cells * MAX_CELL + (cells - 1) * CELL_GAP, opacity: step >= 2 ? 1 : 0, transition: 'opacity .4s' }}>
          {/* The jump: one bow, its size in the middle. Space reserved always. */}
          <div style={{ position: 'relative', height: BOW_H + 4 }}>
            <svg viewBox={`0 0 ${cells} ${BOW_H}`} preserveAspectRatio="none" width="100%" height={BOW_H}
              style={{ position: 'absolute', left: 0, bottom: 0, overflow: 'visible', opacity: bowShown ? 1 : 0, transition: 'opacity .4s' }}>
              {drawBow && hops.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={`${ink}55`} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              ))}
              {gap > 0 && <path d={bow} fill="none" stroke={solved ? tokens.confirm : tokens.pop} strokeWidth={3.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
            </svg>
            <div style={{
              position: 'absolute', left: `${(((x0 + x1) / 2) / cells) * 100}%`, top: -2, transform: 'translateX(-50%)',
              background: tokens.paper, border: `2px solid ${solved ? tokens.confirm : tokens.pop}`, borderRadius: 10, padding: '0 8px',
              fontFamily: 'Fredoka One, cursive', fontSize: 18, color: solved ? tokens.confirm : tokens.pop,
              opacity: bowShown ? 1 : 0, transition: 'opacity .4s',
            }}>{solved ? gap : '?'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells}, 1fr)`, gap: CELL_GAP }}>
            {Array.from({ length: cells }, (_, i) => {
              const isFrom = i === from
              const isTo = i === to
              const showLabel = !sparse || i === 0 || i === range
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', boxSizing: 'border-box', borderRadius: range <= 5 ? 10 : 7,
                    background: isFrom ? tokens.dot : isTo ? tokens.pop : tokens.paper,
                    border: isFrom || isTo ? `2.5px solid ${ink}` : `2px solid ${tokens.paperMid}`,
                  }} />
                  <span style={{
                    fontFamily: 'Fredoka One, cursive', fontSize: range <= 5 ? 18 : 13, lineHeight: 1,
                    color: isFrom || isTo ? ink : `${ink}99`, visibility: showLabel ? 'visible' : 'hidden',
                  }}>{i}</span>
                </div>
              )
            })}
          </div>
        </div>
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const NumberlineGap: ExerciseDefinition<NumberlineGapMeta> = {
  id: 'numberline-gap',
  label: 'De sprong op de getallenlijn',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Find a difference by going up from the smaller number (aanvullend optellen), and see a difference as a distance between two numbers. The spatial picture of the puntoefening "2 + ? = 5" and of verschil.',
    pitfalls: [
      'Counts the marks instead of the steps — one too many (the off-by-one this picture is known for).',
      'Answers where the jump lands (the larger number) instead of how big it is.',
      'It invites counting up by ones. That is a legitimate strategy but not the goal, which is why the weight stays modest.',
    ],
    progression: 'sprong-zien: the bow is drawn, small steps under it. sprong-kaal (40): only the two marks; the bow comes with the answer. kale-lijn (70): only the ends are labelled. A retry draws the bow.',
  },
  retryStable: ['variant'],
  correctStatement: q => { const v = view(q); return eqText(v.eq.x, v.eq.sign, v.eq.y, v.eq.res) },
  generateMeta(operandA, operandB, score, problem) {
    const tier = pickTier(TIERS, score)
    const minus = problem?.op === '-'
    const v = view({ op: minus ? '-' : 'split', operandA, operandB })
    const max = numeralRangeMax(v.to) as 5 | 10
    return {
      variant: minus ? 'verschil' : 'aanvullen',
      // where the jump lands, where it starts, and one off
      options: makeSumOptions(v.gap, [v.to, v.from], max, 0),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: NumberlineGapComponent,
}

registerExercise(NumberlineGap)
