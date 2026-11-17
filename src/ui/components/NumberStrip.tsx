import { NATURE_TOKENS } from '../../presentation/tokens'
import type { SceneTokens } from '../../presentation/tokens'

// ─── NumberStrip: one tap on a number that is always in the same place ───────
// The answer input of the "know it" exercises (skill map → Exercise design for
// the next set, shared rule 2). Unlike ChoiceButtons there is nothing to search
// for — every number of the range sits at a fixed position — and no option set
// to guess from. Unlike the NumPad there is no confirm: one tap is the answer.
//
// Layout follows the 5-structure: 0 stands apart, 1–5 in a row, and for the
// tot-10 range 6–10 in a second row under them (6 under 1 … 10 under 5).
//
// `picked` marks the tapped number; with `solved` it takes the confirm colour
// and is held during the closure (convention C).

interface Props {
  max: 5 | 10
  onPick: (value: number) => void
  disabled: boolean
  picked?: number | null
  solved?: boolean
  tokens?: SceneTokens
}

export function NumberStrip({ max, onPick, disabled, picked = null, solved = false, tokens = NATURE_TOKENS }: Props) {
  const { ink, paper, accent, confirm } = tokens
  const rows = max === 10 ? 2 : 1

  const button = (n: number, row: number, col: number, spanRows = 1) => {
    const isPicked = picked === n
    const bg = isPicked ? (solved ? confirm : accent) : paper
    return (
      <button key={n} onClick={() => !disabled && onPick(n)}
        onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        style={{
          gridRow: `${row} / span ${spanRows}`, gridColumn: col,
          minHeight: 54, padding: 0,
          fontFamily: 'Fredoka One, cursive', fontSize: 28, lineHeight: 1,
          background: bg, color: isPicked ? 'white' : ink,
          border: `2px solid ${isPicked ? bg : ink}`, borderRadius: 14,
          cursor: disabled ? 'default' : 'pointer',
          boxShadow: '0 2px 0 rgba(61,47,30,.18)',
          // a disabled strip dims, but the picked number stays readable
          opacity: disabled && !isPicked ? 0.45 : 1,
          transition: 'transform .1s, background .18s', userSelect: 'none',
        }}>{n}</button>
    )
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: `repeat(${rows}, auto)`,
      gap: 6, width: '100%', maxWidth: 336, margin: '0 auto', boxSizing: 'border-box',
    }}>
      {button(0, 1, 1, rows)}
      {[1, 2, 3, 4, 5].map(n => button(n, 1, n + 1))}
      {max === 10 && [6, 7, 8, 9, 10].map(n => button(n, 2, n - 4))}
    </div>
  )
}
