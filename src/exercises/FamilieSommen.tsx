import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { Huisje } from '../presentation/components/Huisje'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { splitText } from './opDisplay'

// ─── familie-sommen ───────────────────────────────────────────────────────────
// One splitshuisje and the sums that live in it: 2 + 3 = 5, 3 + 2 = 5,
// 5 − 2 = 3, 5 − 3 = 2 — the familieopgaven. The only exercise in which all
// the views of one fact stand together; it is what makes a family ONE piece of
// knowledge instead of four sums and a split.
//
// The child taps number tiles (the three numbers of the house) into the open
// places, first of the two + sums, then of the two − sums. A wrong tile ends
// the question. A house with two equal rooms has one + and one − sum.
//
// Designed third tier, not built: "zelf" (70) — only the house, the child makes
// a sum and then a different one (skill map → Exercise design for the next set).

const TIERS: ExerciseTier[] = [
  { id: 'aanvullen', minScore: 0,  label: 'aanvullen', description: 'Each sum has one open place; the rest is printed. Four taps.' },
  { id: 'leggen',    minScore: 40, label: 'leggen',    description: 'Both numbers before the = are open in every sum. For + either order may come first (the second sum must be the other one); for − the order is fixed — the whole comes first, and 2 − 5 is the error this catches.' },
]

interface FamilieSommenMeta {
  tierId: string
}

type Place = 'x' | 'y' | 'res'
interface Frame { sign: '+' | '-'; x: number; y: number; res: number; holes: Place[] }

// The frames of a family, + pair first. `leggen` opens both places before the =.
function buildFrames(a: number, b: number, leggen: boolean): Frame[][] {
  const t = a + b
  const open = (h: Place): Place[] => (leggen ? ['x', 'y'] : [h])
  const plus: Frame[] = [{ sign: '+', x: a, y: b, res: t, holes: open('res') }]
  const minus: Frame[] = [{ sign: '-', x: t, y: a, res: b, holes: open('y') }]
  if (a !== b) {
    plus.push({ sign: '+', x: b, y: a, res: t, holes: open('x') })
    minus.push({ sign: '-', x: t, y: b, res: a, holes: open('res') })
  }
  return [plus, minus]
}

const BETWEEN_MS = 700

function FamilieSommenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FamilieSommenMeta>) {
  const { operandA: a, operandB: b, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, accent, confirm } = tokens
  const t = a + b
  const leggen = meta.tierId === 'leggen'
  const phases = buildFrames(a, b, leggen)
  const tiles = [...new Set([t, a, b])]

  const [phase, setPhase] = useState(0)
  // what the child has placed in this phase: one list of values per frame, in hole order
  const [placed, setPlaced] = useState<number[][]>([[], []])
  const [taps, setTaps] = useState(0)
  const [busy, setBusy] = useState(false)
  const between = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setPhase(0); setPlaced([[], []]); setTaps(0); setBusy(false)
    return () => { if (between.current) clearTimeout(between.current) }
  }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  const frames = phases[phase]
  // the open place that is next: first frame with a hole still empty
  const frameIdx = frames.findIndex((f, i) => placed[i].length < f.holes.length)
  const active = frameIdx >= 0 ? { frame: frameIdx, hole: frames[frameIdx].holes[placed[frameIdx].length] } : null

  // What may go in the active place. In leggen the first + sum may start with
  // either part; everything after that follows from what was placed.
  const accepts = (v: number): boolean => {
    if (!active) return false
    const f = frames[active.frame]
    const mine = placed[active.frame]
    if (!leggen) return v === f[active.hole]
    if (f.sign === '+') {
      if (active.hole === 'x') return active.frame === 0 ? (v === a || v === b) : v === t - placed[0][0]
      return v === t - mine[0]
    }
    return v === f[active.hole]
  }

  const tap = (v: number) => {
    if (disabled || answered || busy || !active) return
    const n = taps + 1
    setTaps(n)
    if (!accepts(v)) { resolve(false, { givenAnswer: v, tapCount: n }); return }
    const next = placed.map((p, i) => (i === active.frame ? [...p, v] : p))
    setPlaced(next)
    const phaseDone = frames.every((f, i) => next[i].length >= f.holes.length)
    if (!phaseDone) return
    if (phase === phases.length - 1) { resolve(true, { tapCount: n }); return }
    // the + sums are done: hold them a moment, then the − sums take their place
    setBusy(true)
    between.current = setTimeout(() => { setPhase(p => p + 1); setPlaced([[], []]); setBusy(false) }, BETWEEN_MS)
  }

  const cell = (f: Frame, i: number, place: Place) => {
    const holeIdx = f.holes.indexOf(place)
    const isHole = holeIdx >= 0
    const value = !isHole ? f[place] : placed[i][holeIdx]
    const filled = value !== undefined
    const isActive = !!active && active.frame === i && active.hole === place && !busy
    if (!isHole) {
      return <span style={{ minWidth: 30, textAlign: 'center', color: ink }}>{value}</span>
    }
    return (
      <span style={{
        width: 40, height: 40, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, fontSize: 26,
        background: filled ? (solved || busy ? confirm : accent) : paper,
        color: filled ? 'white' : `${ink}55`,
        border: `2px solid ${filled ? 'transparent' : isActive ? accent : tokens.paperMid}`,
        boxShadow: isActive ? `0 0 0 2px ${accent}` : 'none',
        transition: 'background .18s',
      }}>{filled ? value : '?'}</span>
    )
  }

  const row = (i: number) => {
    const f = frames[i]
    // a family with two equal parts has one sum per phase: the second row stays empty
    if (!f) return <div key={i} style={{ height: 46 }} />
    return (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, fontFamily: 'Fredoka One, cursive', fontSize: 30 }}>
        {cell(f, i, 'x')}
        <span style={{ color: f.sign === '-' ? tokens.refuse : tokens.confirm }}>{f.sign === '-' ? '−' : '+'}</span>
        {cell(f, i, 'y')}
        <span style={{ color: ink, opacity: 0.4, fontSize: 26 }}>=</span>
        {cell(f, i, 'res')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Maak de sommen!</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '12px 20px', gap: 8 }}>
        <Huisje room={48} total={t} left={String(a)} right={String(b)} tokens={tokens} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {row(0)}
          {row(1)}
        </div>
      </ExerciseStage>

      {/* The number tiles: the three numbers of the house. A tile is not used up. */}
      <div style={{ display: 'flex', gap: 14 }}>
        {tiles.map(v => (
          <button key={v} onClick={() => tap(v)}
            onPointerDown={e => { if (!disabled && !answered && !busy) e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            style={{
              width: 72, height: 64, fontFamily: 'Fredoka One, cursive', fontSize: 34, lineHeight: 1,
              background: paper, color: ink, border: `2px solid ${ink}`, borderRadius: 16,
              cursor: disabled || answered || busy ? 'default' : 'pointer',
              boxShadow: '0 2px 0 rgba(61,47,30,.18)',
              opacity: disabled || answered || busy ? 0.45 : 1, transition: 'transform .1s', userSelect: 'none',
            }}>{v}</button>
        ))}
      </div>
    </div>
  )
}

const FamilieSommen: ExerciseDefinition<FamilieSommenMeta> = {
  id: 'familie-sommen',
  label: 'De sommen van het huisje',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Hold a getalfamilie as one thing: from one splitshuisje write its + sums and its − sums (the familieopgaven). Where the split, optellen and aftrekken visibly are the same three numbers.',
    pitfalls: [
      'At aanvullen the tiles can be placed mechanically (the missing number is the one not yet in the sum).',
      'For −: starting with a part instead of the whole (2 − 5 = 3) — the order error; leggen catches it.',
      'Writing the same + sum twice instead of its turn-around.',
    ],
    progression: 'aanvullen: one open place per sum. leggen (40): both numbers before the = are open; the − order becomes the child\'s job. The + pair comes first, then the − pair takes its place on the stage. (A third tier — make the sums yourself from the bare house — is designed, not built.)',
  },
  retryStable: [],
  // Several sums are asked: the house is the fact to show.
  correctStatement: q => splitText(q.operandA + q.operandB, q.operandA, q.operandB),
  isCompatible: (a, b) => a > 0 && b > 0,
  generateMeta(_a, _b, score) {
    return { tierId: pickTier(TIERS, score).id }
  },
  Component: FamilieSommenComponent,
}

registerExercise(FamilieSommen)
