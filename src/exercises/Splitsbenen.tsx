import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'

// ─── splitsbenen (production) ─────────────────────────────────────────────────
// The compact second notation: the total with two "legs" down to the parts.
// Introduced after the splitshuisje is familiar (weight silent until 25) —
// same fact, new clothes, which is itself the notation-transfer content.
// Noteren invariant: no visual shows the parts; one part at most as numeral.

const TIERS: ExerciseTier[] = [
  { id: 'been-keuze', minScore: 25, label: 'been kiezen',  description: 'One leg filled; the missing part is picked from four numerals. The benen shape itself is the new content.' },
  { id: 'been-pad',   minScore: 55, label: 'been intikken', description: 'Same shape, typed answer — production without options.' },
]

interface SplitsbenenMeta {
  givenSide: 'left' | 'right'
  options: number[]
  tierId: string
}

const SLOT = 56
const BENEN_W = 170
const LEG_H = 46

function Benen({ total, left, right, activeSide, tokens }: {
  total: number; left: string; right: string
  activeSide: 'left' | 'right' | null
  tokens: typeof NATURE_TOKENS
}) {
  const { ink, paper, accent } = tokens
  const cx = BENEN_W / 2
  const slot = (val: string, active: boolean) => (
    <div style={{
      width: SLOT, height: SLOT, background: paper,
      border: `2px solid ${active ? accent : ink}`, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 30,
      color: val === '?' ? `${ink}55` : ink,
      boxShadow: active ? `inset 0 0 0 2px ${accent}` : 'none',
    }}>{val}</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: SLOT + 8, height: SLOT + 2, background: paper,
        border: `2px solid ${ink}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fredoka One, cursive', fontSize: 34, color: ink,
      }}>{total}</div>
      <svg width={BENEN_W} height={LEG_H}>
        <line x1={cx} y1={2} x2={cx - (BENEN_W / 2 - SLOT / 2 - 4)} y2={LEG_H - 2} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx} y1={2} x2={cx + (BENEN_W / 2 - SLOT / 2 - 4)} y2={LEG_H - 2} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', gap: BENEN_W - 2 * SLOT - 16, justifyContent: 'center' }}>
        {slot(left, activeSide === 'left')}
        {slot(right, activeSide === 'right')}
      </div>
    </div>
  )
}

function SplitsbenenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsbenenMeta>) {
  const { operandA, operandB, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const total = operandA + operandB
  const given = meta.givenSide === 'left' ? operandA : operandB
  const missing = total - given
  const [input, setInput] = useState('')

  useEffect(() => { setInput('') }, [question])

  const resolve = (v: number) => onResolve(v === missing, { givenAnswer: v })

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(''); return }
    if (key === '✓') { if (input) resolve(parseInt(input, 10)); return }
    if (input.length < 1) setInput(key)
  }

  const missingDisplay = meta.tierId === 'been-pad' ? (input || '?') : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: tokens.ink,
      }}>Vul de splitsing aan!</div>

      <Benen total={total}
        left={meta.givenSide === 'left' ? String(given) : missingDisplay}
        right={meta.givenSide === 'right' ? String(given) : missingDisplay}
        activeSide={meta.tierId === 'been-pad' ? (meta.givenSide === 'left' ? 'right' : 'left') : null}
        tokens={tokens} />

      {meta.tierId === 'been-pad'
        ? <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
        : <ChoiceButtons options={meta.options} onPick={resolve} disabled={disabled} tokens={scene?.tokens} />}
    </div>
  )
}

const Splitsbenen: ExerciseDefinition<SplitsbenenMeta> = {
  id: 'splitsbenen',
  label: 'Splitsbenen',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'The same split fact in the second canonical notation — total with two legs down to the parts. Recognising and completing it is notation transfer: same structure, new clothes.',
    pitfalls: [
      'Echoing the total or the given leg instead of the complement.',
      'Reading the benen as unrelated boxes — not connecting the legs to the part-whole relation the huisje established.',
    ],
    progression: 'been-keuze (25): the shape is the new content, answer by choice. been-pad (55): typed production. Weight stays silent until 25 so the huisje lands first.',
  },
  generateMeta(operandA, operandB, score) {
    const tier = pickTier(TIERS, score)
    const givenSide = Math.random() < 0.5 ? 'left' : 'right'
    const total = operandA + operandB
    const missing = givenSide === 'left' ? operandB : operandA
    return {
      givenSide,
      options: makeNumeralOptions(missing, total, 0),
      tierId: tier.id,
    }
  },
  Component: SplitsbenenComponent,
}

registerExercise(Splitsbenen)
