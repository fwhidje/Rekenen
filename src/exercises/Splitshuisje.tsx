import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { Huisje } from '../presentation/components/Huisje'
import { makeNumeralOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── splitshuisje (production) ────────────────────────────────────────────────
// The house the child knows from splitsen-herken, but now WRITTEN: the roof
// gives the total, the child produces the room numerals. Noteren invariant:
// the parts are never visible anywhere — the roof die-aid is always an
// UNSPLIT, single-colour pattern (a colour-split roof would collapse this
// back into herken), and at most one part appears as a bare numeral.

// One house fills the stage; the two houses of twee-huisjes stand side by side
// at a smaller size, so the numpad stays on screen (the question must fit the
// viewport — CLAUDE.md → Exercise behaviour conventions).
const ROOM_PAIR = 60   // one house alone uses the Huisje default (76)

const TIERS: ExerciseTier[] = [
  { id: 'één-kamer',      minScore: 0,  label: 'één kamer',      description: 'One room prefilled, unsplit die-aid in the roof; the missing part is generated mentally and picked from four numerals.' },
  { id: 'één-kamer-kaal', minScore: 30, label: 'kaal + numpad',  description: 'No die-aid; the missing part is typed — true production from the numeral total alone.' },
  { id: 'twee-huisjes',   minScore: 60, label: 'twee huisjes',   description: 'The same roof twice; the child fills both houses with two DIFFERENT splits (order-equivalent counts as the same split).' },
]

interface SplitshuisjeMeta {
  givenSide: 'left' | 'right'
  options: number[]
  tierId: string
}

const splitEq = (a1: number, b1: number, a2: number, b2: number) =>
  (a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2)

function SplitshuisjeComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitshuisjeMeta>) {
  const { operandA, operandB, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const total = operandA + operandB

  // één-kamer tiers: the given part sits in one room, the other is produced.
  const given = meta.givenSide === 'left' ? operandA : operandB
  const missing = total - given

  // twee-huisjes: four cells filled in order (h1-left, h1-right, h2-left, h2-right)
  const [cells, setCells] = useState<number[]>([])
  // single-house numpad input
  const [input, setInput] = useState('')
  // twee-huisjes: the second house repeats the first (order-flipped counts) —
  // a hint and another try, not a wrong answer (same as splits-vrij).
  const [sameWarning, setSameWarning] = useState(false)
  // Closure: the completed house(s) are held before the overlay.
  const { solved, answered, resolve } = useClosure(question, onResolve)

  useEffect(() => { setCells([]); setInput(''); setSameWarning(false) }, [question])

  const prompt = meta.tierId === 'twee-huisjes'
    ? 'Maak twee verschillende splitsingen!'
    : 'Vul het huisje in!'

  const resolveSingle = (v: number) => resolve(v === missing, { givenAnswer: v })

  const handleKeySingle = (key: string) => {
    if (disabled || answered) return
    if (key === '⌫') { setInput(''); return }
    if (key === '✓') { if (input) resolveSingle(parseInt(input, 10)); return }
    if (input.length < 1) setInput(key)
  }

  const handleKeyDouble = (key: string) => {
    if (disabled || answered) return
    if (sameWarning) setSameWarning(false)
    if (key === '⌫') { setCells(c => c.slice(0, -1)); return }
    if (key === '✓') {
      if (cells.length === 4) {
        const [a1, b1, a2, b2] = cells
        const valid = a1 + b1 === total && a2 + b2 === total
        const different = !splitEq(a1, b1, a2, b2)
        if (valid && !different) {
          // both houses are right, but the same: empty the second and ask again
          setSameWarning(true)
          setCells(c => c.slice(0, 2))
        } else {
          resolve(valid && different)
        }
      }
      return
    }
    if (cells.length < 4) setCells(c => [...c, parseInt(key, 10)])
  }

  const cellVal = (i: number) => (cells.length > i ? String(cells[i]) : '?')
  const activeIdx = solved ? null : cells.length

  // When solved, show the missing room filled with the correct answer
  const singleMissingDisplay = solved
    ? String(missing)
    : (meta.tierId === 'één-kamer' ? '?' : (input || '?'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <ExerciseTitle tokens={tokens} warning={sameWarning ? 'Dat is dezelfde!' : undefined}>{prompt}</ExerciseTitle>

      {meta.tierId === 'twee-huisjes' ? (
        <>
          <ExerciseStage tokens={tokens}>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Huisje room={ROOM_PAIR} total={total} left={cellVal(0)} right={cellVal(1)}
                activeCell={activeIdx === 0 ? 'left' : activeIdx === 1 ? 'right' : null}
                dieAid={false} tokens={tokens} />
              <Huisje room={ROOM_PAIR} total={total} left={cellVal(2)} right={cellVal(3)}
                activeCell={activeIdx === 2 ? 'left' : activeIdx === 3 ? 'right' : null}
                dieAid={false} tokens={tokens} />
            </div>
          </ExerciseStage>
          <NumPad onKey={handleKeyDouble} disabled={disabled || answered} tokens={scene?.tokens} />
        </>
      ) : (
        <>
          <ExerciseStage tokens={tokens}>
            <Huisje total={total}
              left={meta.givenSide === 'left' ? String(given) : singleMissingDisplay}
              right={meta.givenSide === 'right' ? String(given) : singleMissingDisplay}
              activeCell={solved || meta.tierId === 'één-kamer' ? null : (meta.givenSide === 'left' ? 'right' : 'left')}
              dieAid={meta.tierId === 'één-kamer'} tokens={tokens} />
          </ExerciseStage>
          {meta.tierId === 'één-kamer'
            ? <ChoiceButtons options={meta.options} onPick={resolveSingle} disabled={disabled || answered} tokens={scene?.tokens} />
            : <NumPad onKey={handleKeySingle} disabled={disabled || answered} tokens={scene?.tokens} />}
        </>
      )}
    </div>
  )
}

const Splitshuisje: ExerciseDefinition<SplitshuisjeMeta> = {
  id: 'splitshuisje',
  label: 'Vul het huisje in',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Produce splits in the canonical splitshuisje notation: the roof gives the whole, the child writes the parts. The parts are never shown — the missing room comes out of part-whole knowledge, not off the screen.',
    pitfalls: [
      'Echoing the roof or the given room instead of the complement.',
      'At twee-huisjes: producing the same split twice, possibly order-flipped (one-split bias — order-equivalent counts as the same). Refused with a hint and another try; totals 2 and 3 need a 0-split for the second house.',
    ],
    progression: 'één-kamer: one room prefilled, unsplit die-aid in the roof, choice entry. één-kamer-kaal (30): aid gone, numpad — production from the numeral alone. twee-huisjes (60): two different splits of the same roof, pushing variety.',
  },
  // Retry: the same room stays given — otherwise the missing number changes
  // and it is a different question.
  retryStable: ['givenSide'],
  // The rooms hold (partA, partB) left to right, whichever one was given.
  // twee-huisjes has no single answer (any two different splits) → neutral.
  correctStatement: q => q.meta.tierId === 'twee-huisjes'
    ? null
    : splitText(q.operandA + q.operandB, q.operandA, q.operandB),
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const givenSide = ctx?.retryOf?.givenSide ?? (Math.random() < 0.5 ? 'left' : 'right')
    const total = operandA + operandB
    const missing = givenSide === 'left' ? operandB : operandA
    return {
      givenSide,
      options: makeNumeralOptions(missing, total, 0),
      tierId: tier.id,
    }
  },
  Component: SplitshuisjeComponent,
}

registerExercise(Splitshuisje)
