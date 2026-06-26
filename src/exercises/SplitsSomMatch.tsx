import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { Problem } from '../curriculum/types'
import { NATURE_TOKENS } from '../presentation/tokens'
import { SplitView, type SplitRepKind } from './SameSplitOrDifferent'
import { Panel } from '../presentation/components/Panel'
import { opGlyph, opColor } from './opDisplay'

// ─── splits-som-match ─────────────────────────────────────────────────────────
// The relation probe (one fact, three faces): a split representation next to
// som options — "welke som hoort erbij?" — and, at the top tier, the inverse
// direction. Op-generic: for '+' the split composes the sum's parts; for '−'
// the split shows the whole as given-part + answer (the via-splitsing seam).
// Post-60 width content for the +/− skills.

const TIERS: ExerciseTier[] = [
  { id: 'som-vol',    minScore: 40, label: 'volledige som', description: 'A split representation is shown; pick the FULL som (incl. = uitkomst) that says the same thing — all three numbers visible to match.' },
  { id: 'som-kiezen', minScore: 60, label: 'som kiezen',    description: 'A split representation is shown; pick the bare som (no uitkomst) that says the same thing, among soms of OTHER facts.' },
  { id: 'omgekeerd',  minScore: 80, label: 'omgekeerd',     description: 'The som is shown; pick the split representation that matches — the same relation read in the other direction.' },
]

// Visual reps only — the 'notation' rep would duplicate the som side.
const REPS: SplitRepKind[] = ['split-die', 'twin-dice', 'mini-huisje']

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

  const showResult = meta.tierId === 'som-vol'
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

  const pick = (i: number) => !disabled && onResolve(i === meta.correctIdx)

  const prompt = meta.tierId === 'omgekeerd' ? 'Welke splitsing hoort erbij?' : 'Welke som hoort erbij?'

  // 2×2 grid, matching ChoiceButtons, so options read the same as elsewhere.
  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    maxWidth: 304, width: '100%', margin: '0 auto',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      {/* Header + target on a shared panel; the options sit outside it */}
      <Panel bg={scene?.containerBg ?? 'rgba(255,255,255,.5)'}>
        <div style={{
          background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
          padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
          fontFamily: 'Fredoka One, cursive', fontSize: 22, color: tokens.ink,
        }}>{prompt}</div>
        {meta.tierId === 'omgekeerd'
          ? <div style={{ ...tileStyle, cursor: 'default' }}>{somText(meta.som, 40)}</div>
          : <SplitView kind={meta.rep} a={meta.split[0]} b={meta.split[1]} size={110} tokens={tokens} />}
      </Panel>

      {/* The options — 2×2 grid */}
      <div style={grid}>
        {meta.tierId === 'omgekeerd'
          ? meta.tiles.map(([p, q], i) => (
              <div key={i} style={tileStyle} onClick={() => pick(i)}>
                <SplitView kind={meta.rep} a={p} b={q} size={72} tokens={tokens} />
              </div>
            ))
          : meta.options.map((som, i) => (
              <div key={i} style={tileStyle} onClick={() => pick(i)}>
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
  generateMeta(operandA, operandB, score, problem?: Problem) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'

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
      rep: REPS[Math.floor(Math.random() * REPS.length)],
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
