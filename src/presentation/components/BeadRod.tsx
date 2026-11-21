import { NATURE_TOKENS } from '../tokens'
import type { SceneTokens } from '../tokens'

// ─── The bead rod: one row of beads on a rod, split by a gap ─────────────────
// The picture of a split of 6–10: the beads before the gap have the first
// part's colour, the beads after it the second's. When `cut` changes the gap
// slides and the bead it passes changes colour. Used by splits-buren (the gap
// moves) and maak-tien (the ten split in two). A static quantity on one line,
// so convention Q's 5-row does not apply; with ten beads the two fives can
// still be read off the colours of a split at 5.

export const BEAD = 22
export const BEAD_GAP = 6

export function beadRodWidth(n: number, bead = BEAD, gap = BEAD_GAP) {
  return n * bead + (n - 1) * gap + 16
}

export function BeadRod({ n, cut, colA, colB, bead = BEAD, gap = BEAD_GAP, shownA = true, shownB = true, tokens = NATURE_TOKENS }: {
  n: number
  cut: number            // the gap sits after this many beads
  colA: string           // colour of the beads before the gap
  colB: string           // … and after it
  bead?: number
  gap?: number
  shownA?: boolean       // the beads before the gap are visible
  shownB?: boolean       // the beads after the gap are visible
  tokens?: SceneTokens
}) {
  const { ink } = tokens
  const w = beadRodWidth(n, bead, gap)
  return (
    <div style={{ position: 'relative', width: w, height: bead + 14 }}>
      {/* the rod, behind the beads */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 7 + bead / 2 - 2, height: 4, borderRadius: 2, background: `${ink}55` }} />
      {Array.from({ length: n }, (_, i) => {
        const before = i < cut
        return (
          <div key={i} style={{
            position: 'absolute', top: 7, left: 8 + i * (bead + gap), width: bead, height: bead, borderRadius: '50%',
            background: before ? colA : colB, boxShadow: '0 2px 3px rgba(0,0,0,.15)',
            opacity: (before ? shownA : shownB) ? 1 : 0,
            transition: 'background .5s ease .25s, opacity .35s',
          }} />
        )
      })}
      {/* the gap between the two parts: it moves, the beads stay */}
      <div style={{
        position: 'absolute', top: 0, left: 8 + cut * (bead + gap) - gap / 2 - 2, width: 4, height: bead + 14,
        background: ink, borderRadius: 2, transition: 'left .7s ease',
      }} />
    </div>
  )
}
