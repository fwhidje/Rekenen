import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { TFButtons } from '../ui/components/TFButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import type { SceneTokens } from '../presentation/tokens'
import { DOT_POS } from '../presentation/diePatterns'

const TIERS: ExerciseTier[] = [
  { id: 'aligned',   minScore: 0,  label: 'zelfde stijl', description: 'Two visual splits side by side in matching representation styles (both die-patterns, similar colour scheme). Order-equivalent cases (2+3 vs 3+2) and genuinely different cases (2+3 vs 1+4) are mixed.' },
  { id: 'cross-rep', minScore: 50, label: 'andere stijl', description: 'Two splits shown in different representations (dots one side, splitshuisje the other; finger pattern vs ten-frame). Tests order-independence across representation as well.' },
]

// ─── Split representations (shared shape across splitsen-herken-5 files) ────

type SplitRepKind = 'split-die' | 'twin-dice' | 'mini-huisje' | 'notation'
const SPLIT_REPS: SplitRepKind[] = ['split-die', 'twin-dice', 'mini-huisje', 'notation']


function SplitDie({ a, b, size, colourA, colourB, ink, paper }: { a: number; b: number; size: number; colourA: string; colourB: string; ink: string; paper: string }) {
  const positions = DOT_POS[a + b] ?? []
  const dotSize = Math.round(size * 0.18)
  return (
    <div style={{
      width: size, height: size, background: paper, border: `2px solid ${ink}`,
      borderRadius: Math.round(size * 0.15), position: 'relative',
    }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: i < a ? colourA : colourB,
        }} />
      ))}
    </div>
  )
}

function TwinDice({ a, b, size, colourA, colourB, ink, paper }: { a: number; b: number; size: number; colourA: string; colourB: string; ink: string; paper: string }) {
  const cell = size * 0.42
  const dotSize = Math.round(cell * 0.22)
  const renderBox = (n: number, colour: string) => {
    const positions = DOT_POS[n] ?? []
    return (
      <div style={{
        width: cell, height: cell, background: paper, border: `2px solid ${ink}`,
        borderRadius: Math.round(cell * 0.18), position: 'relative',
      }}>
        {positions.map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
            width: dotSize, height: dotSize, borderRadius: '50%', background: colour,
          }} />
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: size * 0.07, alignItems: 'center' }}>
      {renderBox(a, colourA)}
      {renderBox(b, colourB)}
    </div>
  )
}

