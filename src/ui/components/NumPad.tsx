import { NATURE_TOKENS } from '../../presentation/tokens'
import type { SceneTokens } from '../../presentation/tokens'

interface Props {
  onKey:    (key: string) => void
  disabled: boolean
  // Shorter keys, for exercises whose stage is tall (a whole table) — the
  // question still has to fit the screen.
  compact?: boolean
  tokens?:  SceneTokens
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export function NumPad({ onKey, disabled, compact = false, tokens = NATURE_TOKENS }: Props) {
  const { ink, paper, paperMid, confirm } = tokens
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: compact ? 6 : 8, maxWidth: 296, margin: '0 auto', width: '100%' }}>
      {KEYS.map(k => {
        const isConfirm = k === '✓', isDelete = k === '⌫'
        return (
          <button key={k} onClick={() => !disabled && onKey(k)}
            onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
            style={{
              padding: compact ? '8px 0' : '15px 0', fontSize: isConfirm || isDelete ? 22 : compact ? 24 : 26,
              fontFamily: 'Fredoka One, cursive',
              background: isConfirm ? confirm : isDelete ? paperMid : paper,
              color: isConfirm ? 'white' : ink,
              border: `2px solid ${ink}`,
              borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
              boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: disabled ? 0.45 : 1, userSelect: 'none', transition: 'transform .1s',
            }}>{k}</button>
        )
      })}
    </div>
  )
}
