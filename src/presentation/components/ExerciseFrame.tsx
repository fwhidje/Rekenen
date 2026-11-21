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
//
// `warning`: a short notice that temporarily takes the title's place ("Dat is
// dezelfde!"). It is drawn ON the band — the title keeps its box and is only
// hidden — so a warning never changes the band's size, whatever the title's
// length (convention L: nothing moves). One short line; it uses the accent
// colour (a hint, not an error).
export function ExerciseTitle({ children, tokens = NATURE_TOKENS, style, warning }: PieceProps & { warning?: ReactNode }) {
  const warn = warning !== undefined && warning !== null && warning !== false
  return (
    <div style={{
      position: 'relative',
      background: warn ? tokens.accent : tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
      padding: '8px 22px 10px', boxShadow: SHADOW,
      fontFamily: 'Fredoka One, cursive', fontSize: 24, color: tokens.ink,
      textAlign: 'center', transition: 'background .15s', ...style,
    }}>
      <div style={{ visibility: warn ? 'hidden' : 'visible' }}>{children}</div>
      {warn && (
        <div role="status" style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 10px', whiteSpace: 'nowrap',
        }}>{warning}</div>
      )}
    </div>
  )
}

// The stage card — the one paper surface the exercise proper sits on. Callers
// pass `style` to set width / minWidth / overflowX for wide content (number
// lines, tables). Defaults match the reference exercises exactly.
//
// `replay`: the ↻ button of convention V — see the animation again. It sits on
// the stage's top-right corner, outside the content, so it takes no space and
// can appear and go without moving anything (convention L). Show it only when
// the animation has finished and the question is not answered yet.
export function ExerciseStage({ children, tokens = NATURE_TOKENS, style, replay }: PieceProps & {
  replay?: { show: boolean; onClick: () => void }
}) {
  return (
    <div style={{
      background: tokens.paper, border: `2px solid ${tokens.ink}`, borderRadius: 18,
      padding: '20px 24px', boxShadow: SHADOW,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      ...style,
      ...(replay ? { position: 'relative' as const } : {}),
    }}>
      {children}
      {replay && <ReplayButton show={replay.show} onClick={replay.onClick} tokens={tokens} />}
    </div>
  )
}

// ↻ — a round badge on the stage's corner. 40 px plus a margin of invisible
// hit area. Hidden (not removed) while it may not be used.
export function ReplayButton({ show, onClick, tokens = NATURE_TOKENS }: { show: boolean; onClick: () => void; tokens?: SceneTokens }) {
  return (
    <button aria-label="Nog eens kijken" aria-hidden={!show} tabIndex={show ? 0 : -1}
      onClick={() => { if (show) onClick() }}
      style={{
        position: 'absolute', top: -14, right: -14, width: 40, height: 40, padding: 0,
        borderRadius: '50%', border: `2px solid ${tokens.ink}`, background: tokens.cream,
        boxShadow: SHADOW, color: tokens.ink, fontSize: 22, lineHeight: 1, fontFamily: 'system-ui, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: show ? 'pointer' : 'default', userSelect: 'none',
        opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none', transition: 'opacity .25s',
        zIndex: 2,
      }}>↻</button>
  )
}

// Reserved space: content that only becomes relevant later in a question (the
// answer buttons of a two-phase exercise, a second row) is laid out from the
// start and merely hidden, so nothing on screen moves when it appears
// (CLAUDE.md → Exercise behaviour conventions, "nothing moves"). Hidden content
// is not tappable and not read by assistive tech.
export function Reserve({ show, children, style }: { show: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <div aria-hidden={!show} style={{
      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      visibility: show ? 'visible' : 'hidden',
      pointerEvents: show ? 'auto' : 'none',
      ...style,
    }}>{children}</div>
  )
}

// The held look of a chosen card / tile / cell during the closure (convention
// C): the confirm colour as a thick frame. One look for every exercise whose
// options are cards rather than ChoiceButtons.
export function heldStyle(tokens: SceneTokens = NATURE_TOKENS): CSSProperties {
  return { borderColor: tokens.confirm, boxShadow: `0 0 0 3px ${tokens.confirm}`, opacity: 1 }
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
