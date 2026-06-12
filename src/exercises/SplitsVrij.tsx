import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { NumPad } from '../ui/components/NumPad'

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

  useEffect(() => { setDigits([]); setFirstSplit(null) }, [question])

  const inRound2 = firstSplit !== null

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setDigits(d => d.slice(0, -1)); return }
    if (key === '✓') {
      if (digits.length !== 2) return
      const [a, b] = digits
      const valid = a + b === total
      if (!valid) { onResolve(false, { givenAnswer: a }); return }
      if (meta.rounds === 1) { onResolve(true, { givenAnswer: a }); return }
      if (!inRound2) {
        // first valid split banked; ask for a different one
        setFirstSplit([a, b])
        setDigits([])
        return
      }
      const different = !splitEq(firstSplit![0], firstSplit![1], a, b)
      onResolve(different, { givenAnswer: a })
      return
    }
    if (digits.length < 2) setDigits(d => [...d, parseInt(key, 10)])
  }

  const val = (i: number) => (digits.length > i ? String(digits[i]) : '?')
  const active = digits.length < 2 ? (digits.length as 0 | 1) : null

  const prompt = inRound2 ? 'Knap! En nog een ANDERE splitsing?' : `Geef een splitsing van ${total}!`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: tokens.ink,
      }}>{prompt}</div>

      {/* The statement under construction: "5 is ? en ?" */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {inRound2 && firstSplit && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive' }}>
            <span style={{ color: tokens.ink, opacity: 0.5, fontSize: 30 }}>{total} is</span>
            <SlotPair a={String(firstSplit[0])} b={String(firstSplit[1])} active={null} greyed tokens={tokens} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive' }}>
          <span style={{ color: tokens.accentText, fontSize: 38 }}>{total}</span>
          <span style={{ color: tokens.ink, opacity: 0.6, fontSize: 30 }}>is</span>
          <SlotPair a={val(0)} b={val(1)} active={active} greyed={false} tokens={tokens} />
        </div>
      </div>

      <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
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
      'One-split bias — always halves or always "1 + rest"; the nog-een tier makes this an actual error (a repeat, even order-flipped, is wrong).',
      'Parts that don\'t sum to the total (production slip).',
    ],
    progression: 'vrij (35): one valid split, any choice. nog-een (60): a second split that must differ under order-equivalence, the first greyed as referent.',
  },
  generateMeta(_operandA, _operandB, score) {
    const tier = pickTier(TIERS, score)
    return { rounds: tier.id === 'nog-een' ? 2 : 1, tierId: tier.id }
  },
  Component: SplitsVrijComponent,
}

registerExercise(SplitsVrij)
