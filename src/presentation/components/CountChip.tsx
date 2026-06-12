import { useEffect, useState } from 'react'

// Running count chip used by the action exercises (erbij-tap / wegneem-tap):
// starts at the GIVEN quantity — never counted from 1 — and bumps on every
// change, modelling counting on (or back) for the child.
export function CountChip({ count, ink, paper }: { count: number; ink: string; paper: string }) {
  const [bump, setBump] = useState(false)
  useEffect(() => {
    setBump(true)
    const t = setTimeout(() => setBump(false), 180)
    return () => clearTimeout(t)
  }, [count])
  return (
    <div style={{
      fontFamily: 'Fredoka One, cursive', fontSize: 22,
      color: ink, background: paper,
      border: `2px solid ${ink}`, borderRadius: 50,
      padding: '3px 16px', minWidth: 22, textAlign: 'center',
      transform: bump ? 'scale(1.18)' : 'scale(1)',
      transition: 'transform .15s ease',
    }}>{count}</div>
  )
}
