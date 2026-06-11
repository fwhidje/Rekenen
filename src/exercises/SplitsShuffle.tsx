import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { TFButtons } from '../ui/components/TFButtons'
import { NATURE_TOKENS } from '../presentation/tokens'

// A WHOLE visibly splits: the original row of dots stays in place (greyed once
// the split starts) while a copy animates apart into two coloured groups below.
// The grey original is the referent — verification is a visual comparison
// against the visible whole, not a memory test.

const TIERS: ExerciseTier[] = [
  { id: 'kijk',            minScore: 0,  label: 'kijk',          description: 'Watch the whole split into two groups (original stays greyed above). "Nog steeds 5?" — always ja; orientation in the part-whole move.' },
  { id: 'klopt-het',       minScore: 30, label: 'klopt het?',    description: 'Same animation, but ~50% of rounds a dot drops out or sneaks in mid-split. The kid verifies against the greyed original — conservation as comparison.' },
  { id: 'welke-splitsing', minScore: 60, label: 'welke splitsing', description: 'Always conserving; after the split the kid picks the resulting split from 4 tiles (distractors include wrong-total splits).' },
]

// ─── Animation constants ─────────────────────────────────────────────────────
const DOT_D = 30          // dot diameter
const DOT_G = 8           // intra-group gap
const GROUP_GE = 28       // between-group gap
const CONTAINER_W = 300
const ROW2_Y = DOT_D + 30 // y of the split row (original sits at y = 0)
const CONTAINER_H = ROW2_Y + DOT_D + 14
const PHASE_DELAY = 800   // ms before the split kicks off
const SETTLE_DELAY = 1900 // ms after which inputs unlock
const TRANS_MS = 850

interface Dot {
  fromX: number; toX: number
  toGroup: 'A' | 'B'
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

// Whole (total dots, one row) → final split (a', b'); a delta dot fades out
// (drop) or in (join) along the way.
function buildDots(total: number, final: [number, number]): Dot[] {
  const fN = final[0] + final[1]
  const N = Math.max(total, fN)
  const wXs = layoutXs(total, 0)
  const fXs = layoutXs(final[0], final[1])
  const dots: Dot[] = []
  for (let s = 0; s < N; s++) {
    const inWhole = s < total
    const inFinal = s < fN
    dots.push({
      fromX: inWhole ? wXs[s] : (inFinal ? fXs[s] : CONTAINER_W / 2 - DOT_D / 2),
      toX:   inFinal ? fXs[s] : (inWhole ? wXs[s] : CONTAINER_W / 2 - DOT_D / 2),
      toGroup: s < final[0] ? 'A' : 'B',
      fromOp: inWhole ? 1 : 0,
      toOp:   inFinal ? 1 : 0,
    })
  }
  return dots
}

// ─── Split-options builder (welke-splitsing) ─────────────────────────────────
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

// ─── Meta + component ────────────────────────────────────────────────────────

interface SplitsShuffleMeta {
  tierId: string
  total: number                       // the original whole
  finalParts: [number, number]        // the resulting groups (sum = total + delta)
  delta: number                       // 0 (conserve), -1 (dot dropped), +1 (dot joined)
  options: [number, number][] | null  // welke-splitsing tier only
}

function SplitsShuffleComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsShuffleMeta>) {
  const { operandA, operandB, meta } = question
  const { tierId, total, finalParts, delta, options } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream, dot, refuse, pop } = tokens

  const [phase, setPhase] = useState<'initial' | 'split'>('initial')
  const [settled, setSettled] = useState(false)
  const [dots, setDots] = useState<Dot[]>([])

  useEffect(() => {
    setPhase('initial')
    setSettled(false)
    setDots(buildDots(total, finalParts))
    const t1 = setTimeout(() => setPhase('split'), PHASE_DELAY)
    const t2 = setTimeout(() => setSettled(true), SETTLE_DELAY)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [operandA, operandB, tierId, total, finalParts])

  const resolveBinary = (v: number) => {
    if (disabled || !settled) return
    onResolve(v === (delta === 0 ? 1 : 0))
  }
  const resolveIdentify = (opt: [number, number]) => {
    if (disabled || !settled) return
    onResolve(splitEq(opt, finalParts), { givenAnswer: opt[0] })
  }

  const header = !settled
    ? 'Kijk goed!'
    : tierId === 'welke-splitsing'
      ? 'Welke splitsing zie je?'
      : <>Nog steeds <span style={{ color: dot }}>{total}</span>?</>

  const wholeXs = layoutXs(total, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink, minHeight: 30,
      }}>{header}</div>

      {/* Stage: greyed original on top, the split animates below it */}
      <div style={{
        position: 'relative', width: CONTAINER_W, height: CONTAINER_H,
        background: paper, border: `2px solid ${ink}`, borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Original whole — stays put, fades to grey as the split starts */}
        {wholeXs.map((x, i) => (
          <div key={`o${i}`} style={{
            position: 'absolute', left: 0, top: 8,
            width: DOT_D, height: DOT_D, borderRadius: '50%',
            transform: `translateX(${x}px)`,
            background: phase === 'initial' ? dot : ink,
            opacity: phase === 'initial' ? 1 : 0.18,
            transition: `background-color ${TRANS_MS}ms ease, opacity ${TRANS_MS}ms ease`,
          }} />
        ))}

        {/* The split: a copy flies apart into two coloured groups */}
        {phase === 'split' && dots.map((d, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, top: 8,
            width: DOT_D, height: DOT_D, borderRadius: '50%',
            transform: `translate(${d.toX}px, ${ROW2_Y}px)`,
            background: d.toGroup === 'A' ? refuse : pop,
            opacity: d.toOp,
            boxShadow: `0 2px 4px rgba(0,0,0,.18)`,
            // start state via inline keyframe-less trick: initial render of this
            // element happens at phase flip, so animate from the whole position
            animation: `shuffle-fly-${i} ${TRANS_MS}ms ease both`,
          }} />
        ))}
        {phase === 'split' && (
          <style>{dots.map((d, i) => `
            @keyframes shuffle-fly-${i} {
              from { transform: translate(${d.fromX}px, 0px); opacity: ${d.fromOp}; }
              to   { transform: translate(${d.toX}px, ${ROW2_Y}px); opacity: ${d.toOp}; }
            }`).join('\n')}</style>
        )}
      </div>

      {/* Input — appears only after the animation has settled */}
      <div style={{
        opacity: settled ? 1 : 0, pointerEvents: settled ? 'auto' : 'none',
        transition: 'opacity .25s', width: '100%',
      }}>
        {tierId === 'welke-splitsing' && options ? (
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
                <span style={{ color: refuse }}>{opt[0]}</span>
                <span style={{ opacity: 0.6 }}> + </span>
                <span style={{ color: pop }}>{opt[1]}</span>
              </button>
            ))}
          </div>
        ) : (
          <TFButtons onPick={resolveBinary} disabled={disabled} tokens={scene?.tokens} />
        )}
      </div>
    </div>
  )
}

