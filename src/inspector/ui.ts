import type { CSSProperties } from 'react'

// ─── Inspector styling ────────────────────────────────────────────────────────
// A plain grown-up look, deliberately not the kid theme: this is a tool.

export const C = {
  bg: '#F4F2EE',
  card: '#FFFFFF',
  line: '#E4E0D8',
  ink: '#2B2620',
  muted: '#7A7268',
  accent: '#2F7FB8',
  good: '#1E8A5A',
  bad: '#C23B22',
  flag: '#E8A100',
  select: '#E8F1F8',
}

export const card: CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  padding: 14,
}

export const input: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '7px 9px',
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  fontFamily: 'Nunito, sans-serif',
  fontSize: 14,
  background: 'white',
  color: C.ink,
}

export function btn(kind: 'primary' | 'quiet'): CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'Nunito, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    border: kind === 'primary' ? 'none' : `1px solid ${C.line}`,
    background: kind === 'primary' ? C.accent : 'white',
    color: kind === 'primary' ? 'white' : C.ink,
    display: 'inline-block',
  }
}

export const mono: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 12,
}
