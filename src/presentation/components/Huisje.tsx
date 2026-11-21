import { NATURE_TOKENS } from '../tokens'
import type { SceneTokens } from '../tokens'
import { DOT_POS } from '../diePatterns'

// ─── The splitshuisje ─────────────────────────────────────────────────────────
// The house notation, shared by every exercise that draws one: the whole on the
// roof, the two parts in the rooms. Each of the three places is a string, so a
// caller can leave one open ("?"), blank ("") or filled.
//
//   activeCell  the room being typed into (accent frame) — the noteren exercises
//   dieAid      a small UNSPLIT die pattern next to the roof number. One colour
//               on purpose: a colour-split roof would show the parts.
//   lit         places to light up — the numbers a sum is using right now
//   good        the place that holds the answer once it is solved (confirm fill)

export type HuisjeCell = 'roof' | 'left' | 'right'

const DIE_AID = 26

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

export function Huisje({ total, roof, left, right, activeCell = null, dieAid = false, lit, good = null, tokens = NATURE_TOKENS, room: ROOM_SIZE = 76 }: {
  room?: number
  total: number            // the whole (drives the die-aid)
  roof?: string            // what the roof shows; defaults to the total
  left: string; right: string
  activeCell?: 'left' | 'right' | null
  dieAid?: boolean
  lit?: Partial<Record<HuisjeCell, boolean>>
  good?: HuisjeCell | null
  tokens?: SceneTokens
}) {
  const { ink, paper, dot, accent, confirm } = tokens
  const HOUSE_W = ROOM_SIZE * 2 + 6
  const ROOF_H = Math.round(ROOM_SIZE * 0.76)
  const roofText = roof ?? String(total)

  const room = (val: string, cell: 'left' | 'right') => {
    const active = activeCell === cell
    const isGood = good === cell
    const isLit = !!lit?.[cell] && !isGood
    return (
      <div key={cell} style={{
        width: ROOM_SIZE, height: ROOM_SIZE, boxSizing: 'border-box',
        background: isGood ? confirm : isLit ? `${accent}33` : paper,
        border: `2px solid ${active || isLit ? accent : ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fredoka One, cursive', fontSize: Math.round(ROOM_SIZE * 0.53),
        color: isGood ? 'white' : val === '?' ? `${ink}55` : ink,
        boxShadow: active || isLit ? `inset 0 0 0 2px ${accent}` : 'none',
        transition: 'background .25s, box-shadow .25s, border-color .25s',
      }}>{val}</div>
    )
  }

  const roofGood = good === 'roof'
  const roofLit = !!lit?.roof && !roofGood
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: HOUSE_W, height: ROOF_H }}>
        <svg width={HOUSE_W} height={ROOF_H} style={{ position: 'absolute', inset: 0 }}>
          <polygon points={`${HOUSE_W / 2},2 2,${ROOF_H - 1} ${HOUSE_W - 2},${ROOF_H - 1}`}
            fill={roofGood ? confirm : roofLit ? `${accent}33` : paper} style={{ transition: 'fill .25s' }} />
          <polyline points={`2,${ROOF_H - 1} ${HOUSE_W / 2},2 ${HOUSE_W - 2},${ROOF_H - 1} 2,${ROOF_H - 1}`}
            fill="none" stroke={roofLit ? accent : ink} strokeWidth={roofLit ? 3 : 2} strokeLinejoin="round" />
        </svg>
        {/* The number sits in the middle of the roof. The die-aid stands to its
            right; an empty box of the same width on its left keeps the number
            centred (playtest, Nov 2026: with the aid it sat off-centre). */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingBottom: 4 }}>
          {dieAid && <div style={{ width: DIE_AID, flexShrink: 0 }} />}
          <span style={{
            fontFamily: 'Fredoka One, cursive', fontSize: Math.round(ROOM_SIZE * 0.37), lineHeight: 1,
            color: roofGood ? 'white' : roofText === '?' ? `${ink}55` : ink,
          }}>{roofText}</span>
          {dieAid && <PlainDie n={total} colour={dot} size={DIE_AID} />}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, borderTop: `2px solid ${ink}`, paddingTop: 0 }}>
        {room(left, 'left')}
        {room(right, 'right')}
      </div>
    </div>
  )
}
