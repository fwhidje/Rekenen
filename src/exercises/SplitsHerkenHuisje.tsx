import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { NATURE_TOKENS } from '../presentation/tokens'

// ─── Constants ───────────────────────────────────────────────────────────────

const DOT_POS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}

const GREY = '#b9aa92'
const ROOM = 80
const HOUSE_W = ROOM * 2 + 6   // 2 rooms + 3 × 2px borders = 166px
const ROOF_H = 64
const DRAG = 68

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = 'die-both' | 'die-one' | 'die-numaid' | 'num-two'

interface SplitsHerkenHuisjeMeta {
  stage: Stage
  showA: boolean                       // which part is given in stages die-one / die-numaid
  givenRows: [number, number] | null   // given values (left side) for each row in num-two
  options: number[]                    // draggable values
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function DieDots({ count, colour, size }: { count: number; colour: string; size: number }) {
  const positions = DOT_POS[count] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%,-50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: colour,
        }} />
      ))}
    </div>
  )
}

function PartDie({ n, colour, ink, paper, size }: {
  n: number; colour: string; ink: string; paper: string; size: number
}) {
  return (
    <div style={{
      width: size, height: size, background: paper, border: `2px solid ${ink}`,
      borderRadius: Math.round(size * 0.15), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <DieDots count={n} colour={colour} size={size} />
    </div>
  )
}

function SplitPartDie({ n, splitAt, colourA, colourB, ink, paper, size }: {
  n: number; splitAt: number; colourA: string; colourB: string
  ink: string; paper: string; size: number
}) {
  const positions = DOT_POS[n] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{
      width: size, height: size, background: paper, border: `2px solid ${ink}`,
      borderRadius: Math.round(size * 0.15), flexShrink: 0, position: 'relative',
    }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%,-50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: i < splitAt ? colourA : colourB,
        }} />
      ))}
    </div>
  )
}

// ─── House roof ───────────────────────────────────────────────────────────────

function Roof({ total, operandA, colourA, colourB, stage, ink, paper }: {
  total: number; operandA: number; colourA: string; colourB: string
  stage: Stage; ink: string; paper: string
}) {
  const W = HOUSE_W, H = ROOF_H
  const content = stage === 'num-two'
    ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 34, color: ink }}>{total}</span>
        <PartDie n={total} colour={GREY} ink={ink} paper={paper} size={22} />
      </div>
    : stage === 'die-numaid'
      ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SplitPartDie n={total} splitAt={operandA} colourA={colourA} colourB={colourB} ink={ink} paper={paper} size={36} />
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 20, color: ink }}>{total}</span>
        </div>
      : <SplitPartDie n={total} splitAt={operandA} colourA={colourA} colourB={colourB} ink={ink} paper={paper} size={42} />

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon points={`${W / 2},2 2,${H - 1} ${W - 2},${H - 1}`} fill={paper} />
        <polyline
          points={`2,${H - 1} ${W / 2},2 ${W - 2},${H - 1} 2,${H - 1}`}
          fill="none" stroke={ink} strokeWidth={2} strokeLinejoin="round"
        />
      </svg>
      <div style={{
        position: 'absolute', bottom: 6, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {content}
      </div>
    </div>
  )
}

// ─── Room cell ────────────────────────────────────────────────────────────────

function RoomCell({ value, colour, isEmpty, isGiven, givenStyle, isLeft, ink, paper, refCb, tint }: {
  value: number; colour: string
  isEmpty: boolean; isGiven: boolean
  givenStyle: 'die' | 'num'
  isLeft: boolean; ink: string; paper: string
  refCb: (el: HTMLDivElement | null) => void
  tint: boolean   // colour tint on empty cell (stage 1)
}) {
  return (
    <div ref={refCb} style={{
      width: ROOM, height: ROOM,
      background: (isEmpty && tint) ? `${colour}25` : paper,
      borderRight: isLeft ? `2px solid ${ink}` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {isEmpty && (
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 26, color: `${colour}70` }}>?</span>
      )}
      {!isEmpty && isGiven && givenStyle === 'die' && (
        <PartDie n={value} colour={colour} ink={ink} paper={paper} size={54} />
      )}
      {!isEmpty && isGiven && givenStyle === 'num' && (
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: colour }}>{value}</span>
      )}
      {!isEmpty && !isGiven && (
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: colour }}>{value}</span>
      )}
    </div>
  )
}

// ─── Draggable item ───────────────────────────────────────────────────────────

function DragTile({ value, colour, ink, paper, variant, faded, onPD, onPM, onPU }: {
  value: number; colour: string; ink: string; paper: string
  variant: 'die' | 'num'
  faded: boolean
  onPD: (e: React.PointerEvent) => void
  onPM: (e: React.PointerEvent) => void
  onPU: (e: React.PointerEvent) => void
}) {
  return (
    <div
      onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU}
      style={{
        width: DRAG, height: DRAG,
        background: paper, border: `2px solid ${ink}`, borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, cursor: 'grab', userSelect: 'none', touchAction: 'none',
        boxShadow: '0 2px 4px rgba(61,47,30,.18)',
        opacity: faded ? 0.2 : 1, transition: 'opacity 0.1s',
      }}
    >
      {variant === 'die'
        ? <DieDots count={value} colour={colour} size={DRAG - 18} />
        : <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 32, color: ink }}>{value}</span>
      }
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

function SplitsHerkenHuisjeComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsHerkenHuisjeMeta>) {
  const { operandA, operandB, meta } = question
  const { stage, showA, givenRows, options } = meta
  const { ink, paper, cream, refuse, dot } = scene?.tokens ?? NATURE_TOKENS
  const total = operandA + operandB
  const colourA = refuse, colourB = dot

  // drag state: which option index, current pointer pos
  const [drag, setDrag] = useState<{ idx: number; value: number; x: number; y: number } | null>(null)
  // placed: roomId → option index
  const [placed, setPlaced] = useState<Record<string, number>>({})

  // Reset per-question state — the component is reused across questions.
  useEffect(() => {
    setDrag(null)
    setPlaced({})
  }, [operandA, operandB, showA, stage])
  const roomRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const placedIndices = new Set(Object.values(placed))

  const givenStyle: 'die' | 'num' = stage === 'die-both' || stage === 'die-one' ? 'die' : 'num'

  const dragVariant: 'die' | 'numdie' | 'num' =
    stage === 'die-both' || stage === 'die-one' ? 'die' : 'num'

  // Which colour for the empty room in stages die-one / die-numaid
  const unknownColour = showA ? colourB : colourA
  const knownColour   = showA ? colourA : colourB
  const knownVal      = showA ? operandA : operandB

  function attemptDrop(optIdx: number, optVal: number, roomId: string) {
    if (placed[roomId] !== undefined) return  // room already full
    const next = { ...placed, [roomId]: optIdx }
    setPlaced(next)

    if (stage === 'die-both') {
      if (next['left'] !== undefined && next['right'] !== undefined) {
        setTimeout(() => onResolve(true), 300)  // always correct: colour-coded
      }
    } else if (stage === 'die-one' || stage === 'die-numaid') {
      const emptyRoom = showA ? 'right' : 'left'
      if (roomId === emptyRoom) {
        setTimeout(() => onResolve(optVal === (showA ? operandB : operandA)), 300)
      }
    } else {
      // num-two
      if (givenRows === null) {
        // total=2 fallback: single row with room IDs 'left'/'right'
        const emptyRoom = showA ? 'right' : 'left'
        if (roomId === emptyRoom) {
          setTimeout(() => onResolve(optVal === (showA ? operandB : operandA)), 300)
        }
        return
      }
      if (roomId !== 'row0-right' && roomId !== 'row1-right') return
      const nextR0 = roomId === 'row0-right' ? optVal : options[placed['row0-right'] ?? -1]
      const nextR1 = roomId === 'row1-right' ? optVal : options[placed['row1-right'] ?? -1]
      if (next['row0-right'] !== undefined && next['row1-right'] !== undefined) {
        const b0 = total - givenRows[0], b1 = total - givenRows[1]
        setTimeout(() => onResolve(nextR0 === b0 && nextR1 === b1), 300)
      }
    }
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
    for (const [roomId, el] of Object.entries(roomRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        // Stage 1: colour-enforce (idx 0 = red = left, idx 1 = blue = right)
        if (stage === 'die-both') {
          const correct = (drag.idx === 0 && roomId === 'left') || (drag.idx === 1 && roomId === 'right')
          if (correct) attemptDrop(drag.idx, drag.value, roomId)
        } else {
          attemptDrop(drag.idx, drag.value, roomId)
        }
        break
      }
    }
    setDrag(null)
  }

  function roomCell(roomId: string, givenVal: number | null, colour: string, isLeft: boolean, tint = false) {
    const placedIdx = placed[roomId]
    const hasPlaced = placedIdx !== undefined
    const isEmpty = !hasPlaced && givenVal === null
    return (
      <RoomCell
        key={roomId}
        value={hasPlaced ? options[placedIdx] : (givenVal ?? 0)}
        colour={colour}
        isEmpty={isEmpty}
        isGiven={givenVal !== null && !hasPlaced}
        givenStyle={givenStyle}
        isLeft={isLeft} ink={ink} paper={paper}
        refCb={el => { roomRefs.current[roomId] = el }}
        tint={tint}
      />
    )
  }

  const roomsContent = stage === 'num-two' && givenRows
    ? <>
        <div style={{ display: 'flex', borderBottom: `2px solid ${ink}` }}>
          {roomCell('row0-left',  givenRows[0], colourA, true)}
          {roomCell('row0-right', null,         colourB, false)}
        </div>
        <div style={{ display: 'flex' }}>
          {roomCell('row1-left',  givenRows[1], colourA, true)}
          {roomCell('row1-right', null,         colourB, false)}
        </div>
      </>
    : <div style={{ display: 'flex' }}>
        {stage === 'die-both'
          ? <>
              {roomCell('left',  null, colourA, true,  true)}
              {roomCell('right', null, colourB, false, true)}
            </>
          : <>
              {roomCell(showA ? 'left'  : 'left',  showA ? operandA : null,    showA ? colourA : colourB, true)}
              {roomCell(showA ? 'right' : 'right', showA ? null : operandB, showA ? colourB : colourA, false)}
            </>
        }
      </div>

  // Fix the given-side room for die-one / die-numaid
  const fixedRoomsContent = stage === 'die-both' || stage === 'num-two'
    ? roomsContent
    : <div style={{ display: 'flex' }}>
        {showA
          ? <>{roomCell('left', knownVal,  colourA, true)}{roomCell('right', null, unknownColour, false)}</>
          : <>{roomCell('left', null, unknownColour, true)}{roomCell('right', knownVal, colourB, false)}</>
        }
      </div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        {stage === 'die-both'
          ? <>{total} is <span style={{ color: colourA }}>?</span> en <span style={{ color: colourB }}>?</span></>
          : <>{total} is <span style={{ color: knownColour }}>{knownVal}</span> en <span style={{ color: unknownColour }}>?</span></>}
      </div>

      {/* Puzzle card */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
      }}>
        {/* House */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Roof total={total} operandA={operandA} colourA={colourA} colourB={colourB} stage={stage} ink={ink} paper={paper} />
          <div style={{ border: `2px solid ${ink}`, borderTop: 'none' }}>
            {stage === 'die-both' || stage === 'num-two' ? roomsContent : fixedRoomsContent}
          </div>
        </div>

        {/* Draggable tray */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', minHeight: DRAG }}>
          {options.map((val, idx) => {
            if (placedIndices.has(idx)) return <div key={idx} style={{ width: DRAG, height: DRAG }} />
            const colour = stage === 'die-both'
              ? (idx === 0 ? colourA : colourB)
              : unknownColour
            return (
              <DragTile
                key={idx} value={val} colour={colour} ink={ink} paper={paper}
                variant={dragVariant}
                faded={drag?.idx === idx}
                onPD={e => handlePointerDown(e, idx, val)}
                onPM={handlePointerMove}
                onPU={handlePointerUp}
              />
            )
          })}
        </div>
      </div>

      {/* Floating drag ghost */}
      {drag && (
        <div style={{
          position: 'fixed',
          left: drag.x - DRAG / 2, top: drag.y - DRAG / 2,
          width: DRAG, height: DRAG,
          background: paper, border: `2px solid ${ink}`, borderRadius: 12,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, pointerEvents: 'none', zIndex: 9999,
          boxShadow: '0 6px 16px rgba(61,47,30,.28)',
          transform: 'scale(1.08)',
        }}>
          {dragVariant === 'die'
            ? <DieDots count={drag.value} colour={stage === 'die-both' ? (drag.idx === 0 ? colourA : colourB) : unknownColour} size={DRAG - 18} />
            : <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 32, color: ink }}>{drag.value}</span>
          }
        </div>
      )}
    </div>
  )
}

