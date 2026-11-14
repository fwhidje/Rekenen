import type { CSSProperties } from 'react'
import { NATURE_TOKENS } from '../tokens'
import type { SceneTokens } from '../tokens'

// The boxed answer slot of an equation or statement — one look everywhere:
//   empty  → paper box with a muted "?"
//   typed  → accent fill (the child's entry, not yet confirmed)
//   solved → confirm fill (the completed, correct statement held during the
//            closure — see presentation/useClosure.ts)
// `value` is what the child typed, or the correct answer once solved.
export function AnswerSlot({ value, solved = false, size = 52, tokens = NATURE_TOKENS, style }: {
  value: string | number | null | undefined
  solved?: boolean
  size?: number
  tokens?: SceneTokens
  style?: CSSProperties
}) {
  const filled = value !== null && value !== undefined && value !== ''
  const bg = solved ? tokens.confirm : filled ? tokens.accent : tokens.paper
  return (
    <span style={{
      minWidth: size, height: size, padding: '0 6px', boxSizing: 'border-box',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: bg,
      color: filled ? 'white' : `${tokens.ink}55`,
      border: `2px solid ${filled ? bg : tokens.paperMid}`,
      borderRadius: Math.round(size * 0.24),
      fontFamily: 'Fredoka One, cursive', fontSize: Math.round(size * 0.66), lineHeight: 1,
      transition: 'background .18s, border-color .18s',
      ...style,
    }}>{filled ? value : '?'}</span>
  )
}
