import { NATURE_TOKENS } from '../../presentation/tokens'
import type { SceneTokens } from '../../presentation/tokens'

// ─── "✓ Klaar": the confirm button of the build-it-yourself exercises ─────────
// For exercises whose answer is something the child builds on the stage (a
// filled ten-frame, an ordered row) rather than a number they pick or type.
// Greyed until there is something to confirm; one look everywhere.

export function KlaarButton({ onClick, enabled, tokens = NATURE_TOKENS }: {
  onClick: () => void
  enabled: boolean
  tokens?: SceneTokens
}) {
  const { ink, confirm } = tokens
  return (
    <button onClick={() => enabled && onClick()} disabled={!enabled}
      onPointerDown={e => { if (enabled) e.currentTarget.style.transform = 'scale(0.94)' }}
      onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
      style={{
        padding: '12px 36px', fontFamily: 'Fredoka One, cursive', fontSize: 24,
        background: enabled ? confirm : `${ink}22`, color: 'white',
        border: `2px solid ${ink}`, borderRadius: 16,
        cursor: enabled ? 'pointer' : 'default',
        boxShadow: enabled ? '0 2px 0 rgba(61,47,30,.18)' : 'none',
        userSelect: 'none', transition: 'transform .1s, background .2s',
      }}>✓ Klaar</button>
  )
}
