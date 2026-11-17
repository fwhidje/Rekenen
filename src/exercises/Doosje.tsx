import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { FiveRow, fiveRowSize } from '../presentation/components/FiveRow'
import { AnswerSlot } from '../presentation/components/AnswerSlot'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { opGlyph, opColor, equationText } from './opDisplay'

// ─── doosje ───────────────────────────────────────────────────────────────────
// Counting on / back made necessary: the first number is a group INSIDE A
// CLOSED BOX — a quantity the child knows (the lid says how many) but cannot
// count. For '+', b creatures stand outside, about to go in: how many are there
// now? For '−', b creatures have come out: how many are still inside? Either
// way the only route to the answer is to start from the number on the lid and
// count on (or back) by the ones that can be seen.
//
// Replaces collect-counter (+/− buttons on a bare number), which showed a false
// equation until tapped, had nothing to count, and — since its counter started
// at the first number — could not tell counting on from counting all.
// Op-generic: one id serves the + and the − skills (each skill has its own
// weight table; the answer record carries the op).
//
// On a correct answer the lid lifts and the box shows what is inside — the
// closure is the check.

const TIERS: ExerciseTier[] = [
  { id: 'kijk',     minScore: 0,  label: 'eerst kijken', description: 'The box starts open: the child sees the group inside, then the lid closes and the others arrive (or leave). The number on the lid has just been seen as a quantity. Answer by choice.' },
  { id: 'dicht',    minScore: 35, label: 'dicht',        description: 'The box is closed from the start — the lid\'s numeral alone stands for the group. Answer by choice.' },
  { id: 'intikken', minScore: 65, label: 'intikken',     description: 'Closed box, typed answer — production instead of recognition.' },
]

interface DoosjeMeta {
  sceneIndex: number
  options: number[]
  tierId: string
}

const ITEM = 30
const GAP = 6

function DoosjeComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<DoosjeMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter
  const minus = op === '-'
  const typed = meta.tierId === 'intikken'
  // anything but the two closed tiers peeks first (also unknown ids from old records)
  const peek = meta.tierId !== 'dicht' && !typed

  const [input, setInput] = useState('')
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // kijk:  [box open, a] → [lid closes] → [the others + "op b"] → ["= ?"]
  // dicht: [box closed, a]              → [the others + "op b"] → ["= ?"]
  const { step, complete } = useReveal(peek ? [300, 1500, 600, 500] : [300, 600, 500], question)
  const showBox = step >= 1
  const lidClosed = peek ? step >= 2 : true
  const showOthers = step >= (peek ? 3 : 2)
  const showEqTail = complete

  // What the box holds, when it can be seen: the start group while peeking,
  // the result once solved (the arrivals went in / the leavers are out).
  const open = solved || !lidClosed
  const inside = solved ? answer : operandA
  // Positions reserved for the largest group the box ever shows.
  const capacity = minus ? operandA : operandA + operandB
  const boxInner = fiveRowSize(capacity, ITEM, GAP)
  // '+': the arrivals stand outside until they go in (solved). '−': the leavers stay out.
  const othersVisible = showOthers && !(solved && !minus)

  const handleKey = (key: string) => {
    if (disabled || answered || !complete) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); resolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(s => s + key)
  }

  const creature = (size: number) => Counter ? <Counter size={size} /> : <span style={{ fontSize: size - 4 }}>{legacyScene.e}</span>
  const glyphColor = opColor(op, tokens)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{minus ? 'Hoeveel zitten er nog in?' : 'Hoeveel zijn er nu?'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '12px 24px', gap: 8 }}>
        {/* Equation — built up by the reveal, always visible once assembled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32, height: 44 }}>
          <span style={{ color: tokens.accentText, opacity: showBox ? 1 : 0, transition: 'opacity .3s' }}>{operandA}</span>
          <span style={{ color: glyphColor, opacity: showOthers ? 1 : 0, transition: 'opacity .3s' }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop, opacity: showOthers ? 1 : 0, transition: 'opacity .3s' }}>{operandB}</span>
          <span style={{ color: ink, opacity: showEqTail ? 0.4 : 0, fontSize: 27, transition: 'opacity .3s' }}>=</span>
          <span style={{ opacity: showEqTail ? 1 : 0, transition: 'opacity .3s', display: 'inline-flex' }}>
            {typed
              ? <AnswerSlot value={solved ? answer : input} solved={solved} size={44} tokens={tokens} />
              : <span style={{ color: tokens.accentText }}>{solved ? answer : '?'}</span>}
          </span>
        </div>

        {/* The box. Its inside is laid out for the largest group it will show;
            the lid is a cover that fades — nothing changes size. */}
        <div style={{
          position: 'relative', boxSizing: 'border-box', marginTop: 22,
          width: boxInner.width + 32, height: boxInner.height + 34,
          border: `2.5px solid ${ink}`, borderRadius: '4px 4px 12px 12px', background: tokens.cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: showBox ? 1 : 0, transition: 'opacity .3s',
        }}>
          <FiveRow n={inside} total={capacity} item={ITEM} gap={GAP} renderItem={() => creature(ITEM)} />
          {/* the lid: says how many went in — a known quantity, not a countable one */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '2px 2px 9px 9px', background: tokens.paperMid,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 36, color: ink,
            opacity: open ? 0 : 1, transition: 'opacity .45s ease',
          }}>{operandA}</div>
          {/* the lid's rim: sits on the box, tips up when the box is open
              (a transform — it takes no space and moves nothing else) */}
          <div style={{
            position: 'absolute', left: -9, right: -9, top: -13, height: 16, boxSizing: 'border-box',
            background: tokens.paperMid, border: `2.5px solid ${ink}`, borderRadius: 6,
            transformOrigin: '0% 100%',
            transform: open ? 'translateY(-5px) rotate(-4deg)' : 'none',
            transition: 'transform .45s ease',
          }} />
        </div>

        {/* The others: arriving (+, arrow into the box) or having left (−, arrow out) */}
        <div style={{
          height: ITEM + 4, display: 'flex', alignItems: 'center', gap: 10,
          opacity: othersVisible ? 1 : 0, transition: 'opacity .35s',
        }}>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 30, lineHeight: 1, color: glyphColor }}>{minus ? '↓' : '↑'}</span>
          <FiveRow n={operandB} item={ITEM} gap={GAP} renderItem={() => creature(ITEM)} />
        </div>
      </ExerciseStage>

      {typed
        ? <NumPad onKey={handleKey} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
        : <ChoiceButtons options={meta.options} onPick={v => resolve(v === answer, { givenAnswer: v })} disabled={disabled || answered || !complete} tokens={scene?.tokens} />}
    </div>
  )
}

const Doosje: ExerciseDefinition<DoosjeMeta> = {
  id: 'doosje',
  label: 'Het doosje',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Count on (or back) from a known, hidden quantity: the group in the box cannot be recounted, so the number on the lid has to be taken as the starting point. The strategy fill-vis and erbij-tap allow but cannot enforce.',
    pitfalls: [
      'Answering only what can be seen (the arrivals / the leavers) — the box is not treated as holding a quantity.',
      'Off-by-one at the first step from the lid\'s number.',
      'For −: answering how many left instead of how many are still inside.',
    ],
    progression: 'kijk: the box is seen open first, so the lid\'s numeral is anchored to a group that was just visible. dicht (35): closed from the start — the numeral alone carries the quantity. intikken (65): the same, typed. On a correct answer the lid lifts and the box shows the result.',
  },
  retryStable: ['sceneIndex'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  // At most four outside the box: a turned-around sum (1 + 9) would put nine
  // there, and counting on from 1 is not the idea.
  isCompatible: (_a, b) => b <= 4,
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const minus = problem?.op === '-'
    const correct = minus ? operandA - operandB : operandA + operandB
    return {
      sceneIndex: ctx?.retryOf?.sceneIndex ?? Math.floor(Math.random() * 24),
      options: makeNumeralOptions(correct, numeralRangeMax(minus ? operandA : correct), minus ? 0 : 1),
      tierId: tier.id,
    }
  },
  Component: DoosjeComponent,
}

registerExercise(Doosje)
