import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { DOT_POS } from '../presentation/diePatterns'
import { makeNumeralOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'

// ─── splitshuisje (production) ────────────────────────────────────────────────
// The house the child knows from splitsen-herken, but now WRITTEN: the roof
// gives the total, the child produces the room numerals. Noteren invariant:
// the parts are never visible anywhere — the roof die-aid is always an
// UNSPLIT, single-colour pattern (a colour-split roof would collapse this
// back into herken), and at most one part appears as a bare numeral.

const ROOM = 76
const HOUSE_W = ROOM * 2 + 6
const ROOF_H = 58

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

// Unsplit die-aid: one colour, deliberately NOT showing the split.
function PlainDie({ n, colour, size }: { n: number; colour: string; size: number }) {
  const positions = DOT_POS[n] ?? []
  const dot = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
          width: dot, height: dot, borderRadius: '50%', background: colour,
        }} />
      ))}
    </div>
  )
}

function House({ total, left, right, activeCell, dieAid, tokens }: {
  total: number
  left: string; right: string
  activeCell: 'left' | 'right' | null
  dieAid: boolean
  tokens: typeof NATURE_TOKENS
}) {
  const { ink, paper, dot, accent } = tokens
  const room = (val: string, active: boolean, key: string) => (
    <div key={key} style={{
      width: ROOM, height: ROOM, background: paper,
      border: `2px solid ${active ? accent : ink}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 40,
      color: val === '?' ? `${ink}55` : ink,
      boxShadow: active ? `inset 0 0 0 2px ${accent}` : 'none',
    }}>{val}</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: HOUSE_W, height: ROOF_H }}>
        <svg width={HOUSE_W} height={ROOF_H} style={{ position: 'absolute', inset: 0 }}>
          <polygon points={`${HOUSE_W / 2},2 2,${ROOF_H - 1} ${HOUSE_W - 2},${ROOF_H - 1}`} fill={paper} />
          <polyline points={`2,${ROOF_H - 1} ${HOUSE_W / 2},2 ${HOUSE_W - 2},${ROOF_H - 1} 2,${ROOF_H - 1}`}
            fill="none" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, paddingBottom: 4 }}>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: ink, lineHeight: 1 }}>{total}</span>
          {dieAid && <PlainDie n={total} colour={dot} size={30} />}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, borderTop: `2px solid ${ink}`, paddingTop: 0 }}>
        {room(left, activeCell === 'left', 'l')}
        {room(right, activeCell === 'right', 'r')}
      </div>
    </div>
  )
}

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

  useEffect(() => { setCells([]); setInput('') }, [question])

  const prompt = meta.tierId === 'twee-huisjes'
    ? 'Maak twee verschillende splitsingen!'
    : 'Vul het huisje in!'

  const resolveSingle = (v: number) => onResolve(v === missing, { givenAnswer: v })

  const handleKeySingle = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(''); return }
    if (key === '✓') { if (input) resolveSingle(parseInt(input, 10)); return }
    if (input.length < 1) setInput(key)
  }

  const handleKeyDouble = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setCells(c => c.slice(0, -1)); return }
    if (key === '✓') {
      if (cells.length === 4) {
        const [a1, b1, a2, b2] = cells
        const valid = a1 + b1 === total && a2 + b2 === total
        const different = !splitEq(a1, b1, a2, b2)
        onResolve(valid && different)
      }
      return
    }
    if (cells.length < 4) setCells(c => [...c, parseInt(key, 10)])
  }

  const cellVal = (i: number) => (cells.length > i ? String(cells[i]) : '?')
  const activeIdx = cells.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: tokens.ink,
      }}>{prompt}</div>

      {meta.tierId === 'twee-huisjes' ? (
        <>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            <House total={total} left={cellVal(0)} right={cellVal(1)}
              activeCell={activeIdx === 0 ? 'left' : activeIdx === 1 ? 'right' : null}
              dieAid={false} tokens={tokens} />
            <House total={total} left={cellVal(2)} right={cellVal(3)}
              activeCell={activeIdx === 2 ? 'left' : activeIdx === 3 ? 'right' : null}
              dieAid={false} tokens={tokens} />
          </div>
          <NumPad onKey={handleKeyDouble} disabled={disabled} tokens={scene?.tokens} />
        </>
      ) : (
        <>
          <House total={total}
            left={meta.givenSide === 'left' ? String(given) : (meta.tierId === 'één-kamer' ? '?' : (input || '?'))}
            right={meta.givenSide === 'right' ? String(given) : (meta.tierId === 'één-kamer' ? '?' : (input || '?'))}
            activeCell={meta.tierId === 'één-kamer' ? null : (meta.givenSide === 'left' ? 'right' : 'left')}
            dieAid={meta.tierId === 'één-kamer'} tokens={tokens} />
          {meta.tierId === 'één-kamer'
            ? <ChoiceButtons options={meta.options} onPick={resolveSingle} disabled={disabled} tokens={scene?.tokens} />
            : <NumPad onKey={handleKeySingle} disabled={disabled} tokens={scene?.tokens} />}
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
      'At twee-huisjes: producing the same split twice, possibly order-flipped (one-split bias — order-equivalent counts as the same).',
    ],
    progression: 'één-kamer: one room prefilled, unsplit die-aid in the roof, choice entry. één-kamer-kaal (30): aid gone, numpad — production from the numeral alone. twee-huisjes (60): two different splits of the same roof, pushing variety.',
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
  Component: SplitshuisjeComponent,
}

registerExercise(Splitshuisje)
