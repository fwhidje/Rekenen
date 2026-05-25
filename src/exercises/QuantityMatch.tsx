import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { HandSVG } from '../presentation/components/HandSVG'
import { NATURE_TOKENS } from '../presentation/tokens'
import type { SceneTokens } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'choose', minScore: 0,  label: 'kiezen', description: 'A target quantity shown in one representation; four options shown in different representations (dot pattern, finger pattern, ten-frame, numeral). Kid picks the option with the same quantity.' },
  { id: 'pairs',  minScore: 50, label: 'memory', description: 'Six tiles, three pairs hidden — kid taps to reveal and matches each quantity to its alternate representation. Memory format; raises the working-memory demand.' },
]

type RepKind = 'numeral' | 'dots' | 'fingers' | 'tenframe'
const REPS: RepKind[] = ['numeral', 'dots', 'fingers', 'tenframe']

interface RepSpec { count: number; rep: RepKind }

interface QuantityMatchMeta {
  tierId: string
  targetRep: RepKind
  options: RepSpec[]   // choose tier (4)
  tiles: RepSpec[]     // pairs tier (6, shuffled)
}

const DOT_POS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

// k distinct counts in 1..max, always including `correct`.
function makeCounts(correct: number, max: number, k: number): number[] {
  const pool = shuffle(Array.from({ length: max }, (_, i) => i + 1).filter(v => v !== correct))
  return shuffle([correct, ...pool.slice(0, k - 1)])
}

// ─── Representation renderers ───────────────────────────────────────────────

function DieSquare({ n, color, size }: { n: number; color: string; size: number }) {
  const positions = DOT_POS[n] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
          width: dotSize, height: dotSize, borderRadius: '50%', background: color,
        }} />
      ))}
    </div>
  )
}

function DotsRep({ n, dot, refuse, size }: { n: number; dot: string; refuse: string; size: number }) {
  if (n <= 5) return <DieSquare n={n} color={dot} size={size * 0.82} />
  const g = size * 0.46
  return (
    <div style={{ display: 'flex', gap: size * 0.06, alignItems: 'center' }}>
      <DieSquare n={5} color={refuse} size={g} />
      <DieSquare n={n - 5} color={dot} size={g} />
    </div>
  )
}

function FingersRep({ n, size }: { n: number; size: number }) {
  if (n <= 5) return <HandSVG n={n} size={size * 0.72} />
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
      <HandSVG n={5} size={size * 0.5} />
      <HandSVG n={n - 5} size={size * 0.5} />
    </div>
  )
}

function TenFrameRep({ n, ink, paper, dot, size }: { n: number; ink: string; paper: string; dot: string; size: number }) {
  const cell = Math.max(11, Math.round(size * 0.15))
  return (
    <div style={{
      background: paper, border: `2px solid ${ink}`, borderRadius: 8, padding: 3, display: 'grid',
      gridTemplateColumns: `repeat(5, ${cell}px)`, gridTemplateRows: `repeat(2, ${cell}px)`, gap: 3,
    }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{
          width: cell, height: cell, border: `1.5px solid ${ink}`, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {i < n && <div style={{ width: cell - 6, height: cell - 6, borderRadius: '50%', background: dot }} />}
        </div>
      ))}
    </div>
  )
}

function RepView({ kind, n, size, tokens }: { kind: RepKind; n: number; size: number; tokens: SceneTokens }) {
  const { ink, paper, dot, refuse, accentText } = tokens
  switch (kind) {
    case 'numeral':  return <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: size * 0.55, color: accentText }}>{n}</span>
    case 'dots':     return <DotsRep n={n} dot={dot} refuse={refuse} size={size} />
    case 'fingers':  return <FingersRep n={n} size={size} />
    case 'tenframe': return <TenFrameRep n={n} ink={ink} paper={paper} dot={dot} size={size} />
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

function QuantityMatchComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<QuantityMatchMeta>) {
  const { operandA, meta } = question
  const { tierId, targetRep, options, tiles } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream } = tokens

  // ── pairs (memory) state ──
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [lock, setLock] = useState(false)
  const mismatchRef = useRef(0)

  useEffect(() => {
    setFlipped([]); setMatched(new Set()); setLock(false); mismatchRef.current = 0
  }, [operandA, tierId])

  const tapTile = (i: number) => {
    if (disabled || lock || matched.has(i) || flipped.includes(i)) return
    const nf = [...flipped, i]
    setFlipped(nf)
    if (nf.length < 2) return
    setLock(true)
    const [a, b] = nf
    if (tiles[a].count === tiles[b].count) {
      setTimeout(() => {
        const nm = new Set(matched); nm.add(a); nm.add(b)
        setMatched(nm); setFlipped([]); setLock(false)
        if (nm.size === tiles.length) onResolve(true, { tapCount: mismatchRef.current })
      }, 600)
    } else {
      mismatchRef.current += 1
      setTimeout(() => { setFlipped([]); setLock(false) }, 900)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>{tierId === 'pairs' ? 'Zoek de paren' : 'Welke hoort erbij?'}</div>

      {tierId === 'choose' ? (
        <>
          <div style={{
            background: paper, border: `2px solid ${ink}`, borderRadius: 18,
            padding: 18, minWidth: 150, minHeight: 130,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
          }}>
            <RepView kind={targetRep} n={operandA} size={120} tokens={tokens} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 320, width: '100%' }}>
            {options.map((opt, i) => (
              <button key={i}
                onClick={() => !disabled && onResolve(opt.count === operandA, { givenAnswer: opt.count })}
                onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.94)' }}
                onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
                style={{
                  height: 110, background: paper, border: `2px solid ${ink}`, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer', boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
                  opacity: disabled ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
                }}>
                <RepView kind={opt.rep} n={opt.count} size={84} tokens={tokens} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 340, width: '100%' }}>
          {tiles.map((tile, i) => {
            const show = flipped.includes(i) || matched.has(i)
            return (
              <button key={i} onClick={() => tapTile(i)}
                style={{
                  height: 96, borderRadius: 16, border: `2px solid ${ink}`,
                  background: paper, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer', boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
                  opacity: matched.has(i) ? 0.5 : 1, transition: 'opacity .2s', userSelect: 'none',
                }}>
                {show
                  ? <RepView kind={tile.rep} n={tile.count} size={72} tokens={tokens} />
                  : <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 40, color: `${ink}40` }}>?</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const QuantityMatch: ExerciseDefinition<QuantityMatchMeta> = {
  id: 'quantity-match',
  label: 'Welke hoort erbij?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Tests transfer across representations directly — the §11 diagnostic ("a kid who can read 3 from dots but freezes on a finger pattern has the concept but not the abstraction"). The only exercise that exercises this transfer as its central thing.',
    pitfalls: [
      'Surface-level visual matching — picks the option that looks similar (round shapes, similar colour) regardless of count.',
      'Counts the target, then counts every option until something matches — doesn\'t use the structure of either side.',
      'Stuck at one representation — can read the dot pattern but freezes on the finger-pattern option.',
    ],
    progression: 'choose (single-shot, all options visible) → pairs (memory game, holding multiple representations in working memory at once). Cognitive demand shifts from match-now to match-with-recall.',
  },
  generateMeta(operandA, _b, score) {
    const tierId = pickTier(TIERS, score).id
    const max = operandA <= 5 ? 5 : 10

    // choose: target rep + 4 options spanning all 4 reps; correct option in a
    // different representation than the target (that's the transfer the exercise tests).
    const targetRep = REPS[Math.floor(Math.random() * REPS.length)]
    const counts = makeCounts(operandA, max, 4)
    const reps = shuffle([...REPS])
    const options: RepSpec[] = counts.map((c, i) => ({ count: c, rep: reps[i] }))
    const ci = options.findIndex(o => o.count === operandA)
    if (options[ci].rep === targetRep) {
      const sj = options.findIndex((o, j) => j !== ci && o.rep !== targetRep)
      ;[options[ci].rep, options[sj].rep] = [options[sj].rep, options[ci].rep]
    }

    // pairs: 3 quantities (incl. operandA), each in 2 distinct reps → 6 tiles.
    const counts3 = makeCounts(operandA, max, 3)
    const tiles: RepSpec[] = []
    for (const c of counts3) {
      const [r0, r1] = shuffle([...REPS]).slice(0, 2)
      tiles.push({ count: c, rep: r0 }, { count: c, rep: r1 })
    }

    return { tierId, targetRep, options, tiles: shuffle(tiles) }
  },
  Component: QuantityMatchComponent,
}

registerExercise(QuantityMatch)
