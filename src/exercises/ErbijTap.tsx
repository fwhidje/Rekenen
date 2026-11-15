import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { CountChip } from '../presentation/components/CountChip'
import { FiveRow, fiveRowSize } from '../presentation/components/FiveRow'
import { ExerciseTitle, ExerciseStage, Reserve } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'
import { opGlyph, opColor, equationText } from './opDisplay'

// ─── erbij-tap ────────────────────────────────────────────────────────────────
// The erbij action performed by the child: a start group stands in a 5-row and
// is GIVEN as a known quantity (the chip already reads `a` before anything is
// tapped — never counted from 1); the arrivals wait just beside it, gently
// pulsing, and the child taps each one in while the chip counts on. Replaces
// collect-tap, whose tap-everything flow trained counting-all (the documented
// dead-end strategy) and could not fail.
//
// Presentation: a staged opening — start group + its number, then the arrivals
// + the instruction, then "= ?". The arrivals stand in the SAME 5-row as the
// start group, a small step to the right; a tap closes that step, so the row
// fills up (3 and 2 make a full row of 5 — convention Q). Written order: the
// start group is operandA, the arrivals are operandB.
//
// One tier. The former 'voorspel' tier (answer first, then watch) was dropped:
// both groups stood on screen, so it could be counted, and its picture still
// invited tapping. Predicting is fill-vis / the number line's job.

const TIERS: ExerciseTier[] = [
  { id: 'doen', minScore: 0, label: 'doe erbij', description: 'Staged reveal of the start group and the waiting arrivals, then the child taps each arrival into the row while the chip counts on; the row is covered for the final "hoeveel nu?" so the answer comes from the count-on, not a recount.' },
]

interface ErbijTapMeta {
  sceneIndex: number
  options: number[]
  tierId: string
}

// Reveal: [start group + a] → [instruction + "+ b" + waiting arrivals] → ["= ?"].
const REVEAL_DELAYS = [500, 750, 600]
// How long the full row lingers after the last arrival before it is covered
// and the "hoeveel nu?" question appears (the child gets to see it).
const HOWMANY_PAUSE = 1150

// Fixed geometry (nothing moves): one 5-row sized for the FINAL group.
const ITEM = 40
const GAP = 8
// A waiting arrival stands this far to the right of its place in the row.
const WAIT_DX = 22

function ErbijTapComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ErbijTapMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const start = operandA   // written order: start group is the first operand
  const arrive = operandB  // …the arrivals are the second
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper } = tokens
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter

  // 'tap' → all arrived → 'howmany' (choice)
  const [phase, setPhase] = useState<'tap' | 'howmany'>('tap')
  // which arrivals (0..arrive-1) have been tapped in — any order
  const [arrivedSet, setArrivedSet] = useState(new Set<number>())
  const arrived = arrivedSet.size
  // Closure: on a correct answer the equation's "?" becomes the total and is
  // held before the overlay; on wrong it resolves at once.
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // Staged opening reveal; the interaction is locked until it completes.
  const { step, complete } = useReveal(REVEAL_DELAYS, question)
  const showStart = step >= 1
  const showArrivals = step >= 2
  const showEqTail = step >= 3

  useEffect(() => {
    setPhase('tap')
    setArrivedSet(new Set())
  }, [question])

  // After the last arrival, linger on the full row, then the question.
  useEffect(() => {
    if (phase === 'tap' && complete && arrived === arrive) {
      const t = setTimeout(() => setPhase('howmany'), HOWMANY_PAUSE)
      return () => clearTimeout(t)
    }
  }, [arrived, phase, arrive, complete])

  const canTap = !disabled && !answered && complete && phase === 'tap'
  const tapArrival = (k: number) => {
    if (!canTap || arrivedSet.has(k)) return
    setArrivedSet(s => new Set([...s, k]))
  }

  const pickAnswer = (v: number) => {
    if (disabled || answered || phase !== 'howmany') return
    resolve(v === answer, { givenAnswer: v, tapCount: arrive })
  }

  // One line each, so the band keeps its height: look → the instruction → the
  // cardinality question at the covered-row step.
  const instruction = arrive === 1 ? 'Doe er 1 bij!' : `Doe er ${arrive} bij!`
  const prompt =
    phase === 'howmany' ? 'Hoeveel zijn er nu?' :
    showArrivals        ? instruction : 'Kijk!'

  const creature = Counter ? <Counter size={ITEM} /> : <span style={{ fontSize: 36 }}>{legacyScene.e}</span>

  const total = start + arrive
  const row = fiveRowSize(total, ITEM, GAP)
  const areaH = Math.max(96, row.height)
  const showChip = phase === 'tap' && showStart

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <style>{`
        @keyframes erbij-wait { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.14); } }
      `}</style>

      {/* Prompt lives in the title band above the stage */}
      <ExerciseTitle tokens={tokens}>{prompt}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box' }}>
        {/* Counting-on chip — fixed height so the equation never shifts */}
        <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showChip && <CountChip count={start + arrived} ink={ink} paper={paper} />}
        </div>

        {/* Equation — built up by the reveal, always visible once assembled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Fredoka One, cursive', fontSize: 32, minHeight: 40 }}>
          <span style={{ color: tokens.accentText, opacity: showStart ? 1 : 0, transition: 'opacity .3s' }}>{operandA}</span>
          <span style={{ color: opColor(op, tokens), opacity: showArrivals ? 1 : 0, transition: 'opacity .3s' }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop, opacity: showArrivals ? 1 : 0, transition: 'opacity .3s' }}>{operandB}</span>
          <span style={{ color: ink, opacity: showEqTail ? 0.4 : 0, fontSize: 27, transition: 'opacity .3s' }}>=</span>
          <span style={{ color: tokens.accentText, opacity: showEqTail ? 1 : 0, transition: 'opacity .3s' }}>{solved ? answer : '?'}</span>
        </div>

        {/* One area of fixed size for both states — the row and its cover — so
            the stage never changes height during a question. */}
        <div style={{ height: areaH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'howmany' ? (
            // Row covered: naming the total has to come from the count-on, not a recount.
            <div style={{
              width: 130, height: 96, boxSizing: 'border-box', borderRadius: 16, border: `2px dashed ${ink}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 44, color: `${ink}40`,
            }}>?</div>
          ) : (
            // The 5-row, sized for the final group. Start creatures fade in at
            // their places; each arrival waits a step to the right of ITS place
            // and slides home when tapped — the row fills, nothing reflows.
            <FiveRow n={total} item={ITEM} gap={GAP} style={{ marginRight: WAIT_DX }} renderItem={(i) => {
              if (i < start) {
                return (
                  <div style={{ opacity: showStart ? 1 : 0, transform: showStart ? 'none' : 'scale(0.5)', transition: 'opacity .35s ease, transform .35s ease' }}>
                    {creature}
                  </div>
                )
              }
              const k = i - start
              const isIn = arrivedSet.has(k)
              return (
                <div
                  onClick={() => tapArrival(k)}
                  style={{
                    opacity: showArrivals ? 1 : 0,
                    transform: isIn ? 'none' : `translateX(${WAIT_DX}px)`,
                    transition: 'opacity .3s ease-out, transform .3s ease-out',
                    cursor: canTap && !isIn ? 'pointer' : 'default',
                    pointerEvents: showArrivals ? 'auto' : 'none',
                  }}>
                  {/* the pulse is the "tap me" cue; it stops once the arrival is in */}
                  <div style={{ animation: !isIn && canTap ? 'erbij-wait 1.1s ease-in-out infinite' : 'none' }}>
                    {creature}
                  </div>
                </div>
              )
            }} />
          )}
        </div>
      </ExerciseStage>

      {/* Input lives outside the stage. Its space is reserved from the start,
          so the title and stage don't jump when the buttons appear. */}
      <Reserve show={phase === 'howmany'}>
        <ChoiceButtons options={meta.options} onPick={pickAnswer} disabled={disabled || answered} tokens={scene?.tokens} />
      </Reserve>
    </div>
  )
}

const ErbijTap: ExerciseDefinition<ErbijTapMeta> = {
  id: 'erbij-tap',
  label: 'Doe erbij',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Counting on, enacted: the start group is a given quantity (the chip reads it without counting), the child performs the erbij action and names the new total.',
    pitfalls: [
      'Recounting the whole row from 1 at the question — the row is covered at answer time to force the count-on.',
      'Reading the chip instead of counting along — the chip vanishes before the answer for the same reason.',
      'Off-by-one at the step over the start group (says the start number again for the first arrival).',
    ],
    progression: 'Single tier: a staged reveal builds the start group and the waiting arrivals, the child taps each arrival in while the chip models counting on; the row lingers, then is covered for "hoeveel nu?". The entry exercise of the + skills — it fades out as fill-vis and the number line take over.',
  },
  retryStable: ['sceneIndex'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  generateMeta(operandA, operandB, score, _problem, ctx) {
    return {
      sceneIndex: ctx?.retryOf?.sceneIndex ?? Math.floor(Math.random() * 24),
      options: makeNumeralOptions(operandA + operandB, numeralRangeMax(operandA + operandB)),
      tierId: pickTier(TIERS, score).id,
    }
  },
  Component: ErbijTapComponent,
}

registerExercise(ErbijTap)
