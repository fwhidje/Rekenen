import type { ComponentType } from 'react'
import type { Scene } from '../scenes'
import type { CounterProps } from '../nature/Counters'

interface Props {
  n: number
  scene: Scene
  // The theme creature. When provided, the group renders N of these instead of
  // the legacy emoji, so every exercise shows the same creature as the rest of
  // the app. Emoji (scene.e) is the fallback when no theme is available.
  Counter?: ComponentType<CounterProps>
  // How many items (from the end) render as crossed-out ghosts — the wegnemen
  // after-image: still countable as "what left", clearly no longer part of the
  // group. Mirrors DotGroup's crossed prop.
  crossed?: number
}

export function SceneGroup({ n, scene, Counter, crossed = 0 }: Props) {
  return (
    <div style={{
      background: scene.bg, borderRadius: 14, padding: '10px 12px',
      display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center',
      minWidth: 68, maxWidth: n > 6 ? 158 : 122,
      boxShadow: '0 4px 14px rgba(0,0,0,.18)',
    }}>
      {Array.from({ length: n }).map((_, i) => {
        const isCrossed = i >= n - crossed
        return (
          <span key={i} style={{
            position: 'relative',
            fontSize: 27, lineHeight: 1.1, display: 'inline-flex',
            filter: scene.dk ? 'drop-shadow(0 0 3px rgba(255,255,255,.25))' : 'none',
            opacity: isCrossed ? 0.4 : 1,
            transition: 'opacity .4s',
          }}>
            {Counter ? <Counter size={30} /> : scene.e}
            {isCrossed && (
              <span style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: 26, lineHeight: 1,
                color: scene.dk ? 'rgba(255,255,255,.85)' : 'rgba(40,30,20,.8)',
              }}>✕</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
