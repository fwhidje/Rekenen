import { NATURE_TOKENS } from '../../presentation/tokens'
import type { SceneTokens } from '../../presentation/tokens'

interface Props {
  options:  number[]
  onPick:   (value: number) => void
  disabled: boolean
  // Closure (convention C): the option the child chose, and whether it was
  // right. A solved pick takes the confirm colour and stays fully visible
  // while the rest dims — the completed answer held before the overlay.
  picked?:  number | null
  solved?:  boolean
  tokens?:  SceneTokens
}

export function ChoiceButtons({ options, onPick, disabled, picked = null, solved = false, tokens = NATURE_TOKENS }: Props) {
  const { ink, paper, accents, confirm } = tokens
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 304, margin: '0 auto', width: '100%' }}>
      {options.map((opt, i) => {
        const held = solved && opt === picked
        return (
          <button key={opt} onClick={() => !disabled && onPick(opt)}
            onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
            style={{
              padding: '18px 10px', fontFamily: 'Fredoka One, cursive', fontSize: 34,
              background: held ? confirm : paper, color: held ? 'white' : accents[i % accents.length],
              border: `2px solid ${held ? confirm : ink}`, borderRadius: 18,
              cursor: disabled ? 'default' : 'pointer',
              boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: held ? 1 : disabled ? 0.45 : 1,
              transition: 'transform .1s, background .15s', userSelect: 'none',
            }}>{opt}</button>
        )
      })}
    </div>
  )
}
