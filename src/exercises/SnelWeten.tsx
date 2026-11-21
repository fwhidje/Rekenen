import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { numeralRangeMax } from './choiceOptions'
import { NumberStrip } from '../ui/components/NumberStrip'
import { Huisje } from '../presentation/components/Huisje'
import type { HuisjeCell } from '../presentation/components/Huisje'
import { Equation, eqText } from '../presentation/components/Equation'
import type { EqHole, EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── snel-weten ───────────────────────────────────────────────────────────────
// One bare fact, one tap on the number strip. The exercise that tells a KNOWN
// answer from one that was worked out, and that gives the facts the repetition
// that automatises them.
//
// It is time-aware, and the child never notices: no clock, no countdown, no
// "too slow". The exercise only reports how long the answer took (`answerMs`)
// and names a margin for its tier (`meta.paceMarginMs`); the engine compares
// that with the child's own tap baseline (engine/pace.ts). Fast and correct
// counts; slow and correct gets the same praise but leaves the score where it
// is; wrong is wrong. Only above score 60, so it never holds up an unlock.
//
// A wrong answer comes back untimed, with the family's house on screen.

// Extra time on top of the child's tap baseline. With the default baseline of
// 1.5 s these give about 4 s and 3 s. Loosened after the playtest (Nov 2026,
// was 1.5 s / 0.8 s): the stricter limits held a young child's correct answers
// back too often — vlot now has rustig's former margin.
const MARGIN_MS = { rustig: 2500, vlot: 1500 } as const

const TIERS: ExerciseTier[] = [
  { id: 'met-huisje', minScore: 0,  label: 'met huisje', description: 'Not timed; the house of the family stands next to the fact, the asked place open. This tier is only met as the retry of a wrong answer — the exercise has no weight below 60.' },
  { id: 'rustig',     minScore: 60, label: 'rustig',     description: `The bare fact, one tap. Counts as known within the child's own tap time plus ${MARGIN_MS.rustig / 1000} s.` },
  { id: 'vlot',       minScore: 80, label: 'vlot',       description: `The same, within the tap time plus ${MARGIN_MS.vlot / 1000} s.` },
]

// How the fact is asked. + and − problems have one form; a split is asked as a
// split, and for a getalfamilie (problem.family) in any of the four.
type View = 'plus' | 'min' | 'split' | 'punt'

interface SnelWetenMeta {
  view: View
  given: 'A' | 'B'          // split problems: which part is shown
  paceMarginMs?: number     // read by the engine; absent = not timed
  stripMax: 5 | 10
  tierId: string
}

// The fact as it is shown, what is asked, and where that sits in the house.
function fact(q: Pick<ExerciseQuestion<SnelWetenMeta>, 'op' | 'operandA' | 'operandB' | 'meta'>) {
  const { operandA: a, operandB: b } = q
  if (q.op === '-') {
    return { kind: 'eq' as const, eq: { x: a, sign: '-' as EqSign, y: b, res: a - b }, hole: 'res' as EqHole, asked: a - b,
      house: { total: a, left: b, right: a - b }, cell: 'right' as HuisjeCell }
  }
  if (q.op !== 'split') {
    return { kind: 'eq' as const, eq: { x: a, sign: '+' as EqSign, y: b, res: a + b }, hole: 'res' as EqHole, asked: a + b,
      house: { total: a + b, left: a, right: b }, cell: 'roof' as HuisjeCell }
  }
  const t = a + b
  const givenA = q.meta.given === 'A'
  const g = givenA ? a : b
  const m = t - g
  const house = { total: t, left: a, right: b }
  const mCell: HuisjeCell = givenA ? 'right' : 'left'
  switch (q.meta.view) {
    case 'plus': return { kind: 'eq' as const, eq: { x: g, sign: '+' as EqSign, y: m, res: t }, hole: 'res' as EqHole, asked: t, house, cell: 'roof' as HuisjeCell }
    case 'min':  return { kind: 'eq' as const, eq: { x: t, sign: '-' as EqSign, y: g, res: m }, hole: 'res' as EqHole, asked: m, house, cell: mCell }
    case 'punt': return { kind: 'eq' as const, eq: { x: g, sign: '+' as EqSign, y: m, res: t }, hole: 'y' as EqHole, asked: m, house, cell: mCell }
    default:     return { kind: 'split' as const, t, g, m, asked: m, house, cell: mCell }
  }
}

function SnelWetenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SnelWetenMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const f = fact(question)
  const withHouse = meta.tierId === 'met-huisje' || !!question.isRetry

  const [picked, setPicked] = useState<number | null>(null)
  // when the fact became readable — the start of the child's answer time
  const shownAt = useRef(0)
  useEffect(() => { setPicked(null); shownAt.current = performance.now() }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  const pick = (v: number) => {
    if (disabled || answered) return
    setPicked(v)
    resolve(v === f.asked, { givenAnswer: v, answerMs: Math.round(performance.now() - shownAt.current) })
  }

  const cellText = (cell: HuisjeCell, n: number) => (cell === f.cell && !solved ? '?' : String(n))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Weet je het?</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '16px 20px', gap: 10 }}>
        {withHouse && (
          <Huisje room={54} total={f.house.total}
            roof={cellText('roof', f.house.total)} left={cellText('left', f.house.left)} right={cellText('right', f.house.right)}
            good={solved ? f.cell : null} tokens={tokens} />
        )}
        {f.kind === 'eq' ? (
          <Equation {...f.eq} hole={f.hole} solved={solved} size={44} tokens={tokens} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 44, lineHeight: 1.3, color: ink }}>
            <span style={{ color: tokens.accentText }}>{f.t}</span>
            <span style={{ fontSize: 30, opacity: 0.6 }}>is</span>
            <span style={{ color: tokens.pop }}>{f.g}</span>
            <span style={{ fontSize: 30, opacity: 0.6 }}>en</span>
            <span style={{ color: solved ? tokens.confirm : tokens.accentText }}>{solved ? f.m : '?'}</span>
          </div>
        )}
      </ExerciseStage>

      <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered} tokens={scene?.tokens} />
    </div>
  )
}

