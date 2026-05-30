import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { TFButtons } from '../ui/components/TFButtons'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'confirm-total',   minScore: 0,  label: 'nog steeds?', description: 'Structured total appears (e.g. 5 dots arranged as 1+4). Dots animate — slide, regroup — into a different split (e.g. 2+3) and settle. Kid taps ja / nee to "is het nog steeds 5?". Always conservative; the diagnostic is whether the kid wrongly says nee.' },
  { id: 'verify-conserve', minScore: 30, label: 'klopt het nog?', description: 'Same ja/nee mechanic, but ~50% of animations are non-conservative — one dot quietly drops out or joins mid-shuffle, so the total actually changes. Kid has to track conservation, not just trust the gesture.' },
  { id: 'identify-new',    minScore: 60, label: 'welke nu?', description: 'Always conservative; after the shuffle, kid picks the new split from 4 choice tiles. Tracks both that the total stayed the same and what the new split is.' },
]

// ─── Animation constants ─────────────────────────────────────────────────────
const DOT_D = 30          // dot diameter
const DOT_G = 8           // intra-group gap
const GROUP_GE = 28       // between-group gap
const CONTAINER_W = 300
const CONTAINER_H = DOT_D + 16
const PHASE_DELAY = 700   // ms before transition kicks off
const SETTLE_DELAY = 1700 // ms after which inputs unlock
const TRANS_MS = 800

interface Dot {
  fromX: number; toX: number
  fromGroup: 'A' | 'B'; toGroup: 'A' | 'B'
  fromOp: number; toOp: number
}

function layoutXs(a: number, b: number): number[] {
  const xs: number[] = []
  for (let i = 0; i < a; i++) xs.push(i * (DOT_D + DOT_G))
  const rightStart = a > 0 ? a * (DOT_D + DOT_G) - DOT_G + GROUP_GE : 0
  for (let j = 0; j < b; j++) xs.push(rightStart + j * (DOT_D + DOT_G))
  if (xs.length === 0) return xs
  const totalW = xs[xs.length - 1] + DOT_D
  const offset = (CONTAINER_W - totalW) / 2
  return xs.map(x => x + offset)
}

function buildDots(initial: [number, number], final: [number, number]): Dot[] {
  const iN = initial[0] + initial[1]
  const fN = final[0] + final[1]
  const N = Math.max(iN, fN)
  const iXs = layoutXs(initial[0], initial[1])
  const fXs = layoutXs(final[0], final[1])
  const dots: Dot[] = []
  for (let s = 0; s < N; s++) {
    const inI = s < iN
    const inF = s < fN
    dots.push({
      fromX: inI ? iXs[s] : (inF ? fXs[s] : CONTAINER_W / 2 - DOT_D / 2),
      toX:   inF ? fXs[s] : (inI ? iXs[s] : CONTAINER_W / 2 - DOT_D / 2),
      fromGroup: inI ? (s < initial[0] ? 'A' : 'B') : (s < final[0] ? 'A' : 'B'),
      toGroup:   inF ? (s < final[0]   ? 'A' : 'B') : (s < initial[0] ? 'A' : 'B'),
      fromOp: inI ? 1 : 0,
      toOp:   inF ? 1 : 0,
    })
  }
  return dots
}

// ─── Split-options builder (identify-new) ────────────────────────────────────
function buildSplitOptions(correct: [number, number], total: number): [number, number][] {
  const candidates: [number, number][] = []
  for (const t of [total - 1, total, total + 1]) {
    if (t < 2 || t > 5) continue
    for (let i = 1; i < t; i++) candidates.push([i, t - i])
  }
  const seen = new Set<string>()
  const distractors = candidates.filter(([a, b]) => {
    if ((a === correct[0] && b === correct[1]) || (a === correct[1] && b === correct[0])) return false
    const key = `${Math.min(a, b)}+${Math.max(a, b)}-${a + b}`
    if (seen.has(key)) return false
    seen.add(key); return true
  })
  const picked = distractors.sort(() => Math.random() - 0.5).slice(0, 3)
  return [correct, ...picked].sort(() => Math.random() - 0.5)
}

function splitEq(p: [number, number], q: [number, number]): boolean {
  return (p[0] === q[0] && p[1] === q[1]) || (p[0] === q[1] && p[1] === q[0])
}

