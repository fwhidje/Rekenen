import type { CSSProperties, ReactNode } from 'react'
import { NATURE_TOKENS } from '../tokens'
import type { SceneTokens } from '../tokens'

// ─── Shared exercise shell ────────────────────────────────────────────────────
// The single source of truth for exercise chrome. Every exercise renders:
//   [ExerciseTitle]  — a separate cream band naming the task
//   [ExerciseStage]  — one paper card holding the exercise proper + animations +
//                      any drag / tap-the-stage interaction
//   [input]          — numpad / choice / true-false buttons, OUTSIDE the stage
// as siblings in the exercise's own centered column, so the spacing is uniform.
//
// `paper` and `cream` are identical across every theme (tokens.ts), so the shell
// colour stays constant regardless of scene. Colours come from tokens only — no
// palette constant lives here (theme-agnostic invariant, CLAUDE.md).

const SHADOW = '2px 4px 0 rgba(61,47,30,.12)'

interface PieceProps {
  children: ReactNode
  tokens?: SceneTokens
  style?: CSSProperties
}

// The title band — a cream chip above the stage. `children` is a ReactNode so
// exercises can colour operands inside the prompt.
export function ExerciseTitle({ children, tokens = NATURE_TOKENS, style }: PieceProps) {
  return (
    <div style={{
      background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
      padding: '8px 22px 10px', boxShadow: SHADOW,
      fontFamily: 'Fredoka One, cursive', fontSize: 24, color: tokens.ink,
      textAlign: 'center', ...style,
    }}>{children}</div>
  )
}

// The stage card — the one paper surface the exercise proper sits on. Callers
// pass `style` to set width / minWidth / overflowX for wide content (number
// lines, tables). Defaults match the reference exercises exactly.
export function ExerciseStage({ children, tokens = NATURE_TOKENS, style }: PieceProps) {
  return (
    <div style={{
      background: tokens.paper, border: `2px solid ${tokens.ink}`, borderRadius: 18,
      padding: '20px 24px', boxShadow: SHADOW,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      ...style,
    }}>{children}</div>
  )
}

interface FrameProps {
  title: ReactNode
  children: ReactNode
  tokens?: SceneTokens
  gap?: number
  titleStyle?: CSSProperties
  stageStyle?: CSSProperties
}

// Convenience wrapper: title band + stage in one centered column. For simple /
// new exercises whose input is a sibling rendered after the frame. Multi-phase
// exercises can compose ExerciseTitle + ExerciseStage directly instead.
export function ExerciseFrame({ title, children, tokens, gap = 18, titleStyle, stageStyle }: FrameProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap, width: '100%' }}>
      <ExerciseTitle tokens={tokens} style={titleStyle}>{title}</ExerciseTitle>
      <ExerciseStage tokens={tokens} style={stageStyle}>{children}</ExerciseStage>
    </div>
  )
}