const SplitsShuffle: ExerciseDefinition<SplitsShuffleMeta> = {
  id: 'splits-shuffle',
  label: 'De stippen splitsen',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'The part-whole move, animated: a whole visibly splits into two parts while the original stays greyed as the referent. Conservation under decomposition — the total didn\'t change because you watched it not change — checkable by comparison, not memory.',
    pitfalls: [
      'Says "nee, niet meer 5" after a fair split because the arrangement looks different — conservation not yet stable.',
      'At klopt-het, misses the dropped/joined dot even with the grey original available — doesn\'t compare, just trusts the gesture.',
      'At welke-splitsing, picks a split with the wrong total — tracked the groups but lost the whole.',
    ],
    progression: 'kijk (watch the split, always conserving — orientation) → klopt-het (some splits cheat by one dot; verify against the greyed original) → welke-splitsing (read the resulting split; wrong-total distractors keep conservation in play).',
  },
  generateMeta(operandA, operandB, score) {
    const tierId = pickTier(TIERS, score).id
    const total = operandA + operandB
    let delta = 0
    let finalParts: [number, number] = [operandA, operandB]

    if (tierId === 'klopt-het' && Math.random() < 0.5) {
      // Cheat by one: drop a dot (only if the result still splits) or join one.
      delta = total >= 3 && Math.random() < 0.5 ? -1 : 1
      const resultTotal = total + delta
      const ra = 1 + Math.floor(Math.random() * (resultTotal - 1))
      finalParts = [ra, resultTotal - ra]
    }

    const options = tierId === 'welke-splitsing'
      ? buildSplitOptions([operandA, operandB], total)
      : null

    return { tierId, total, finalParts, delta, options }
  },
  Component: SplitsShuffleComponent,
}

registerExercise(SplitsShuffle)
