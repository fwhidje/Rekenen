import type { CSSProperties, ReactNode } from 'react'

// ─── FiveRow: the layout for quantities that change ──────────────────────────
// Convention Q (CLAUDE.md → Exercise behaviour conventions): a group of things
// is drawn in one of two structured layouts — a die pattern (a quantity that
// stands still to be recognised: presentation/diePatterns.ts) or a 5-ROW (a
// quantity that is added to, taken from, tapped or crossed out). Never a
// free-wrapping cluster: "4 as 3-over-1" teaches nothing and invites counting
// by ones.
//
// A 5-row has five positions per row, filled left to right; 6–10 continue on a
// second row, so 7 reads as 5 and 2. Every position has a fixed size, so an
// item that appears, fades or is crossed out never moves its neighbours.
//
// `total` reserves positions beyond `n` (a group that will grow: erbij-tap's
// row is sized for start + arrivals from the first frame).

export const FIVE = 5

export function fiveRowSize(count: number, item: number, gap: number): { width: number; height: number } {
  const cols = Math.max(1, Math.min(count, FIVE))
  const rows = Math.max(1, Math.ceil(count / FIVE))
  return { width: cols * item + (cols - 1) * gap, height: rows * item + (rows - 1) * gap }
}

export function FiveRow({ n, item, gap = 6, total, renderItem, style }: {
  n: number
  item: number                 // side of one position, px
  gap?: number
  total?: number               // positions to reserve (≥ n); defaults to n
  renderItem: (index: number) => ReactNode
  style?: CSSProperties
}) {
  const count = Math.max(n, total ?? n)
  const { width, height } = fiveRowSize(count, item, gap)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.max(1, Math.min(count, FIVE))}, ${item}px)`,
      gridAutoRows: `${item}px`,
      gap, width, height, flexShrink: 0,
      ...style,
    }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ width: item, height: item, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderItem(i)}
        </div>
      ))}
    </div>
  )
}
