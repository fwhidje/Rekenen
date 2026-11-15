import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { Problem } from '../curriculum/types'
import { NATURE_TOKENS } from '../presentation/tokens'
import { SplitView, type SplitRepKind } from './SameSplitOrDifferent'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useEffect, useState } from 'react'
import { opGlyph, opColor, equationText } from './opDisplay'
import { useClosure } from '../presentation/useClosure'

// ─── splits-som-match ─────────────────────────────────────────────────────────
// The relation probe (one fact, three faces): a split representation next to
// som options — "welke som hoort erbij?" — and, at the top tier, the inverse
// direction. Op-generic: for '+' the split composes the sum's parts; for '−'
// the split shows the whole as given-part + answer (the via-splitsing seam).
// Post-60 width content for the +/− skills.

const TIERS: ExerciseTier[] = [
  { id: 'som-vol',    minScore: 40, label: 'volledige som', description: 'A split representation is shown; pick the FULL som (incl. = uitkomst) that says the same thing — all three numbers visible to match.' },
  { id: 'som-kiezen', minScore: 60, label: 'som kiezen',    description: 'A split representation is shown; pick the som that says the same thing, among soms of OTHER facts. For + with a dice picture the som is bare (no uitkomst); for − and for the mini-huisje it stays in full.' },
  { id: 'omgekeerd',  minScore: 80, label: 'omgekeerd',     description: 'The som is shown; pick the split representation that matches — the same relation read in the other direction.' },
]

// Visual reps only — the 'notation' rep would duplicate the som side.
// For '−' the picture must SHOW THE WHOLE (one die in two colours, or the
// huisje with its roof): two separate dice give no whole to subtract from, and
// reading "4 − 1 = 3" off a 1-die and a 3-die is too big a leap.
const REPS_PLUS: SplitRepKind[] = ['split-die', 'twin-dice', 'mini-huisje']
const REPS_MINUS: SplitRepKind[] = ['split-die', 'mini-huisje']

// When is the som written in full ("3 + 2 = 5") rather than bare ("3 + 2")?
//   • the entry tier (som-vol), always;
//   • '−', always — the uitkomst is the other part of the split, so the full
//     sum is what makes the picture and the sum line up;
//   • the mini-huisje, always — it already prints three numerals (roof + rooms),
//     so a bare sum would only withhold the one that matches the roof.
// The same picture means the same fact in the + and the − skill (5 split in
// 3 and 2 ↔ 3 + 2 = 5 ↔ 5 − 2 = 3); only the dice pictures of '+' ever get the
// bare som.
function showsFullSom(tierId: string, op: string, rep: SplitRepKind): boolean {
  return tierId === 'som-vol' || op === '-' || rep === 'mini-huisje'
}

// A som as displayed: [first operand, second operand] under the question's op.
type Som = [number, number]

interface SplitsSomMatchMeta {
  rep: SplitRepKind
  split: [number, number]   // the split shown / to find, as two parts
  options: Som[]            // som-kiezen: som options · omgekeerd: correct som at correctIdx is in `som`
  tiles: [number, number][] // omgekeerd: split tiles
  som: Som                  // omgekeerd: the som shown
  correctIdx: number
  tierId: string
}

// Does the som (x op y) express the same fact as the split (p, q)?
function somMatchesSplit(op: string, x: number, y: number, p: number, q: number): boolean {
  if (op === '-') return x === p + q && (y === p || y === q)   // whole − either part
  return (x === p && y === q) || (x === q && y === p)          // same two parts
}

function shuffleWithIndex<T>(items: T[], correct: number): { items: T[]; correctIdx: number } {
  const tagged = items.map((it, i) => ({ it, i }))
  tagged.sort(() => Math.random() - 0.5)
  return { items: tagged.map(t => t.it), correctIdx: tagged.findIndex(t => t.i === correct) }
}

function SplitsSomMatchComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsSomMatchMeta>) {
  const { op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS

  const showResult = showsFullSom(meta.tierId, op, meta.rep)
  const somText = ([x, y]: Som, fs: number, withResult = false) => (
    <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: fs, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: tokens.accentText }}>{x}</span>
      <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>
      <span style={{ color: tokens.pop }}>{y}</span>
      {withResult && <>
        <span style={{ color: tokens.ink, opacity: 0.4 }}>=</span>
        <span style={{ color: tokens.ink }}>{op === '-' ? x - y : x + y}</span>
      </>}
    </span>
  )

  const tileStyle: React.CSSProperties = {
    background: tokens.paper, border: `2px solid ${tokens.ink}`, borderRadius: 14,
    padding: '10px 16px', cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '2px 3px 0 rgba(61,47,30,.12)',
  }

  // Closure: the chosen card stays marked (confirm border) during the hold.
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const pick = (i: number) => {
    if (disabled || answered) return
    setPicked(i)
    resolve(i === meta.correctIdx)
  }
  const optionStyle = (i: number): React.CSSProperties => ({
    ...tileStyle,
    cursor: disabled || answered ? 'default' : 'pointer',
    ...(solved && picked === i ? { borderColor: tokens.confirm, boxShadow: `0 0 0 3px ${tokens.confirm}` } : {}),
  })

  const prompt = meta.tierId === 'omgekeerd' ? 'Welke splitsing hoort erbij?' : 'Welke som hoort erbij?'

  // 2×2 grid, matching ChoiceButtons, so options read the same as elsewhere.
  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    maxWidth: 304, width: '100%', margin: '0 auto',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      {/* Prompt in the title band; target on the stage; options sit outside it */}
      <ExerciseTitle tokens={tokens}>{prompt}</ExerciseTitle>
      <ExerciseStage tokens={tokens}>
        {meta.tierId === 'omgekeerd'
          ? <div style={{ ...tileStyle, cursor: 'default' }}>{somText(meta.som, showResult ? 34 : 40, showResult)}</div>
          : <SplitView kind={meta.rep} a={meta.split[0]} b={meta.split[1]} size={110} tokens={tokens} />}
      </ExerciseStage>

      {/* The options — 2×2 grid */}
      <div style={grid}>
        {meta.tierId === 'omgekeerd'
          ? meta.tiles.map(([p, q], i) => (
              <div key={i} style={optionStyle(i)} onClick={() => pick(i)}>
                <SplitView kind={meta.rep} a={p} b={q} size={72} tokens={tokens} />
              </div>
            ))
          : meta.options.map((som, i) => (
              <div key={i} style={optionStyle(i)} onClick={() => pick(i)}>
                {somText(som, 30, showResult)}
              </div>
            ))}
      </div>
    </div>
  )
}

