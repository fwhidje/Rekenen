interface Props {
  n: number
  color: string
  // How many dots (from the end) render crossed out — the wegnemen aid:
  // n drawn, `crossed` of them struck through, the remainder is the answer.
  crossed?: number
}

export function DotGroup({ n, color, crossed = 0 }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: n > 6 ? 152 : 118 }}>
      {Array.from({ length: n }).map((_, i) => {
        const isCrossed = i >= n - crossed
        return (
          <div key={i} style={{
            position: 'relative',
            width: 26, height: 26, borderRadius: '50%', background: color,
            boxShadow: `0 3px 8px ${color}66`,
            opacity: isCrossed ? 0.45 : 1,
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
      })}
    </div>
  )
}
