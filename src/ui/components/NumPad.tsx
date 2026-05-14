interface Props {
  onKey: (key: string) => void
  disabled: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

const INK  = '#3d2f1e'
const PAPER      = '#fbf6e6'
const PAPER_DARK = '#ecdfbe'
const LEAF       = '#7a9a3a'

export function NumPad({ onKey, disabled }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxWidth: 296, margin: '0 auto', width: '100%' }}>
      {KEYS.map(k => {
        const isConfirm = k === '✓', isDelete = k === '⌫'
        return (
          <button key={k} onClick={() => !disabled && onKey(k)}
            onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            style={{
              padding: '15px 0', fontSize: isConfirm || isDelete ? 22 : 26,
              fontFamily: 'Fredoka One, cursive',
              background: isConfirm ? LEAF : isDelete ? PAPER_DARK : PAPER,
              color: isConfirm ? 'white' : INK,
              border: `2px solid ${INK}`,
              borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
              boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: disabled ? 0.45 : 1, userSelect: 'none', transition: 'transform .1s',
            }}>{k}</button>
        )
      })}
    </div>
  )
}
