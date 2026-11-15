import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { NumPad } from '../ui/components/NumPad'
import { useClosure } from '../presentation/useClosure'

// ─── splits-vrij ──────────────────────────────────────────────────────────────
// Open production: "Geef een splitsing van 5" — any valid split counts,
// 0-splits included. The nog-een tier (60) asks for a SECOND, different split
// while the first stays greyed on screen: variety made mechanical, the direct
// counter to one-split bias (defaulting to halves or "1 + rest" every time).
// Only the problem's total is used; which split the child produces is theirs.

const TIERS: ExerciseTier[] = [
  { id: 'vrij',    minScore: 35, label: 'vrij',       description: 'Produce any one valid split of the total (0-splits accepted). Open production — multiple correct answers.' },
  { id: 'nog-een', minScore: 60, label: 'nog een',    description: 'Produce a second split, different from the first (order-equivalent counts as the same); the first stays greyed as referent. Probes variety, not just validity.' },
]

interface SplitsVrijMeta {
  rounds: 1 | 2
  tierId: string
}

const splitEq = (a1: number, b1: number, a2: number, b2: number) =>
  (a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2)

function SlotPair({ a, b, active, greyed, tokens }: {
  a: string; b: string; active: 0 | 1 | null; greyed: boolean
  tokens: typeof NATURE_TOKENS
}) {
  const { ink, paper, paperMid, accent } = tokens
  const slot = (val: string, isActive: boolean, key: string) => (
    <span key={key} style={{
      minWidth: 50, height: 50,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: greyed ? paperMid : paper,
      color: val === '?' ? `${ink}45` : ink,
      border: `2px solid ${isActive ? accent : ink}`,
      borderRadius: 12, fontSize: 32, fontFamily: 'Fredoka One, cursive',
      opacity: greyed ? 0.55 : 1,
      boxShadow: isActive ? `inset 0 0 0 2px ${accent}` : 'none',
    }}>{val}</span>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', opacity: greyed ? 0.7 : 1 }}>
      {slot(a, active === 0, 'a')}
      <span style={{ color: tokens.ink, opacity: 0.6, fontSize: 26 }}>en</span>
      {slot(b, active === 1, 'b')}
    </div>
  )
}

function SplitsVrijComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsVrijMeta>) {
  const { operandA, operandB, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const total = operandA + operandB

  // digits entered so far: 2 per round
  const [digits, setDigits] = useState<number[]>([])
  const [firstSplit, setFirstSplit] = useState<[number, number] | null>(null)
  const [sameWarning, setSameWarning] = useState(false)

  useEffect(() => { setDigits([]); setFirstSplit(null); setSameWarning(false) }, [question])

  const inRound2 = firstSplit !== null
  // Closure: the completed statement(s) are held before the overlay.
  const { answered, resolve } = useClosure(question, onResolve)

  const handleKey = (key: string) => {
    if (disabled || answered) return
    if (sameWarning) setSameWarning(false)
    if (key === '⌫') { setDigits(d => d.slice(0, -1)); return }
    if (key === '✓') {
      if (digits.length !== 2) return
      const [a, b] = digits
      const valid = a + b === total
      if (!valid) { resolve(false, { givenAnswer: a }); return }
      if (meta.rounds === 1) { resolve(true, { givenAnswer: a }); return }
      if (!inRound2) {
        // first valid split banked; ask for a different one
        setFirstSplit([a, b])
        setDigits([])
        return
      }
      if (splitEq(firstSplit![0], firstSplit![1], a, b)) {
        setSameWarning(true)
        setDigits([])
      } else {
        resolve(true, { givenAnswer: a })
      }
      return
    }
    if (digits.length < 2) setDigits(d => [...d, parseInt(key, 10)])
  }

  const val = (i: number) => (digits.length > i ? String(digits[i]) : '?')
  const active = answered ? null : digits.length < 2 ? (digits.length as 0 | 1) : null

  // One-line prompts of the same band height, so the swap moves nothing.
  const prompt = inRound2 ? 'En nog een andere!' : `Geef een splitsing van ${total}!`

  // One statement row: "5 is ? en ?". `state` — active: being typed · banked:
  // the first split, greyed as referent · waiting: the second row before its
  // turn (laid out from the start, dimmed, so the stage never grows).
  const row = (state: 'active' | 'banked' | 'waiting', a: string, b: string) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive',
      opacity: state === 'waiting' ? 0.3 : 1, transition: 'opacity .25s',
    }}>
      <span style={{ color: state === 'active' ? tokens.accentText : tokens.ink, opacity: state === 'active' ? 1 : 0.5, fontSize: 38 }}>{total}</span>
      <span style={{ color: tokens.ink, opacity: state === 'active' ? 0.6 : 0.5, fontSize: 30 }}>is</span>
      <SlotPair a={a} b={b} active={state === 'active' ? active : null} greyed={state === 'banked'} tokens={tokens} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <ExerciseTitle tokens={tokens} warning={sameWarning ? 'Dat is dezelfde!' : undefined}>{prompt}</ExerciseTitle>

      {/* The statement(s) under construction. With two rounds both rows are on
          the stage from the start: the first becomes the greyed referent, the
          second lights up — nothing is added, nothing moves. */}
      <ExerciseStage tokens={tokens}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {meta.rounds === 1
            ? row('active', val(0), val(1))
            : inRound2 && firstSplit
              ? <>{row('banked', String(firstSplit[0]), String(firstSplit[1]))}{row('active', val(0), val(1))}</>
              : <>{row('active', val(0), val(1))}{row('waiting', '?', '?')}</>}
        </div>
      </ExerciseStage>

      <NumPad onKey={handleKey} disabled={disabled || answered} tokens={scene?.tokens} />
    </div>
  )
}

const SplitsVrij: ExerciseDefinition<SplitsVrijMeta> = {
  id: 'splits-vrij',
  label: 'Vrije splitsing',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Produce a splitsing on demand — open production with multiple correct answers, the strongest probe that the split table is available rather than only recognisable. The nog-een tier probes variety against one-split bias.',
    pitfalls: [
      'One-split bias — always halves or always "1 + rest"; the nog-een tier refuses a repeat, even order-flipped (a warning and another try — not counted wrong).',
      'Parts that don\'t sum to the total (production slip).',
    ],
    progression: 'vrij (35): one valid split, any choice. nog-een (60): a second split that must differ under order-equivalence, the first greyed as referent.',
  },
  retryStable: [],
  // Open production: any valid split is right, so no single statement to show.
  correctStatement: () => null,
  generateMeta(_operandA, _operandB, score) {
    const tier = pickTier(TIERS, score)
    return { rounds: tier.id === 'nog-een' ? 2 : 1, tierId: tier.id }
  },
  Component: SplitsVrijComponent,
}

registerExercise(SplitsVrij)