function MiniHuisje({ a, b, size, colourA, colourB, ink, paper }: { a: number; b: number; size: number; colourA: string; colourB: string; ink: string; paper: string }) {
  const W = size
  const roofH = size * 0.34
  const roomW = W / 2 - 1
  const roomH = size * 0.42
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={W} height={roofH} style={{ display: 'block' }}>
        <polygon points={`${W / 2},2 2,${roofH - 1} ${W - 2},${roofH - 1}`}
          fill={paper} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        <text x={W / 2} y={roofH - 8} fontFamily="Fredoka One, cursive"
          fontSize={size * 0.22} textAnchor="middle" fill={ink}>{a + b}</text>
      </svg>
      <div style={{ display: 'flex', border: `2px solid ${ink}`, borderRadius: 4 }}>
        <div style={{
          width: roomW, height: roomH, background: paper,
          borderRight: `2px solid ${ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: size * 0.28, color: colourA,
        }}>{a}</div>
        <div style={{
          width: roomW, height: roomH, background: paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: size * 0.28, color: colourB,
        }}>{b}</div>
      </div>
    </div>
  )
}

function NotationRep({ a, b, size, ink, colourA, colourB }: { a: number; b: number; size: number; ink: string; colourA: string; colourB: string }) {
  return (
    <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: size * 0.36, color: ink, whiteSpace: 'nowrap' }}>
      <span style={{ color: colourA }}>{a}</span> + <span style={{ color: colourB }}>{b}</span>
    </span>
  )
}

export function SplitView({ kind, a, b, size, tokens }: { kind: SplitRepKind; a: number; b: number; size: number; tokens: SceneTokens }) {
  const { ink, paper, refuse, dot } = tokens
  const colourA = refuse, colourB = dot
  switch (kind) {
    case 'split-die':   return <SplitDie    a={a} b={b} size={size} colourA={colourA} colourB={colourB} ink={ink} paper={paper} />
    case 'twin-dice':   return <TwinDice    a={a} b={b} size={size} colourA={colourA} colourB={colourB} ink={ink} paper={paper} />
    case 'mini-huisje': return <MiniHuisje  a={a} b={b} size={size} colourA={colourA} colourB={colourB} ink={ink} paper={paper} />
    case 'notation':    return <NotationRep a={a} b={b} size={size} ink={ink} colourA={colourA} colourB={colourB} />
  }
}

export { SPLIT_REPS }
export type { SplitRepKind }

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

// Pick a split of any total in 2..5 that's *not* equivalent to (exceptA, exceptB).
// Prefers same-total alternatives; falls back to a different total if none exist
// (totals 2 and 3 only have one distinct split each).
function pickDifferentSplit(exceptA: number, exceptB: number): [number, number] {
  const total = exceptA + exceptB
  const sameTotalAlts: [number, number][] = []
  for (let i = 1; i < total; i++) {
    const cand: [number, number] = [i, total - i]
    if ((cand[0] === exceptA && cand[1] === exceptB) ||
        (cand[0] === exceptB && cand[1] === exceptA)) continue
    sameTotalAlts.push(cand)
  }
  if (sameTotalAlts.length > 0 && Math.random() < 0.7) {
    return sameTotalAlts[Math.floor(Math.random() * sameTotalAlts.length)]
  }
  const otherTotals = [2, 3, 4, 5].filter(t => t !== total)
  const newTotal = otherTotals[Math.floor(Math.random() * otherTotals.length)]
  const newA = 1 + Math.floor(Math.random() * (newTotal - 1))
  return [newA, newTotal - newA]
}

// ─── Component ──────────────────────────────────────────────────────────────

interface SameSplitOrDifferentMeta {
  tierId: string
  isSame: boolean
  leftRep: SplitRepKind
  rightRep: SplitRepKind
  rightSplit: [number, number]
}

function SameSplitOrDifferentComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SameSplitOrDifferentMeta>) {
  const { operandA, operandB, meta } = question
  const { isSame, leftRep, rightRep, rightSplit } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream } = tokens

  const correctValue = isSame ? 1 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Zelfde splitsing?</div>

      <div style={{ display: 'flex', gap: 28, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          background: paper, border: `2px solid ${ink}`, borderRadius: 16,
          padding: 14, minWidth: 120, minHeight: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        }}>
          <SplitView kind={leftRep} a={operandA} b={operandB} size={100} tokens={tokens} />
        </div>
        <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: ink, opacity: 0.5 }}>?</span>
        <div style={{
          background: paper, border: `2px solid ${ink}`, borderRadius: 16,
          padding: 14, minWidth: 120, minHeight: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        }}>
          <SplitView kind={rightRep} a={rightSplit[0]} b={rightSplit[1]} size={100} tokens={tokens} />
        </div>
      </div>

      <TFButtons
        onPick={v => onResolve(v === correctValue)}
        disabled={disabled}
        tokens={scene?.tokens}
      />
    </div>
  )
}

const SameSplitOrDifferent: ExerciseDefinition<SameSplitOrDifferentMeta> = {
  id: 'same-split-or-different',
  label: 'Zelfde of anders?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Forces explicit commitment to order-independence — "is this the same split or different?" — instead of letting the kid skate past it by always reading the unknown. Tests the equivalence relation the skill goal claims (2 + 3 = 3 + 2).',
    pitfalls: [
      'Sees different colours or different orientations and says "anders" — equivalence not yet abstracted from surface features.',
      'Sees the same digits in different positions (2-left + 3-right vs 3-left + 2-right) and says "anders" — order-dependence pitfall in its binary form.',
      'At cross-rep tier, defaults to "anders" whenever the representation differs, regardless of whether the split is actually the same.',
    ],
    progression: 'aligned (same representation, equivalence visible from visual similarity) → cross-rep (different representations, equivalence has to be derived through abstraction). Surface similarity falls away as score rises.',
  },
  generateMeta(operandA, operandB, score) {
    const tierId = pickTier(TIERS, score).id
    const isSame = Math.random() < 0.5
    let rightSplit: [number, number]
    if (isSame) {
      rightSplit = Math.random() < 0.5 ? [operandA, operandB] : [operandB, operandA]
    } else {
      rightSplit = pickDifferentSplit(operandA, operandB)
    }
    let leftRep: SplitRepKind, rightRep: SplitRepKind
    if (tierId === 'aligned') {
      const r = SPLIT_REPS[Math.floor(Math.random() * SPLIT_REPS.length)]
      leftRep = rightRep = r
    } else {
      const reps = shuffle([...SPLIT_REPS])
      leftRep = reps[0]
      rightRep = reps[1]
    }
    return { tierId, isSame, leftRep, rightRep, rightSplit }
  },
  Component: SameSplitOrDifferentComponent,
}

registerExercise(SameSplitOrDifferent)
