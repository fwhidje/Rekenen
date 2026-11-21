import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { Equation, eqText } from '../presentation/components/Equation'
import type { EqHole, EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { skillRange } from '../curriculum/skills'

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
//
// Built step by step (playtest, Nov 2026): the bare line, then each number of
// the sum together with its mark (the mark pulses once as it appears), then the
// rest of the sum, then the bow. Colour rule: the smaller number and its mark
// share one colour, the larger number and its mark the other.
//
// At the top tier (kale-lijn) the sum is not shown until the answer is in: the
// two marks are labelled on the line and the question is in words — a
// sanctioned exception to the visible equation, as for rekenverhaal: finding
// that a distance is a − (or a missing part) is the point. The tier below and
// the retry show the sum. A difference of 0 is not served: two marks on one
// cell are no distance.

const TIERS: ExerciseTier[] = [
  { id: 'sprong-zien', minScore: 0,  label: 'sprong zien', description: 'The bow from the one mark to the other is drawn, with small steps under it. Choice.' },
  { id: 'sprong-kaal', minScore: 40, label: 'geen sprong', description: 'The two marks only; the bow appears with the answer. Number strip.' },
  { id: 'kale-lijn',   minScore: 70, label: 'kale lijn',   description: 'No sum: only 0, the end and the two marks are labelled; the question in words. The sum and the bow appear with the answer.' },
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
  const range = skillRange(question.skillId, to)
  const cells = range + 1
  const retry = !!question.isRetry
  const drawBow = meta.tierId === 'sprong-zien' || retry
  const sparse = meta.tierId === 'kale-lijn' && !retry
  // the top tier: no sum until the answer is in
  const bareTop = sparse
  const useChoice = meta.tierId === 'sprong-zien'

  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)
  // [bare line] → [first number + its mark] → [the sign and second number]
  // → ["= …"] → [bow, at sprong-zien]. The larger mark comes with the number
  // that names it: "5" of "5 − 2", or "= 5" of "2 + ? = 5".
  const delays = drawBow ? [300, 650, 700, 650, 550] : [300, 650, 700, 650]
  const { step, complete, replay } = useReveal(delays, question)
  const eqShown = Math.max(0, Math.min(step - 1, 3))
  const minus = eq.sign === '-'
  const fromShown = minus ? eqShown >= 2 : eqShown >= 1
  const toShown = minus ? eqShown >= 1 : eqShown >= 3
  const bowShown = (drawBow && step >= 5) || solved
  const colFrom = tokens.dot, colTo = tokens.pop
  const eqColors = minus ? { x: colTo, y: colFrom } : { x: colFrom, res: colTo }

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
      <style>{`@keyframes nlgap-mark { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }`}</style>
      <ExerciseTitle tokens={tokens}>{meta.variant === 'verschil' ? 'Hoe ver uit elkaar?' : 'Hoe groot is de sprong?'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: complete && !answered && !disabled, onClick: replay }} style={{ width: '100%', maxWidth: 380, boxSizing: 'border-box', padding: '14px 16px', gap: 8 }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Equation {...eq} hole={hole} solved={solved} colors={eqColors}
            shown={bareTop ? (solved ? 3 : 0) : eqShown} size={38} tokens={tokens} />
          {bareTop && (
            <div aria-hidden style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 40, color: `${ink}40`,
              opacity: solved || !complete ? 0 : 1, transition: 'opacity .3s', pointerEvents: 'none',
            }}>?</div>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: cells * MAX_CELL + (cells - 1) * CELL_GAP, opacity: step >= 1 ? 1 : 0, transition: 'opacity .4s' }}>
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
              const isFrom = i === from && fromShown
              const isTo = i === to && toShown
              const marked = i === from || i === to
              const showLabel = !sparse || i === 0 || i === range || marked
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', boxSizing: 'border-box', borderRadius: range <= 5 ? 10 : 7,
                    background: isFrom ? colFrom : isTo ? colTo : tokens.paper,
                    border: isFrom || isTo ? `2.5px solid ${ink}` : `2px solid ${tokens.paperMid}`,
                    transition: 'background .3s, border-color .3s',
                    // a mark pulses once as it appears
                    animation: isFrom || isTo ? 'nlgap-mark .6s ease-out' : 'none',
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
    progression: 'The sum is built with the line: each number appears with its mark. sprong-zien: the bow is drawn, small steps under it. sprong-kaal (40): only the two marks; the bow comes with the answer. kale-lijn (70): no sum — the marks are labelled on the line, the question is in words; the sum comes with the answer. A retry draws the bow and shows the sum.',
  },
  retryStable: ['variant'],
  // a difference of 0 is no distance
  isCompatible: (a, b, problem) => (problem?.op === '-' ? a - b > 0 : b > 0),
  correctStatement: q => { const v = view(q); return eqText(v.eq.x, v.eq.sign, v.eq.y, v.eq.res) },
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const minus = problem?.op === '-'
    const v = view({ op: minus ? '-' : 'split', operandA, operandB })
    const max = skillRange(ctx?.skillId ?? '', v.to)
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