const SplitsSomMatch: ExerciseDefinition<SplitsSomMatchMeta> = {
  id: 'splits-som-match',
  label: 'Splitsing en som',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'See one fact in two faces: the split and the som express the same relation. For + this binds the sum to its part-whole structure; for − it seeds the via-splitsing strategy (5 = 4 en 1, dus 5 − 1 = 4).',
    pitfalls: [
      'Matching on a single visible number instead of the whole relation (distractors share digits with the target).',
      'For −: matching a som whose whole is right but whose part belongs to a different split.',
    ],
    progression: 'som-vol (40): split shown, pick the FULL som with its uitkomst (5 − 1 = 4) — all three numbers visible to match, the gentle entry. som-kiezen (60): same direction but the bare som (5 − 1), so the relation must be reasoned, not digit-matched. omgekeerd (80): som shown, pick the split — the same relation read in the other direction.',
  },
  // Retry: the same split picture and the same four options, one tier down
  // (e.g. the bare soms now shown with their uitkomst). Only the tier — and
  // with it which list is the option list — changes.
  retryStable: ['rep', 'split', 'som', 'options', 'tiles'],
  // The som that belongs to the split, in full.
  correctStatement: q => equationText(q.op, q.meta.som[0], q.meta.som[1]),
  generateMeta(operandA, operandB, score, problem?: Problem, ctx?) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    const prev = ctx?.retryOf
    if (prev) {
      const same = (x: [number, number], y: [number, number]) => x[0] === y[0] && x[1] === y[1]
      return {
        rep: prev.rep, split: prev.split, som: prev.som, options: prev.options, tiles: prev.tiles,
        correctIdx: tier.id === 'omgekeerd'
          ? prev.tiles.findIndex(t => same(t, prev.split))
          : prev.options.findIndex(o => same(o, prev.som)),
        tierId: tier.id,
      }
    }

    // The fact's split and its som, per op.
    let split: [number, number]
    let som: Som
    if (op === '-' && problem?.op === '-') {
      const { whole, part } = problem
      const rest = whole - part
      split = Math.random() < 0.5 ? [part, rest] : [rest, part]
      som = [whole, part]
    } else {
      split = Math.random() < 0.5 ? [operandA, operandB] : [operandB, operandA]
      som = [operandA, operandB]
    }

    // Distractors are facts that do NOT express the shown relation. Pools stay
    // within tot-5 so no numeral exceeds the range.
    const somPool: Som[] = []
    const splitPool: [number, number][] = []
    if (op === '-') {
      for (let w = 2; w <= 5; w++) for (let p = 1; p < w; p++) {
        if (!somMatchesSplit('-', w, p, split[0], split[1])) somPool.push([w, p])
      }
      // splits deduped under order-equivalence (p ≤ complement)
      for (let t = 2; t <= 5; t++) for (let p = 1; p <= t - p; p++) {
        if (!somMatchesSplit('-', som[0], som[1], p, t - p)) splitPool.push([p, t - p])
      }
    } else {
      for (let x = 1; x <= 4; x++) for (let y = 1; x + y <= 5; y++) {
        if (!somMatchesSplit('+', x, y, split[0], split[1])) somPool.push([x, y])
        if (y >= x && !somMatchesSplit('+', som[0], som[1], x, y)) splitPool.push([x, y])
      }
    }
    const draw = <T,>(pool: T[], n: number): T[] =>
      [...pool].sort(() => Math.random() - 0.5).slice(0, n)

    const somsShuffled = shuffleWithIndex<Som>([som, ...draw(somPool, 3)], 0)
    const tilesShuffled = shuffleWithIndex<[number, number]>([split, ...draw(splitPool, 3)], 0)
    const omgekeerd = tier.id === 'omgekeerd'

    return {
      rep: (op === '-' ? REPS_MINUS : REPS_PLUS)[Math.floor(Math.random() * (op === '-' ? REPS_MINUS : REPS_PLUS).length)],
      split,
      som,
      options: somsShuffled.items,
      tiles: tilesShuffled.items,
      correctIdx: omgekeerd ? tilesShuffled.correctIdx : somsShuffled.correctIdx,
      tierId: tier.id,
    }
  },
  Component: SplitsSomMatchComponent,
}

registerExercise(SplitsSomMatch)
