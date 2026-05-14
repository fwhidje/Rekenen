const INK   = '#3d2f1e'
const PAPER = '#fbf6e6'

// Accent text colors pulled from the nature palette so numbers
// are distinct without bright backgrounds fighting the scene.
const ACCENTS = ['#c14b3a', '#4a6b2a', '#8a5a99', '#8a6840']

interface Props {
  options: number[]
  onPick: (value: number) => void
  disabled: boolean
}

export function ChoiceButtons({ options, onPick, disabled }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 304, margin: '0 auto', width: '100%' }}>
      {options.map((opt, i) => (
        <button key={opt} onClick={() => !disabled && onPick(opt)}
          onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          style={{
            padding: '18px 10px', fontFamily: 'Fredoka One, cursive', fontSize: 34,
            background: PAPER, color: ACCENTS[i % ACCENTS.length],
            border: `2px solid ${INK}`,
            borderRadius: 18,
            cursor: disabled ? 'default' : 'pointer',
            boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
            opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
          }}>{opt}</button>
      ))}
    </div>
  )
}
