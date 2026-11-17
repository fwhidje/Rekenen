import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { FiveRow } from '../presentation/components/FiveRow'
import { ExerciseTitle } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── tien-paren ───────────────────────────────────────────────────────────────
// Number cards; tap two that make 10. A pair has to be recognised from either
// side, and "is this a pair?" is a judgement, not a calculation to finish.
// Found pairs lock in. A wrong pair ends the question.
//
// A card-grid exercise: the cards are their own background (no stage — the
// sanctioned exception of the exercise shell).

const TIERS: ExerciseTier[] = [
  { id: 'open',     minScore: 0,  label: 'met tienveld', description: 'Six cards, three pairs; every card carries a small tienveld, so the partner can be seen as the empty places.' },
  { id: 'getallen', minScore: 35, label: 'enkel getallen', description: 'Numbers only.' },
  { id: 'lokkers',  minScore: 60, label: 'met lokkers',  description: 'Eight cards: three pairs and two cards that belong to nobody. The last pair is no longer free.' },
]

interface TienParenMeta {
  cards: number[]
  tierId: string
}

const PAIRS: [number, number][] = [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]
const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5)

// The question's own pair, two other pairs, and — with decoys — one card from
// each of the two pairs that are NOT on the table (so it has no partner).
function deal(a: number, withDecoys: boolean): number[] {
  const own = PAIRS.find(p => p.includes(a)) ?? PAIRS[0]
  const others = shuffle(PAIRS.filter(p => p !== own))
  const onTable = [own, others[0], others[1]]
  const cards = onTable.flat()
  if (withDecoys) {
    for (const p of [others[2], others[3]]) cards.push(p[Math.floor(Math.random() * 2)])
  }
  return shuffle(cards)
}

function TienParenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<TienParenMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, accent, confirm } = tokens
  const { cards } = meta
  const showFrame = meta.tierId === 'open' || !!question.isRetry
  const pairsToFind = 3

  const [selected, setSelected] = useState<number | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [taps, setTaps] = useState(0)
  useEffect(() => { setSelected(null); setMatched([]); setTaps(0) }, [question])
  const { answered, resolve } = useClosure(question, onResolve)

  const tap = (i: number) => {
    if (disabled || answered || matched.includes(i)) return
    const n = taps + 1
    setTaps(n)
    if (selected === null) { setSelected(i); return }
    if (selected === i) { setSelected(null); return }
    if (cards[selected] + cards[i] !== 10) { resolve(false, { givenAnswer: cards[i], tapCount: n }); return }
    const next = [...matched, selected, i]
    setMatched(next)
    setSelected(null)
    if (next.length >= pairsToFind * 2) resolve(true, { tapCount: n })
  }

  const cols = cards.length > 6 ? 4 : 3
  const cardW = cols === 4 ? 74 : 92

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Welke twee maken 10?</ExerciseTitle>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap: 10 }}>
        {cards.map((v, i) => {
          const isMatched = matched.includes(i)
          const isSelected = selected === i
          const bg = isMatched ? confirm : isSelected ? accent : paper
          return (
            <button key={i} onClick={() => tap(i)}
              style={{
                width: cardW, height: showFrame ? 104 : 84, padding: 0, boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: bg, color: isMatched || isSelected ? 'white' : ink,
                border: `2px solid ${isMatched || isSelected ? bg : ink}`, borderRadius: 16,
                fontFamily: 'Fredoka One, cursive', fontSize: 36, lineHeight: 1,
                boxShadow: '0 2px 0 rgba(61,47,30,.18)', cursor: disabled || answered || isMatched ? 'default' : 'pointer',
                opacity: isMatched ? 0.6 : 1, transition: 'background .18s, opacity .3s', userSelect: 'none',
              }}>
              {v}
              {showFrame && (
                <FiveRow n={10} item={11} gap={1} renderItem={(k) => (
                  <div style={{
                    width: 9, height: 9, boxSizing: 'border-box', borderRadius: '50%',
                    background: k < v ? (isMatched || isSelected ? 'white' : tokens.refuse) : 'transparent',
                    border: `1.5px solid ${isMatched || isSelected ? 'white' : `${ink}88`}`,
                  }} />
                )} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const TienParen: ExerciseDefinition<TienParenMeta> = {
  id: 'tien-paren',
  label: 'Vrienden van 10 zoeken',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Recognise a tienvriend pair from either side and judge "do these two make 10?" — several pairs in one look, instead of one partner at a time.',
    pitfalls: [
      'The last pair is free (two real decisions) — until the lokkers tier adds two cards without a partner.',
      'Pairs that are one off (3 with 6, 4 with 7): the decoys are chosen from the pairs that are not on the table, so they sit next to a real partner.',
    ],
    progression: 'open: every card shows its number on a small tienveld. getallen (35): numbers only. lokkers (60): two extra cards that belong to nobody. A retry keeps the same cards and shows the small tienvelden.',
  },
  // Retry: the same cards.
  retryStable: ['cards'],
  correctStatement: q => splitText(10, q.operandA, q.operandB),
  isCompatible: (a, b) => a + b === 10 && a > 0 && b > 0,
  generateMeta(operandA, _b, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    return {
      cards: ctx?.retryOf?.cards ?? deal(operandA, tier.id === 'lokkers'),
      tierId: tier.id,
    }
  },
  Component: TienParenComponent,
}

registerExercise(TienParen)
