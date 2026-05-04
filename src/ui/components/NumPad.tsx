interface Props {
  onKey: (key: string) => void
  disabled: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export function NumPad({ onKey, disabled }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 296, margin: '0 auto', width: '100%' }}>
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
              background: isConfirm ? '#FF6B35' : isDelete ? '#EDEDED' : 'white',
              color: isConfirm ? 'white' : '#2D2D2D',
              border: isConfirm ? 'none' : '2px solid #ECECEC',
              borderRadius: 16, cursor: disabled ? 'default' : 'pointer',
              boxShadow: isConfirm ? '0 5px 16px rgba(255,107,53,.38)' : '0 2px 7px rgba(0,0,0,.07)',
              opacity: disabled ? 0.45 : 1, userSelect: 'none', transition: 'transform .1s',
            }}>{k}</button>
        )
      })}
    </div>
  )
}
