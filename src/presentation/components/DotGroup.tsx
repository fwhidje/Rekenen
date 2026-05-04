interface Props {
  n: number
  color: string
}

export function DotGroup({ n, color }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: n > 6 ? 152 : 118 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          width: 26, height: 26, borderRadius: '50%', background: color,
          boxShadow: `0 3px 8px ${color}66`,
        }} />
      ))}
    </div>
  )
}
