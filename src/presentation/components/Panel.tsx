import type { CSSProperties, ReactNode } from 'react'

// Shared "scene panel" — the tinted card that holds an exercise's header,
// equation and visual, so the input (numpad / choice buttons) can sit outside
// it. The background comes from the theme (scene.containerBg); callers pass it
// in with their own fallback, keeping the component theme-agnostic.

interface Props {
  bg: string
  children: ReactNode
  style?: CSSProperties
}

export function Panel({ bg, children, style }: Props) {
  return (
    <div style={{
      background: bg,
      borderRadius: 20,
      padding: '18px 22px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      boxShadow: '0 4px 14px rgba(0,0,0,.10)',
      ...style,
    }}>
      {children}
    </div>
  )
}