const SnelWeten: ExerciseDefinition<SnelWetenMeta> = {
  id: 'snel-weten',
  label: 'Weet je het?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Automatise the facts and make "known" visible: a bare fact answered with one tap, where the engine — not the child — notes whether the answer came at once. The only exercise that can see the difference between knowing and counting correctly.',
    pitfalls: [
      'A slip of the finger: the strip has no confirm.',
      'A child who notices that speed matters may start guessing. Nothing on screen says so, and a wrong answer costs three right ones.',
      'The limit is relative to the child\'s own fast answers; until there are enough of them a default is used, which may be too strict or too generous for him.',
    ],
    progression: 'rustig (60): the bare fact; counts when it comes within the child\'s tap time plus a generous margin. vlot (80): a tighter margin. met-huisje exists only as the retry: untimed, the family\'s house beside the fact. A slow correct answer is praised like any other and simply does not move the score.',
  },
  // Retry: the same form of the same fact.
  retryStable: ['view', 'given'],
  correctStatement: q => {
    const f = fact(q)
    return f.kind === 'eq' ? eqText(f.eq.x, f.eq.sign, f.eq.y, f.eq.res) : splitText(f.t, f.g, f.m)
  },
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const prev = ctx?.retryOf
    const op = problem?.op
    const views: View[] = ['split', 'plus', 'min', 'punt']
    const view: View = prev?.view ?? (
      op === '-' ? 'min'
      : op !== 'split' ? 'plus'
      : problem?.op === 'split' && problem.family ? views[Math.floor(Math.random() * views.length)]
      : 'split')
    const whole = op === '-' ? operandA : operandA + operandB
    const margin = MARGIN_MS[tier.id as keyof typeof MARGIN_MS]
    return {
      view,
      given: prev?.given ?? (Math.random() < 0.5 ? 'A' : 'B'),
      ...(margin !== undefined ? { paceMarginMs: margin } : {}),
      stripMax: numeralRangeMax(whole) as 5 | 10,
      tierId: tier.id,
    }
  },
  Component: SnelWetenComponent,
}

registerExercise(SnelWeten)
