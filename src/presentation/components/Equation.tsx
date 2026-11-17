import type { CSSProperties } from 'react'
import { NATURE_TOKENS } from '../tokens'
import type { SceneTokens } from '../tokens'

// ─── Equation: "x ± y = res" with one place open ─────────────────────────────
// One look for the sums of the family exercises (puntoefening, omkeer-som,
// teken-kiezen, numberline-gap, …), where the open place is not always the
// result. The open place shows "?" until `solved`, then the `fill` value in the
// confirm colour (convention C: the completed statement is held).
//
//   hole    which place is open: 'x' | 'y' | 'res' | 'sign' | null (none)
//   fill    what the open place holds once solved (defaults to its own value)
//   shown   how much of the sum is on screen: 1 = x, 2 = + sign and y,
//           3 = "= res" as well. Hidden pieces keep their place.

export type EqHole = 'x' | 'y' | 'res' | 'sign' | null
export type EqSign = '+' | '-'

const glyph = (s: EqSign) => (s === '-' ? '−' : '+')

export function Equation({ x, sign, y, res, hole = 'res', solved = false, shown = 3, size = 34, dim = false, tokens = NATURE_TOKENS, style }: {
  x: number; sign: EqSign; y: number; res: number
  hole?: EqHole
  solved?: boolean
  shown?: number
  size?: number
  dim?: boolean
  tokens?: SceneTokens
  style?: CSSProperties
}) {
  const signColor = sign === '-' ? tokens.refuse : tokens.confirm
  const piece = (key: Exclude<EqHole, null>, text: string | number, color: string, need: number, extra?: CSSProperties) => {
    const open = hole === key
    return (
      <span style={{
        color: open ? (solved ? tokens.confirm : tokens.accentText) : color,
        opacity: shown >= need ? 1 : 0, transition: 'opacity .3s, color .2s',
        minWidth: Math.round(size * 0.6), textAlign: 'center', display: 'inline-block', ...extra,
      }}>{open && !solved ? (key === 'sign' ? '○' : '?') : text}</span>
    )
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: Math.round(size * 0.22), height: Math.round(size * 1.3),
      fontFamily: 'Fredoka One, cursive', fontSize: size, lineHeight: 1,
      opacity: dim ? 0.5 : 1, transition: 'opacity .3s', ...style,
    }}>
      {piece('x', x, tokens.accentText, 1)}
      {piece('sign', glyph(sign), signColor, 2)}
      {piece('y', y, tokens.pop, 2)}
      <span style={{ color: tokens.ink, opacity: shown >= 3 ? 0.4 : 0, fontSize: Math.round(size * 0.85), transition: 'opacity .3s' }}>=</span>
      {piece('res', res, tokens.accentText, 3)}
    </div>
  )
}

// The same statement as text, for the wrong-answer overlay.
export function eqText(x: number, sign: EqSign, y: number, res: number): string {
  return `${x} ${glyph(sign)} ${y} = ${res}`
}
