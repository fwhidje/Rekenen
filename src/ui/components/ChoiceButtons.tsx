import { NATURE_TOKENS } from '../../presentation/tokens'
import type { SceneTokens } from '../../presentation/tokens'

interface Props {
  options:  number[]
  onPick:   (value: number) => void
  disabled: boolean
  tokens?:  SceneTokens
}

export function ChoiceButtons({ options, onPick, disabled, tokens = NATURE_TOKENS }: Props) {
  const { ink, paper, accents } = tokens
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 304, margin: '0 auto', width: '100%' }}>
      {options.map((opt, i) => (
        <button key={opt} onClick={() => !disabled && onPick(opt)}
          onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
          onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
          style={{
            padding: '18px 10px', fontFamily: 'Fredoka One, cursive', fontSize: 34,
            background: paper, color: accents[i % accents.length],
            border: `2px solid ${ink}`, borderRadius: 18,
            cursor: disabled ? 'default' : 'pointer',
            boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
            opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
          }}>{opt}</button>
      ))}
    </div>
  )
}