// ─── Definition ──────────────────────────────────────────────────────────────

function pickStage(score: number): Stage {
  if (score < 12) return 'die-both'
  if (score < 25) return 'die-one'
  if (score < 37) return 'die-numaid'
  return 'num-two'
}

function makeOptions3(correct: number, total: number): number[] {
  const pool = Array.from({ length: total + 1 }, (_, i) => i).filter(v => v !== correct)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return [...shuffled.slice(0, Math.min(2, pool.length)), correct].sort(() => Math.random() - 0.5)
}

function makeOptions4(b0: number, b1: number, total: number): number[] {
  const pool = Array.from({ length: total + 1 }, (_, i) => i).filter(v => v !== b0 && v !== b1)
  const distractor = pool[Math.floor(Math.random() * pool.length)]
  return [b0, b1, distractor].sort(() => Math.random() - 0.5)
}

const SplitsHerkenHuisje: ExerciseDefinition<SplitsHerkenHuisjeMeta> = {
  id: 'splits-herken-huisje',
  label: 'Splitshuisje herkennen',
  supportsReveal: false,
  isCompatible: (a, b) => a > 0 && b > 0,
  generateMeta(operandA, operandB, score) {
    const stage = pickStage(score)
    const total = operandA + operandB
    const showA = stage === 'die-both' ? true : Math.random() < 0.5

    if (stage === 'die-both') {
      return { stage, showA, givenRows: null, options: [operandA, operandB] }
    }

    if (stage === 'die-one' || stage === 'die-numaid') {
      const unknown = showA ? operandB : operandA
      return { stage, showA, givenRows: null, options: makeOptions3(unknown, total) }
    }

    // num-two: pick 2 distinct given values (left-side) from {1..total-1}
    const candidates = Array.from({ length: total - 1 }, (_, i) => i + 1)
    if (candidates.length < 2) {
      // total=2: only one split, fall back to single-row
      const unknown = showA ? operandB : operandA
      return { stage, showA, givenRows: null, options: makeOptions3(unknown, total) }
    }
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    const [a0, a1] = shuffled
    const b0 = total - a0, b1 = total - a1
    return { stage, showA: true, givenRows: [a0, a1], options: makeOptions4(b0, b1, total) }
  },
  Component: SplitsHerkenHuisjeComponent,
}

registerExercise(SplitsHerkenHuisje)
