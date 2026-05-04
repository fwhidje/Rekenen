interface Props {
  onPick: (value: number) => void
  disabled: boolean
}

export function TFButtons({ onPick, disabled }: Props) {
  const buttons = [
    { value: 1, symbol: '✓', color: '#06D6A0', label: 'WAAR' },
    { value: 0, symbol: '✗', color: '#EF233C', label: 'NIET WAAR' },
  ]
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', maxWidth: 304, margin: '0 auto', width: '100%' }}>
      {buttons.map(({ value, symbol, color, label }) => (
        <button key={value} onClick={() => !disabled && onPick(value)}
          onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          style={{
            flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontFamily: 'Fredoka One, cursive', background: color, color: 'white', border: 'none', borderRadius: 20,
            boxShadow: `0 5px 16px ${color}55`, cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
          }}>
          <span style={{ fontSize: 32 }}>{symbol}</span>
          <span style={{ fontSize: 12, letterSpacing: 0.4 }}>{label}</span>
        </button>
      ))}
    </div>
  )
}
