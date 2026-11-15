import { FiveRow } from './FiveRow'

interface Props {
  n: number
  color: string
  // How many dots (from the end) render crossed out — the wegnemen aid:
  // n drawn, `crossed` of them struck through, the remainder is the answer.
  crossed?: number
}

// A group of dots as a 5-row (convention Q — see FiveRow).
export function DotGroup({ n, color, crossed = 0 }: Props) {
  return (
    <FiveRow n={n} item={26} gap={6} renderItem={(i) => {
      const isCrossed = i >= n - crossed
      return (
        <div style={{
          position: 'relative',
          width: 26, height: 26, borderRadius: '50%', background: color,
          boxShadow: `0 3px 8px ${color}66`,
          opacity: isCrossed ? 0.45 : 1,
          transition: 'opacity .4s',
        }}>
          {isCrossed && (
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 24, lineHeight: 1,
              color: 'rgba(40,30,20,.75)',
            }}>✕</span>
          )}
        </div>
      )
    }} />
  )
}
