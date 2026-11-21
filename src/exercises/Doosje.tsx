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
  { id: 'kijk',     minScore: 0,  label: 'eerst kijken', description: 'The box starts open: the others walk in (or out) one by one, the whole result is visible for a moment, then the lid closes with a "?" on it. A demonstration of the story; answer by choice.' },
  { id: 'dicht',    minScore: 35, label: 'dicht',        description: 'The box is closed from the start, the lid says how many are in it. The others walk into (or out of) the closed box one by one, then the lid\'s number becomes "?". Answer by choice.' },
  { id: 'intikken', minScore: 65, label: 'intikken',     description: 'As dicht, typed answer — production instead of recognition.' },
]

interface DoosjeMeta {
  sceneIndex: number
  options: number[]
  tierId: string
}

const ITEM = 30
const GAP = 6
const OUTSIDE_H = ITEM + 4   // the row under the box
const STAGE_GAP = 8          // between the box and that row

// ─── Timeline (ms) — the knobs for tuning ──────────────────────────────────────
// Each step waits its delay, then:
//   1 box (with its group / its number) + the first number of the sum
//   2 "+ b" / "− b"; the arrivals stand under the box (−: nothing outside yet)
//   3 … 2+b  one creature at a time goes in (+) or comes out (−)
//   3+b      the lid closes (kijk) and its number becomes "?"
//   4+b      "= ?" — input unlocks
const START_MS = 300
const LOOK_MS = { kijk: 900, dicht: 500 }      // the box alone, before anyone moves
const MOVE_MS = 650                            // one creature to the next
const FLY_MS = 550                             // one creature's trip (≤ MOVE_MS)
const HOLD_MS = { kijk: 900, dicht: 350 }      // after the last trip: kijk shows the result
const ASK_MS = 400

function DoosjeComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<DoosjeMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter
  const minus = op === '-'
  const typed = meta.tierId === 'intikken'
  // anything but the two closed tiers shows the box open (also unknown ids from old records)
  const peek = meta.tierId !== 'dicht' && !typed
  const pace = peek ? 'kijk' : 'dicht'

  const [input, setInput] = useState('')
  const { solved, answered, resolve } = useClosure(question, onResolve)

  const delays = [START_MS, LOOK_MS[pace], ...Array.from({ length: operandB }, () => MOVE_MS), FLY_MS + HOLD_MS[pace], ASK_MS]
  const { step, complete, replay } = useReveal(delays, question)
  const showBox = step >= 1
  const showOthers = step >= 2
  const moved = Math.max(0, Math.min(step - 2, operandB))   // creatures that have set off
  const shut = step >= 3 + operandB                         // the lid is on, with "?"

  // The box is open while the kijk tier shows it, and again once solved.
  const open = solved || (peek && !shut)
  // Places inside the box: the largest group it ever holds.
  const capacity = minus ? operandA : operandA + operandB
  const inner = fiveRowSize(capacity, ITEM, GAP)
  const boxW = inner.width + 32
  const boxH = inner.height + 34
  // How many creatures the box holds at this moment.
  const insideNow = solved ? answer : minus ? operandA - moved : operandA + moved

  // Where place k inside the box is, seen from the centre of creature i of the
  // row under it — the vector a creature travels (in) or comes from (out).
  const rowW = operandB * ITEM + Math.max(0, operandB - 1) * GAP
  const trip = (i: number, k: number) => {
    const slotX = (k % 5) * (ITEM + GAP) + ITEM / 2 - inner.width / 2
    const slotY = Math.floor(k / 5) * (ITEM + GAP) + ITEM / 2 - inner.height / 2
    const ownX = i * (ITEM + GAP) + ITEM / 2 - rowW / 2
    const up = boxH / 2 + STAGE_GAP + OUTSIDE_H / 2
    return { dx: slotX - ownX, dy: slotY - up }
  }
  // +: arrival i takes place a + i.  −: leaver i leaves from the back, place a − 1 − i.
  const placeOf = (i: number) => (minus ? operandA - 1 - i : operandA + i)

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
      <style>{`
        @keyframes doosje-in {
          0%   { transform: none; opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(.75); opacity: 0; }
        }
        @keyframes doosje-pop {
          0%   { transform: scale(.4); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: none; }
        }
        @keyframes doosje-out {
          0%   { transform: translate(var(--dx), var(--dy)) scale(.75); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: none; opacity: 1; }
        }
      `}</style>
      <ExerciseTitle tokens={tokens}>{minus ? 'Hoeveel zitten er nog in?' : 'Hoeveel zijn er nu?'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} replay={{ show: complete && !answered && !disabled, onClick: replay }} style={{ minWidth: 300, boxSizing: 'border-box', padding: '12px 24px', gap: STAGE_GAP }}>
        {/* Equation — built up by the reveal, always visible once assembled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32, height: 44 }}>
          <span style={{ color: tokens.accentText, opacity: showBox ? 1 : 0, transition: 'opacity .3s' }}>{operandA}</span>
          <span style={{ color: glyphColor, opacity: showOthers ? 1 : 0, transition: 'opacity .3s' }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop, opacity: showOthers ? 1 : 0, transition: 'opacity .3s' }}>{operandB}</span>
          <span style={{ color: ink, opacity: complete ? 0.4 : 0, fontSize: 27, transition: 'opacity .3s' }}>=</span>
          <span style={{ opacity: complete ? 1 : 0, transition: 'opacity .3s', display: 'inline-flex' }}>
            {typed
              ? <AnswerSlot value={solved ? answer : input} solved={solved} size={44} tokens={tokens} />
              : <span style={{ color: tokens.accentText }}>{solved ? answer : '?'}</span>}
          </span>
        </div>

        {/* The box. Its inside is laid out for the largest group it will show;
            the lid is a cover that fades — nothing changes size. */}
        <div style={{
          position: 'relative', boxSizing: 'border-box', marginTop: 22,
          width: boxW, height: boxH,
          border: `2.5px solid ${ink}`, borderRadius: '4px 4px 12px 12px', background: tokens.cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: showBox ? 1 : 0, transition: 'opacity .3s',
        }}>
          {/* every place drawn; a creature fades in as an arrival lands on it,
              or out as a leaver sets off from it */}
          <FiveRow n={capacity} item={ITEM} gap={GAP} renderItem={k => (
            <div style={{
              opacity: k < insideNow ? 1 : 0,
              transition: minus ? 'opacity .25s' : `opacity .25s ${Math.round(FLY_MS * 0.6)}ms`,
            }}>{creature(ITEM)}</div>
          )} />
          {/* the lid: says how many are in the box — until the others have
              gone in (or out); then that number is no longer true: "?" */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '2px 2px 9px 9px', background: tokens.paperMid,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 36, color: shut ? tokens.accentText : ink,
            opacity: open ? 0 : 1, transition: 'opacity .45s ease, color .2s',
          }}>
            <span key={shut ? 'q' : 'n'} style={{ animation: shut && !peek ? 'doosje-pop .35s ease-out' : undefined }}>
              {shut ? '?' : operandA}
            </span>
          </div>
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

        {/* The others. +: they stand here and go into the box one by one.
            −: they come out of the box one by one and stay here. */}
        <div style={{ height: OUTSIDE_H, display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <span style={{
            fontFamily: 'Fredoka One, cursive', fontSize: 30, lineHeight: 1, color: glyphColor,
            // +: gone with the last arrival (nothing left to point at); −: stays with the leavers
            opacity: showOthers && (minus || !shut) ? 1 : 0, transition: 'opacity .35s',
          }}>{minus ? '↓' : '↑'}</span>
          <FiveRow n={operandB} item={ITEM} gap={GAP} renderItem={i => {
            const { dx, dy } = trip(i, placeOf(i))
            const going = i < moved
            const style: React.CSSProperties & Record<'--dx' | '--dy', string> = {
              '--dx': `${dx}px`, '--dy': `${dy}px`,
              opacity: minus ? 0 : showOthers ? 1 : 0,
              transition: 'opacity .35s',
              animation: going ? `${minus ? 'doosje-out' : 'doosje-in'} ${FLY_MS}ms ease-in-out forwards` : undefined,
            }
            // + once solved: they are in the box (the open box shows them)
            if (!minus && solved) { style.animation = undefined; style.opacity = 0 }
            return <div style={style}>{creature(ITEM)}</div>
          }} />
          {/* the arrow keeps its width on the other side, so the row stays centred */}
          <span style={{ width: 18 }} />
        </div>
      </ExerciseStage>

      {typed
        // compact: a two-row box (tot 10) and the keypad must fit a 375 × 667 screen
        ? <NumPad compact onKey={handleKey} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
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
    progression: 'kijk: the whole story is shown — the box open, the others walking in (or out), the result visible for a moment — then the lid closes with "?": a demonstration that anchors what the box means. dicht (35): closed from the start; the others walk into (or out of) the closed box and the lid\'s number becomes "?" — the result can only be reached by counting on (or back) from the number in the sum. intikken (65): the same, typed. On a correct answer the lid lifts and the box shows the result.',
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
