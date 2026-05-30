import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { SplitView, SPLIT_REPS } from './SameSplitOrDifferent'
import type { SplitRepKind } from './SameSplitOrDifferent'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'choose', minScore: 0,  label: 'kiezen', description: 'Target split in one representation (e.g. colour-coded die-pattern 2+3). Four option tiles in different representations (finger pattern split 2-and-3, ten-frame top-2 bottom-3, splitshuisje "2 | 3", one distractor). Kid picks the match.' },
  { id: 'pairs',  minScore: 50, label: 'memory', description: 'Six tiles, three pairs hidden — kid taps to reveal and matches each split to its cross-representation twin. Memory format; raises working-memory demand.' },
]

interface SplitSpec { a: number; b: number; rep: SplitRepKind }

interface SplitsMatchMeta {
  tierId: string
  targetRep: SplitRepKind
  target: [number, number]
  options: SplitSpec[]   // choose tier (4)
  tiles: SplitSpec[]     // pairs tier (6, shuffled)
}

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

// splits-equivalence: (a,b) == (b,a)
function splitEq(p: [number, number], q: [number, number]): boolean {
  return (p[0] === q[0] && p[1] === q[1]) || (p[0] === q[1] && p[1] === q[0])
}

// Pick k splits including the target, all distinct under splits-equivalence.
function pickSplits(target: [number, number], k: number): [number, number][] {
  const out: [number, number][] = [target]
  const allTotals = [2, 3, 4, 5]
  let attempts = 0
  while (out.length < k && attempts < 100) {
    attempts++
    const t = allTotals[Math.floor(Math.random() * allTotals.length)]
    const a = 1 + Math.floor(Math.random() * (t - 1))
    const cand: [number, number] = [a, t - a]
    if (out.some(s => splitEq(s, cand))) continue
    out.push(cand)
  }
  return out
}

// ─── Component ──────────────────────────────────────────────────────────────

const WRONG_FLASH_MS = 900

function SplitsMatchComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsMatchMeta>) {
  const { operandA, operandB, meta } = question
  const { tierId, targetRep, target, options, tiles } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream, accent, confirm, refuse } = tokens

  const [selected, setSelected] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [lock, setLock] = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)
  const mismatchRef = useRef(0)

  useEffect(() => {
    setSelected([]); setMatched(new Set()); setLock(false); setWrongFlash(false)
    mismatchRef.current = 0
  }, [operandA, operandB, tierId])

  const tapTile = (i: number) => {
    if (disabled || lock || matched.has(i) || selected.includes(i)) return
    const ns = [...selected, i]
    setSelected(ns)
    if (ns.length < 2) return
    setLock(true)
    const [x, y] = ns
    const pair: [number, number] = [tiles[x].a, tiles[x].b]
    const other: [number, number] = [tiles[y].a, tiles[y].b]
    if (splitEq(pair, other)) {
      setTimeout(() => {
        const nm = new Set(matched); nm.add(x); nm.add(y)
        setMatched(nm); setSelected([]); setLock(false)
        if (nm.size === tiles.length) onResolve(true, { tapCount: mismatchRef.current })
      }, 500)
    } else {
      mismatchRef.current += 1
      if (tierId === 'pairs') {
        // memory tier: forgiving, flip back
        setTimeout(() => { setSelected([]); setLock(false) }, 900)
      } else {
        // (not reached — choose tier doesn't use this handler)
        setTimeout(() => { setSelected([]); setLock(false) }, 900)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>{tierId === 'pairs' ? 'Zoek de paren' : 'Welke splitsing past?'}</div>

      {tierId === 'choose' ? (
        <>
          <div style={{
            background: paper, border: `2px solid ${ink}`, borderRadius: 18,
            padding: 18, minWidth: 140, minHeight: 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
          }}>
            <SplitView kind={targetRep} a={target[0]} b={target[1]} size={110} tokens={tokens} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 340, width: '100%' }}>
            {options.map((opt, i) => (
              <button key={i}
                onClick={() => {
                  if (disabled) return
                  const match = splitEq([opt.a, opt.b], target)
                  if (match) {
                    onResolve(true, { givenAnswer: opt.a })
                  } else {
                    mismatchRef.current += 1
                    setWrongFlash(true)
                    setTimeout(() => {
                      setWrongFlash(false)
                      onResolve(false, { givenAnswer: opt.a, tapCount: mismatchRef.current })
                    }, WRONG_FLASH_MS)
                  }
                }}
                onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.94)' }}
                onPointerUp={e =>   { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e =>{ e.currentTarget.style.transform = 'scale(1)' }}
                style={{
                  height: 116,
                  background: wrongFlash ? `${refuse}22` : paper,
                  border: `2px solid ${wrongFlash ? refuse : ink}`,
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer', boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
                  opacity: disabled ? 0.45 : 1, transition: 'transform .1s, background .15s, border-color .15s', userSelect: 'none',
                }}>
                <SplitView kind={opt.rep} a={opt.a} b={opt.b} size={88} tokens={tokens} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          maxWidth: 340, width: '100%',
          padding: 8, borderRadius: 18, background: 'transparent',
        }}>
          {tiles.map((tile, i) => {
            const show = selected.includes(i) || matched.has(i)
            const isSelected = selected.includes(i)
            const isMatched = matched.has(i)
            const borderColor = isMatched ? confirm : isSelected ? accent : ink
            return (
              <button key={i} onClick={() => tapTile(i)}
                style={{
                  height: 104, borderRadius: 16,
                  border: `${isSelected || isMatched ? 3 : 2}px solid ${borderColor}`,
                  background: isMatched ? `${confirm}22` : paper,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: disabled || isMatched ? 'default' : 'pointer',
                  boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
                  opacity: isMatched ? 0.6 : 1, transition: 'background .15s, border-color .15s, opacity .2s',
                  userSelect: 'none',
                }}>
                {show
                  ? <SplitView kind={tile.rep} a={tile.a} b={tile.b} size={76} tokens={tokens} />
                  : <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 40, color: `${ink}40` }}>?</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const SplitsMatch: ExerciseDefinition<SplitsMatchMeta> = {
  id: 'splits-match',
  label: 'Welke splitsing past?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Cross-representation matching at the split level — the §11 transfer diagnostic ("a kid who reads a 2+3 split from dots but can\'t recognise it in a splitshuisje has the perception but not the abstraction"). Sibling exercise to quantity-match in getalbegrip, half a step up.',
    pitfalls: [
      'Surface visual matching — picks the option that looks similar (same colours, same shape) regardless of the split.',
      'Matches by total instead of by split — gets the total right but the split wrong, possible when distractors share the total.',
      'Locked into one representation — reads the dot-pattern target but freezes on the finger-pattern option.',
    ],
    progression: 'choose (single-shot, all options visible) → pairs (memory format, holds multiple splits in working memory at once). Cognitive demand shifts from match-now to match-with-recall.',
  },
  generateMeta(operandA, operandB, score) {
    const tierId = pickTier(TIERS, score).id
    const target: [number, number] = [operandA, operandB]

    // choose: 4 distinct splits incl. target; 4 distinct reps; correct option in
    // a rep different from targetRep (that's the transfer the exercise tests).
    const targetRep = SPLIT_REPS[Math.floor(Math.random() * SPLIT_REPS.length)]
    const splits4 = pickSplits(target, 4)
    const reps4 = shuffle([...SPLIT_REPS])
    const options: SplitSpec[] = splits4.map((s, i) => ({ a: s[0], b: s[1], rep: reps4[i] }))
    const ci = options.findIndex(o => splitEq([o.a, o.b], target))
    if (options[ci].rep === targetRep) {
      const sj = options.findIndex((o, j) => j !== ci && o.rep !== targetRep)
      ;[options[ci].rep, options[sj].rep] = [options[sj].rep, options[ci].rep]
    }
    options.sort(() => Math.random() - 0.5)

    // pairs: 3 distinct splits incl. target, each in 2 distinct reps → 6 tiles.
    const splits3 = pickSplits(target, 3)
    const tiles: SplitSpec[] = []
    for (const s of splits3) {
      const [r0, r1] = shuffle([...SPLIT_REPS]).slice(0, 2)
      tiles.push({ a: s[0], b: s[1], rep: r0 }, { a: s[0], b: s[1], rep: r1 })
    }

    return { tierId, targetRep, target, options, tiles: shuffle(tiles) }
  },
  Component: SplitsMatchComponent,
}

registerExercise(SplitsMatch)
