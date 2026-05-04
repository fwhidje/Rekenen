const COLORS = ['#4CC9F0', '#9B5DE5', '#FF6B35', '#06D6A0']

interface Props {
  options: number[]
  onPick: (value: number) => void
  disabled: boolean
}

export function ChoiceButtons({ options, onPick, disabled }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 304, margin: '0 auto', width: '100%' }}>
      {options.map((opt, i) => {
        const color = COLORS[i % COLORS.length]
        return (
          <button key={opt} onClick={() => !disabled && onPick(opt)}
            onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            style={{
              padding: '18px 10px', fontFamily: 'Fredoka One, cursive', fontSize: 34,
              background: color, color: 'white', border: 'none', borderRadius: 18,
              cursor: disabled ? 'default' : 'pointer',
              boxShadow: `0 5px 16px ${color}55`,
              opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
            }}>{opt}</button>
        )
      })}
    </div>
  )
}
