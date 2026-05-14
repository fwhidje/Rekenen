import { NATURE_TOKENS } from '../../presentation/tokens'
import type { SceneTokens } from '../../presentation/tokens'

interface Props {
  onPick:   (value: number) => void
  disabled: boolean
  tokens?:  SceneTokens
}

export function TFButtons({ onPick, disabled, tokens = NATURE_TOKENS }: Props) {
  const { ink, confirm, refuse } = tokens
  const buttons = [
    { value: 1, symbol: '✓', bg: confirm, label: 'WAAR' },
    { value: 0, symbol: '✗', bg: refuse,  label: 'NIET WAAR' },
  ]
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', maxWidth: 304, margin: '0 auto', width: '100%' }}>
      {buttons.map(({ value, symbol, bg, label }) => (
        <button key={value} onClick={() => !disabled && onPick(value)}
          onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
          onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
          style={{
            flex: 1, padding: '16px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontFamily: 'Fredoka One, cursive', background: bg, color: 'white',
            border: `2px solid ${ink}`, borderRadius: 20,
            boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
          }}>
          <span style={{ fontSize: 32 }}>{symbol}</span>
          <span style={{ fontSize: 12, letterSpacing: 0.4 }}>{label}</span>
        </button>
      ))}
    </div>
  )
}