function pickDifferentSplitOfTotal(total: number, except: [number, number]): [number, number] {
  const candidates: [number, number][] = []
  for (let i = 1; i < total; i++) {
    const cand: [number, number] = [i, total - i]
    if (splitEq(cand, except)) continue
    candidates.push(cand)
  }
  if (candidates.length === 0) return except   // total 2/3 fallback
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// ─── Meta + component ────────────────────────────────────────────────────────

interface SplitsShuffleMeta {
  tierId: string
  initialTotal: number
  initialParts: [number, number]
  finalParts: [number, number]
  delta: number                       // finalTotal - initialTotal: 0 (conserve), -1 (dot dropped), +1 (dot joined)
  options: [number, number][] | null  // identify-new tier only
}

function SplitsShuffleComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsShuffleMeta>) {
  const { operandA, operandB, meta } = question
  const { tierId, initialTotal, initialParts, finalParts, delta, options } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream, accent, accentText, refuse, pop } = tokens

  const colourA = refuse
  const colourB = pop

  const [phase, setPhase] = useState<'initial' | 'final'>('initial')
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    setPhase('initial')
    setSettled(false)
    const t1 = setTimeout(() => setPhase('final'), PHASE_DELAY)
    const t2 = setTimeout(() => setSettled(true), SETTLE_DELAY)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [operandA, operandB, tierId])

  const dots = buildDots(initialParts, finalParts)

  const resolveBinary = (v: number) => {
    if (disabled) return
    const correctValue = delta === 0 ? 1 : 0
    onResolve(v === correctValue, { givenAnswer: v })
  }
  const resolveIdentify = (opt: [number, number]) => {
    if (disabled) return
    onResolve(splitEq(opt, finalParts), { givenAnswer: opt[0] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
        textAlign: 'center',
      }}>
        {tierId === 'identify-new'
          ? <>Welke splitsing nu?</>
          : <>Is het nog steeds <span style={{ color: accentText }}>{initialTotal}</span>?</>
        }
      </div>

      {/* Animated dot row */}
      <div style={{
        position: 'relative', width: CONTAINER_W, height: CONTAINER_H,
        background: paper, border: `2px solid ${ink}`, borderRadius: 14,
        overflow: 'hidden',
      }}>
        {dots.map((d, i) => {
          const x = phase === 'initial' ? d.fromX : d.toX
          const grp = phase === 'initial' ? d.fromGroup : d.toGroup
          const op = phase === 'initial' ? d.fromOp : d.toOp
          const colour = grp === 'A' ? colourA : colourB
          return (
            <div key={i} style={{
              position: 'absolute', left: 0, top: (CONTAINER_H - DOT_D) / 2,
              width: DOT_D, height: DOT_D, borderRadius: '50%',
              transform: `translateX(${x}px)`,
              background: colour, opacity: op,
              boxShadow: `0 2px 4px rgba(0,0,0,.18)`,
              transition: `transform ${TRANS_MS}ms ease, background-color ${TRANS_MS - 100}ms ease, opacity ${TRANS_MS - 200}ms ease`,
            }} />
          )
        })}
      </div>

      {/* Input — appears only after the animation has settled */}
      <div style={{
        opacity: settled ? 1 : 0, pointerEvents: settled ? 'auto' : 'none',
        transition: 'opacity .25s', width: '100%',
      }}>
        {tierId === 'identify-new' && options ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 320, margin: '0 auto', width: '100%' }}>
            {options.map((opt, i) => (
              <button key={i} onClick={() => resolveIdentify(opt)}
                onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.94)' }}
                onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
                style={{
                  padding: '14px 10px', fontFamily: 'Fredoka One, cursive', fontSize: 26,
                  background: paper, border: `2px solid ${ink}`, borderRadius: 16,
                  cursor: disabled ? 'default' : 'pointer',
                  boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
                  opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
                  color: ink,
                }}>
                <span style={{ color: colourA }}>{opt[0]}</span>
                <span style={{ opacity: 0.6 }}> + </span>
                <span style={{ color: colourB }}>{opt[1]}</span>
              </button>
            ))}
          </div>
        ) : (
          <TFButtons onPick={resolveBinary} disabled={disabled} tokens={scene?.tokens} />
        )}
      </div>

      {/* Hidden — token usage to silence unused lints */}
      <span style={{ display: 'none' }}>{accent}</span>
    </div>
  )
}

const SplitsShuffle: ExerciseDefinition<SplitsShuffleMeta> = {
  id: 'splits-shuffle',
  label: 'De stippen verhuizen',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Conservation under rearrangement — even though parts physically moved, the total didn\'t. The cognitive move is trust in the whole through change. Animation-driven; the medium is doing didactic work paper can\'t.',
    pitfalls: [
      'Says "nee, niet meer 5" because the arrangement looks different — conservation not yet stable.',
      'Recounts from 1 after the animation instead of trusting the move — the rearrangement was watched, not internalised.',
      'At identify-new, picks a split that\'s near the right one but wrong (e.g. 3+2 when it\'s 2+3 if order is tracked, or an adjacent split) — followed the motion partway, not all the way through.',
    ],
    progression: 'confirm-total (always conservative — calibrates trust in the move) → verify-conserve (some animations actually drop or add a dot, kid has to spot the trick) → identify-new (track conservation and read the new split — two cognitive moves at once).',
  },
  generateMeta(operandA, operandB, score) {
    const tierId = pickTier(TIERS, score).id
    const finalParts: [number, number] = [operandA, operandB]
    const finalTotal = operandA + operandB

    const conserve = tierId === 'verify-conserve' ? Math.random() < 0.5 : true

    let initialTotal: number
    let initialParts: [number, number]
    let delta: number

    if (conserve) {
      initialTotal = finalTotal
      delta = 0
      initialParts = pickDifferentSplitOfTotal(finalTotal, finalParts)
    } else {
      // delta = finalTotal - initialTotal. Pick -1 (dot dropped) or +1 (joined).
      const dropOne = finalTotal >= 3 && Math.random() < 0.5
      delta = dropOne ? -1 : 1
      initialTotal = finalTotal - delta
      if (initialTotal < 2 || initialTotal > 6) {
        delta = -delta
        initialTotal = finalTotal - delta
      }
      const ia = 1 + Math.floor(Math.random() * (initialTotal - 1))
      initialParts = [ia, initialTotal - ia]
    }

    const options = tierId === 'identify-new'
      ? buildSplitOptions(finalParts, finalTotal)
      : null

    return { tierId, initialTotal, initialParts, finalParts, delta, options }
  },
  Component: SplitsShuffleComponent,
}

registerExercise(SplitsShuffle)
