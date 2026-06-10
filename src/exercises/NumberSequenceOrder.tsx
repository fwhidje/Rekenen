import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'with-start', minScore: 0,  label: 'met startgetal', description: 'Strip with the starting numeral already placed; kid drags the other three numerals into ascending positions next to it.' },
  { id: 'gap-fill',   minScore: 30, label: 'gaten',          description: 'Consecutive run shown with one or two gaps; kid drags only the missing numerals into their slots — successor / predecessor with neighbours as anchors.' },
  { id: 'shuffle',    minScore: 55, label: 'door elkaar',    description: 'Full consecutive run shuffled — kid orders all four numerals from scratch, no anchors given.' },
  { id: 'sparse',     minScore: 75, label: 'losse getallen', description: 'Four non-consecutive numerals (e.g. 8, 3, 6, 5) ordered low→high — no successor chain to lean on; magnitude ordering proper. Comes alive in the 1–10 range.' },
]

const SLOT = 58
const DRAG = 58
const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo

interface NumberSequenceOrderMeta {
  tierId: string
  sequence: number[]    // the correct ascending run
  givenMask: boolean[]  // positions pre-filled (gap-fill); all false for shuffle
  options: number[]     // draggable tray values (shuffled)
}

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

// ─── Component ──────────────────────────────────────────────────────────────

function NumberSequenceOrderComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberSequenceOrderMeta>) {
  const { operandA, meta } = question
  const { tierId, sequence, givenMask, options } = meta
  const { ink, paper, cream, accent, accentText, confirm: confirm0 } = scene?.tokens ?? NATURE_TOKENS

  const [drag, setDrag] = useState<{ idx: number; value: number; x: number; y: number } | null>(null)
  const [placed, setPlaced] = useState<Record<number, number>>({})  // slotIndex → optionIdx
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => { setDrag(null); setPlaced({}) }, [operandA, tierId])

  const placedIndices = new Set(Object.values(placed))
  const emptyPositions = sequence.map((_, i) => i).filter(i => !givenMask[i])

  const allFilled = emptyPositions.every(i => placed[i] !== undefined)

  function attemptDrop(slot: number, optIdx: number) {
    if (givenMask[slot] || placed[slot] !== undefined) return
    setPlaced(prev => ({ ...prev, [slot]: optIdx }))
  }

  // Mistake recovery: tap a placed tile to send it back to the tray.
  function unplace(slot: number) {
    if (disabled || placed[slot] === undefined) return
    setPlaced(prev => {
      const next = { ...prev }
      delete next[slot]
      return next
    })
  }

  function confirm() {
    if (disabled || !allFilled) return
    const correct = emptyPositions.every(i => options[placed[i]] === sequence[i])
    onResolve(correct)
  }

  function handlePointerDown(e: React.PointerEvent, idx: number, value: number) {
    if (disabled || placedIndices.has(idx)) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ idx, value, x: e.clientX, y: e.clientY })
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return
    setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY } : null)
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (!drag) { setDrag(null); return }
    for (const [slotStr, el] of Object.entries(slotRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        attemptDrop(Number(slotStr), drag.idx)
        break
      }
    }
    setDrag(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>{tierId === 'gap-fill' ? 'Welk getal ontbreekt?' : 'Zet op volgorde'}</div>

      {/* Puzzle card — strip + tray on a clear panel */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '18px 20px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
      {/* Sequence strip */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {sequence.map((val, i) => {
          const given = givenMask[i]
          const placedIdx = placed[i]
          const hasPlaced = placedIdx !== undefined
          return (
            <div key={i}
              ref={el => { slotRefs.current[i] = el }}
              onClick={() => { if (!given && hasPlaced) unplace(i) }}
              style={{
                width: SLOT, height: SLOT, borderRadius: 12,
                border: given ? `2px solid ${ink}` : `2px dashed ${ink}88`,
                background: given ? cream : (hasPlaced ? `${accent}33` : 'transparent'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 30,
                color: given ? ink : accentText,
                cursor: !given && hasPlaced && !disabled ? 'pointer' : 'default',
              }}>
              {given ? val : hasPlaced ? options[placedIdx] : ''}
            </div>
          )
        })}
      </div>

      {/* Draggable tray */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', minHeight: DRAG }}>
        {options.map((val, idx) => {
          if (placedIndices.has(idx)) return <div key={idx} style={{ width: DRAG, height: DRAG }} />
          return (
            <div key={idx}
              onPointerDown={e => handlePointerDown(e, idx, val)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                width: DRAG, height: DRAG, background: paper, border: `2px solid ${ink}`, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 32, color: ink,
                cursor: disabled ? 'default' : 'grab', userSelect: 'none', touchAction: 'none',
                boxShadow: '0 2px 4px rgba(61,47,30,.18)',
                opacity: drag?.idx === idx ? 0.2 : 1, transition: 'opacity 0.1s',
              }}>{val}</div>
          )
        })}
      </div>
      </div>

      {/* Confirm — appears once every slot is filled; placed tiles can still
          be tapped back to the tray until then. */}
      <button onClick={confirm} disabled={disabled || !allFilled}
        style={{
          padding: '10px 32px', fontFamily: 'Fredoka One, cursive', fontSize: 22,
          background: allFilled ? confirm0 : `${ink}22`, color: 'white',
          border: `2px solid ${ink}`, borderRadius: 16,
          cursor: disabled || !allFilled ? 'default' : 'pointer',
          boxShadow: allFilled ? `0 2px 0 rgba(61,47,30,.18)` : 'none',
          opacity: disabled ? 0.45 : 1, userSelect: 'none', transition: 'background .2s',
        }}>✓ Klaar</button>

      {/* Floating drag ghost */}
      {drag && (
        <div style={{
          position: 'fixed', left: drag.x - DRAG / 2, top: drag.y - DRAG / 2,
          width: DRAG, height: DRAG, background: paper, border: `2px solid ${ink}`, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 32, color: ink,
          pointerEvents: 'none', zIndex: 9999, boxShadow: '0 6px 16px rgba(61,47,30,.28)',
          transform: 'scale(1.08)',
        }}>{drag.value}</div>
      )}
    </div>
  )
}

const NumberSequenceOrder: ExerciseDefinition<NumberSequenceOrderMeta> = {
  id: 'number-sequence-order',
  label: 'Zet de getallen op rij',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Tests stable number-word order (a telprincipe) and the successor / predecessor relation (buurgetallen). Works with numerals as ordered entities, not isolated symbols.',
    pitfalls: [
      'Brute visual sorting at the shuffle tier — arranges by token shape rather than by quantity-meaning.',
      'At gap-fill tier with no neighbouring labels, lacks an anchor and falls back to guessing.',
      'Reads the strip but can\'t decide whether 4 or 6 goes between 5 and 7 — written numerals not linked to quantities.',
    ],
    progression: 'with-start (start anchored, sort 3) → gap-fill (neighbours as anchors, fill 1–2 holes) → shuffle (order the full run from scratch) → sparse (non-consecutive numerals, pure magnitude ordering). The successor chain carries less and less of the work.',
  },
  generateMeta(operandA, _b, score) {
    const tierId = pickTier(TIERS, score).id
    const max = operandA <= 5 ? 5 : 10
    const len = Math.min(4, max)

    if (tierId === 'sparse') {
      // Four distinct, deliberately non-consecutive numerals; magnitude
      // ordering without a successor chain. Re-draw fully-consecutive sets.
      let values: number[]
      do {
        values = shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, len).sort((a, b) => a - b)
      } while (values.every((v, i) => i === 0 || v - values[i - 1] === 1))
      return { tierId, sequence: values, givenMask: values.map(() => false), options: shuffle(values) }
    }

    const start = rnd(1, max - len + 1)
    const sequence = Array.from({ length: len }, (_, i) => start + i)

    if (tierId === 'with-start') {
      const givenMask = sequence.map((_, i) => i === 0)
      return { tierId, sequence, givenMask, options: shuffle(sequence.slice(1)) }
    }

    if (tierId === 'shuffle') {
      return { tierId, sequence, givenMask: sequence.map(() => false), options: shuffle(sequence) }
    }

    // gap-fill: open 1–2 gaps, tray holds only the missing numerals.
    const gapCount = len >= 4 ? 2 : 1
    const gaps = new Set(shuffle(sequence.map((_, i) => i)).slice(0, gapCount))
    const givenMask = sequence.map((_, i) => !gaps.has(i))
    const options = shuffle([...gaps].map(i => sequence[i]))
    return { tierId, sequence, givenMask, options }
  },
  Component: NumberSequenceOrderComponent,
}

registerExercise(NumberSequenceOrder)
