import type { Scene } from '../scenes'

interface Props {
  n: number
  scene: Scene
}

export function SceneGroup({ n, scene }: Props) {
  return (
    <div style={{
      background: scene.bg, borderRadius: 14, padding: '10px 12px',
      display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center',
      minWidth: 68, maxWidth: n > 6 ? 158 : 122,
      boxShadow: '0 4px 14px rgba(0,0,0,.18)',
    }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{
          fontSize: 27, lineHeight: 1.1, display: 'inline-block',
          filter: scene.dk ? 'drop-shadow(0 0 3px rgba(255,255,255,.25))' : 'none',
        }}>{scene.e}</span>
      ))}
    </div>
  )
}
