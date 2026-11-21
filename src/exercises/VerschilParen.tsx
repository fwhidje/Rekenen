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
import { Equation } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { equationText } from './opDisplay'

// ─── verschil-paren ───────────────────────────────────────────────────────────
// Two owners, two groups: how many more does the one have? The arithmetic is
// known by now — the work is the relational question ("hoeveel meer" is not
// "hoeveel" and not "wie heeft er meer"), the action that makes a difference
// visible (pair them off: the ones without a partner are the difference), and
// the − sum that belongs to it although nothing leaves.
//
// Each owner is a colour: a row of that colour and a chip of that colour in
// the question, so the question can be read without names. The numbers of the
// sum carry the same colours (colour rule): the larger number is the larger
// group's colour, the smaller the smaller's.
//
// At the top tier (getallen) the sum is not shown until the answer is in: two
// numbers and the question in words — a sanctioned exception to the visible
// equation, as for rekenverhaal: deciding that "hoeveel meer" is a − is the
// point. The tier below and the retry show the sum.

const TIERS: ExerciseTier[] = [
  { id: 'paren',    minScore: 0,  label: 'paren maken',  description: 'The two rows stand under each other; the pairs link one by one and dim, the ones without a partner stand out, and the − sum forms meanwhile. Choice — the options include both groups and their total.' },
  { id: 'naast',    minScore: 30, label: 'naast elkaar', description: 'The rows are aligned but nothing is paired for the child. Number strip.' },
  { id: 'schuin',   minScore: 55, label: 'niet gelijk',  description: 'The rows are no longer aligned (different spacing), so the difference cannot be read off the overhang — the numbers have to do it.' },
  { id: 'getallen', minScore: 75, label: 'enkel getallen', description: 'Two owners with a number each, no groups and no sum: the question in words decides that it is a −. The sum appears with the answer.' },
]

type Variant = 'meer' | 'minder' | 'gelijk'

interface VerschilParenMeta {
  variant: Variant
  largerTop: boolean
  colorA: string      // the larger group's owner
  colorB: string      // the smaller group's owner
  options: number[]
  stripMax: 5 | 10
  tierId: string
}

const ITEM = 28
const GAP = 6
const PAIR_MS = 520

function VerschilParenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<VerschilParenMeta>) {
  const { operandA: big, operandB: small, answer, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const retry = !!question.isRetry
  const tier = meta.tierId
  const paren = tier === 'paren' || (retry && tier !== 'getallen' && tier !== 'schuin')
  const schuin = tier === 'schuin'
  const getallen = tier === 'getallen'
  // the top tier without the sum (never on a retry: the retry is one tier down)
  const bareTop = getallen && !retry
  const useChoice = tier === 'paren'

  const [picked, setPicked] = useState<number | null>(null)
  // paren: how many pairs have been linked so far
  const [pairs, setPairs] = useState(0)
  useEffect(() => { setPicked(null); setPairs(0) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // [rows + first number] → pairing (paren only) → ["− small"] → ["= ?"]
  const { step, replay: replayReveal } = useReveal([400, 500], question)
  const rowsShown = step >= 1
  const pairing = paren && step >= 2
  useEffect(() => {
    if (!pairing || pairs >= small) return
    const t = setTimeout(() => setPairs(p => p + 1), PAIR_MS)
    return () => clearTimeout(t)
  }, [pairing, pairs, small, question])
  const pairsDone = !paren || (pairing && pairs >= small)
  const complete = step >= 2 && pairsDone
  // ↻: the rows and the pairing again
  const replay = () => { setPairs(0); replayReveal() }

  const pick = (v: number) => {
    if (disabled || answered || !complete) return
    setPicked(v)
    resolve(v === answer, { givenAnswer: v })
  }

  const chip = (color: string, size = 20) => (
    <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: color, border: `2px solid ${ink}`, verticalAlign: 'middle', boxSizing: 'border-box' }} />
  )
  const title =
    meta.variant === 'minder' ? <>Hoeveel heeft {chip(meta.colorB)} er minder?</>
    : meta.variant === 'gelijk' ? <>Hoeveel moet {chip(meta.colorB)} er nog?</>
    : <>Hoeveel heeft {chip(meta.colorA)} er meer?</>

  // One row. In paren the first `pairs` items have found their partner (dim);
  // once all pairs are made, the ones left over in the large row stand out.
  const row = (n: number, color: string, isBig: boolean, item: number, gap: number) => (
    <FiveRow n={n} item={item} gap={gap} renderItem={(i) => {
      const paired = paren && i < pairs
      const left = isBig && i >= small && (solved || (paren && pairsDone))
      return (
        <div style={{
          width: item - 4, height: item - 4, borderRadius: '50%', background: color, boxSizing: 'border-box',
          opacity: paired ? 0.3 : 1, transition: 'opacity .35s, box-shadow .35s',
          boxShadow: left ? `0 0 0 3px ${solved ? tokens.confirm : tokens.accent}` : 'none',
        }} />
      )
    }} />
  )

  const bigRow = (item = ITEM, gap = GAP) => row(big, meta.colorA, true, item, gap)
  // schuin: the small row is drawn larger and wider apart, so it can look longer
  const smallRow = () => (schuin ? row(small, meta.colorB, false, ITEM + 8, GAP + 10) : row(small, meta.colorB, false, ITEM, GAP))
  const rowsHeight = fiveRowSize(Math.max(big, 1), ITEM, GAP).height + fiveRowSize(Math.max(small, 1), ITEM + 8, GAP + 10).height + 10

  const numberTile = (n: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {chip(color, 28)}
      <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 40, color, lineHeight: 1, WebkitTextStroke: `1px ${ink}` }}>{n}</span>
    </div>
  )

  const first = meta.largerTop ? 'big' : 'small'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens} style={{ fontSize: 21 }}>{title}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: complete && !answered && !disabled, onClick: replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        {getallen ? (
          <div style={{ display: 'flex', gap: 36, opacity: rowsShown ? 1 : 0, transition: 'opacity .3s' }}>
            {first === 'big' ? <>{numberTile(big, meta.colorA)}{numberTile(small, meta.colorB)}</> : <>{numberTile(small, meta.colorB)}{numberTile(big, meta.colorA)}</>}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', justifyContent: 'center',
            minHeight: rowsHeight, opacity: rowsShown ? 1 : 0, transition: 'opacity .3s',
          }}>
            {first === 'big' ? <>{bigRow()}{smallRow()}</> : <>{smallRow()}{bigRow()}</>}
          </div>
        )}

        {/* The − sum that belongs to the comparison: the larger group, minus the
            ones that have a partner. */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Equation x={big} sign="-" y={small} res={answer} hole="res" solved={solved}
            colors={{ x: meta.colorA, y: meta.colorB }}
            shown={bareTop ? (solved ? 3 : 0) : !rowsShown ? 0 : complete ? 3 : paren ? (pairs > 0 ? 2 : 1) : 1} size={36} tokens={tokens} />
          {bareTop && (
            <div aria-hidden style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 40, color: `${ink}40`,
              opacity: solved || !complete ? 0 : 1, transition: 'opacity .3s', pointerEvents: 'none',
            }}>?</div>
          )}
        </div>
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const VerschilParen: ExerciseDefinition<VerschilParenMeta> = {
  id: 'verschil-paren',
  label: 'Hoeveel meer?',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Answer "hoeveel meer / hoeveel minder" for two groups that both stay: pair them off, the ones without a partner are the difference — and that difference is a − sum (larger number first) although nothing is taken away.',
    pitfalls: [
      '"Hoeveel meer?" read as "hoeveel?" — answers the size of the larger (or the named) group. Both groups are among the choice options.',
      'Adds the two groups: both are on screen, and "meer" sounds like erbij.',
      'At the aligned tiers the answer is the overhang, readable without thinking — the intended support, removed at schuin.',
    ],
    progression: 'paren: the pairing is shown and the sum forms with it. naast (30): aligned rows, nothing paired. schuin (55): the rows have different spacing, so the eye is no help. getallen (75): two numbers and the question, no sum — the sum appears with the answer. The question varies — meer, minder, and from schuin on "hoeveel moet … nog krijgen" (evenveel maken). Equal groups give 0: everyone has a partner. A retry of the row tiers shows the pairing.',
  },
  // Retry: the same question (meer / minder / gelijk), the same owners and order.
  retryStable: ['variant', 'largerTop', 'colorA', 'colorB'],
  correctStatement: q => equationText('-', q.operandA, q.operandB),
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const prev = ctx?.retryOf
    const [colorA, colorB] = prev ? [prev.colorA, prev.colorB] : pickColors()
    const top = tier.id === 'schuin' || tier.id === 'getallen'
    const r = Math.random()
    const variant: Variant = prev?.variant ?? (top && r < 0.25 ? 'gelijk' : r < 0.6 ? 'meer' : 'minder')
    const diff = operandA - operandB
    const max = numeralRangeMax(operandA) as 5 | 10
    return {
      variant,
      largerTop: prev?.largerTop ?? Math.random() < 0.6,
      colorA, colorB,
      // the two groups and their total are the typical wrong answers
      options: makeSumOptions(diff, [operandA, operandB, operandA + operandB], max, 0),
      stripMax: max,
      tierId: tier.id,
    }
  },
  Component: VerschilParenComponent,
}

registerExercise(VerschilParen)
