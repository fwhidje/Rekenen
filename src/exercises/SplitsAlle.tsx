import { useCallback, useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { NumPad } from '../ui/components/NumPad'
import { useClosure } from '../presentation/useClosure'

// ─── splits-alle ──────────────────────────────────────────────────────────────
// The full huisje-table of one total: every split, both orders, 0-rows
// included (5+0, 4+1, … 0+5) — exactly how Flemish workbooks print it. The
// left column counts down; that descending pattern IS the systematic trick
// this exercise teaches. Post-60 depth content: enumeration, not recall of
// a single fact. The mirror symmetry of the table doubles as a free
// commutativity visual.
//
// UX model: free-entry grid. The child taps any unfilled cell, types a digit
// (auto-commits), then moves to the next cell. Submits with ✓ when the table
// is full; wrong rows are highlighted before the wrong answer is handed off to
// the engine's retry-one-tier-down mechanism.
//
// Left-column duplicate guard (tabel-vol only): typing a value already present
// in another left cell shows an orange warning and does not commit. This teaches
// that the left column must enumerate all values exactly once.
// NOTE: for splitsen-10 this guardrail should probably be dropped — by then the
// child knows the pattern; keep it here for the first encounter at tot-5.

const TIERS: ExerciseTier[] = [
  { id: 'tabel-aanvullen', minScore: 65, label: 'tabel aanvullen', description: 'Left column pre-printed counting down (the systematic pattern given); fill the right column\'s gaps in any order, validated on submit.' },
  { id: 'tabel-vol',       minScore: 85, label: 'hele tabel',      description: 'Empty table; the child fills both columns freely, left-column duplicate guard teaches uniqueness, full validation on submit.' },
]

interface SplitsAlleMeta {
  // per-row: is the right cell pre-printed? (tabel-aanvullen only)
  prefill: boolean[]
  // Retry only — per-row: is the right cell printed on the retry? When present
  // it REPLACES `prefill`: a row is printed if it was printed before or the
  // child had it right; a row the child had wrong is always open. So a retry
  // keeps correct work, asks again only for what was wrong, and never gives
  // less help than the first attempt.
  kept?: boolean[]
  // The table as the child left it on a wrong submit: [left, right] per row.
  // Written by the component at that moment (see `submit`) — it is what the
  // retry's `kept` is derived from, and it rides on the answer record as
  // evidence of which rows went wrong.
  entries?: (number | null)[][]
  tierId: string
}

// How long the wrong rows stay marked before the overlay.
const WRONG_ROWS_MS = 1500

function SplitsAlleComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsAlleMeta>) {
  const { operandA, operandB, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, paperMid, accent, accentText } = tokens
  const total = operandA + operandB
  const rows = total + 1   // total..0 in the left column

  // tabel-aanvullen: is row r's right cell printed for the child?
  const given = (r: number) => meta.kept ? !!meta.kept[r] : !!meta.prefill[r]

  const isRequired = useCallback((r: number, col: number): boolean => {
    if (meta.tierId === 'tabel-vol') return true
    return col === 1 && !given(r)
  }, [meta]) // eslint-disable-line react-hooks/exhaustive-deps

  // cells[row][col]: 0=left, 1=right
  const [cells, setCells] = useState<(number | null)[][]>([])
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null)
  const [leftWarning, setLeftWarning] = useState(false)
  const [wrongRows, setWrongRows] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  // Closure: the completed table is held before the overlay.
  const { answered, resolve } = useClosure(question, onResolve)

  useEffect(() => {
    const vol = meta.tierId === 'tabel-vol'
    setCells(Array.from({ length: rows }, (_, r) => [
      vol ? null : total - r,
      !vol && given(r) ? r : null,
    ]))
    // The first cell to fill is active from the start — typing works at once,
    // and the highlight shows where to begin.
    let first: [number, number] | null = null
    for (let r = 0; r < rows && !first; r++) {
      if (vol) first = [r, 0]
      else if (!given(r)) first = [r, 1]
    }
    setActiveCell(first)
    setLeftWarning(false)
    setWrongRows(new Set())
    setSubmitting(false)
  }, [question]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss orange warning after 1.5 s
  useEffect(() => {
    if (!leftWarning) return
    const t = setTimeout(() => setLeftWarning(false), 1500)
    return () => clearTimeout(t)
  }, [leftWarning])

  const allFilled = cells.length > 0 && cells.every((row, r) =>
    [0, 1].every(col => !isRequired(r, col) || row[col] !== null)
  )

  // Next empty required cell after (fromRow, fromCol) in reading order
  const nextEmpty = (updated: (number | null)[][], fromRow: number, fromCol: number): [number, number] | null => {
    const order: [number, number][] = []
    for (let r = 0; r < rows; r++) {
      if (meta.tierId === 'tabel-vol') { order.push([r, 0], [r, 1]) }
      else if (!given(r)) { order.push([r, 1]) }
    }
    const cur = order.findIndex(([r, c]) => r === fromRow && c === fromCol)
    for (let i = cur + 1; i < order.length; i++) {
      const [nr, nc] = order[i]
      if (updated[nr][nc] === null) return [nr, nc]
    }
    return null
  }

  const submit = (currentCells: (number | null)[][]) => {
    const wrongSet = new Set<number>()
    currentCells.forEach(([l, r], i) => {
      if ((l ?? 0) + (r ?? 0) !== total) wrongSet.add(i)
    })
    const tapCount = currentCells.flat().filter(v => v !== null).length
    if (wrongSet.size === 0) {
      resolve(true, { tapCount })
    } else {
      setWrongRows(wrongSet)
      setSubmitting(true)
      // Hand the table to the retry (and the record) before resolving: the
      // retry keeps the rows that were right.
      meta.entries = currentCells.map(row => [...row])
      setTimeout(() => resolve(false, { tapCount }), WRONG_ROWS_MS)
    }
  }

  const handleKey = (key: string) => {
    if (disabled || submitting || answered) return
    if (key === '⌫') {
      if (!activeCell) return
      const [r, col] = activeCell
      if (!isRequired(r, col)) return
      setCells(c => c.map((row, ri) =>
        ri === r ? row.map((v, ci) => (ci === col ? null : v)) as (number | null)[] : row
      ))
      return
    }
    if (key === '✓') {
      if (allFilled) submit(cells)
      return
    }
    if (!activeCell) return
    const v = parseInt(key, 10)
    const [r, col] = activeCell

    // Left-column duplicate guard (tabel-vol only)
    if (col === 0 && meta.tierId === 'tabel-vol') {
      const duplicate = cells.some((row, ri) => ri !== r && row[0] === v)
      if (duplicate) {
        setLeftWarning(true)
        return
      }
    }

    const updated = cells.map((row, ri) =>
      ri === r ? row.map((val, ci) => (ci === col ? v : val)) as (number | null)[] : row
    )
    setCells(updated)
    setLeftWarning(false)
    setActiveCell(nextEmpty(updated, r, col))
  }

  const cellEl = (r: number, col: number) => {
    if (cells.length === 0) return null
    const value = cells[r][col]
    const required = isRequired(r, col)
    const act = activeCell?.[0] === r && activeCell?.[1] === col
    const wrong = wrongRows.has(r)
    const displayVal = value !== null ? String(value) : '?'

    return (
      <div
        key={col}
        onClick={(!required || submitting || disabled || answered) ? undefined : () => { setActiveCell([r, col]); setLeftWarning(false) }}
        style={{
          width: 52, height: 34, boxSizing: 'border-box',
          background: wrong ? `${tokens.refuse}40` : value !== null ? paperMid : paper,
          border: `2px solid ${wrong ? tokens.refuse : act ? accent : ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 22,
          color: value !== null ? ink : `${ink}45`,
          boxShadow: act ? `inset 0 0 0 2px ${accent}` : 'none',
          cursor: required && !submitting && !disabled ? 'pointer' : 'default',
          transition: 'border-color .12s, background .2s',
        }}
      >{displayVal}</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <ExerciseTitle tokens={tokens} warning={leftWarning ? 'Dit getal staat er al!' : undefined}>Alle splitsingen van <span style={{ color: accentText }}>{total}</span>!</ExerciseTitle>

      {/* Compact stage + compact numpad: the 6-row table of 5 and the pad must
          fit the viewport together (CLAUDE.md → conventions, "fits the screen"). */}
      <ExerciseStage tokens={tokens} style={{ padding: '12px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* roof header */}
          <div style={{
            width: 108, height: 34, boxSizing: 'border-box', background: paper, border: `2px solid ${ink}`,
            borderBottom: 'none', borderRadius: '14px 14px 0 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
          }}>{total}</div>
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
              {cellEl(r, 0)}
              {cellEl(r, 1)}
            </div>
          ))}
        </div>
      </ExerciseStage>

      <NumPad compact onKey={handleKey} disabled={disabled || submitting || answered} tokens={scene?.tokens} />
    </div>
  )
}

const SplitsAlle: ExerciseDefinition<SplitsAlleMeta> = {
  id: 'splits-alle',
  label: 'Alle splitsingen',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Systematic enumeration: ALL splits of one total in the canonical descending table, 0-rows and both orders included. Tests systematicity, not single-fact recall; the table\'s mirror symmetry shows commutativity for free.',
    pitfalls: [
      'Losing the descending pattern halfway (skipping a row\'s value).',
      'Stopping at the "sensible" splits and stumbling on the 0-rows.',
      'Complement errors concentrated in the middle of the table where the pattern helps least.',
    ],
    progression: 'tabel-aanvullen (65): the left column is pre-printed counting down — the systematic trick is given; the child fills the right column\'s gaps (the first one is active from the start, the cursor moves on by itself) and submits. tabel-vol (85): empty table — the child fills both columns; the left-column duplicate guard (a warning on repeat values) teaches uniqueness. On submit the wrong rows are marked; the retry, one tier down, keeps the rows that were right and asks again only for the others.',
  },
  // Retry: the same pre-printed cells — a retry never gives fewer hints.
  retryStable: ['prefill'],
  // A whole table, not one statement → neutral message.
  correctStatement: () => null,
  generateMeta(operandA, operandB, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const total = operandA + operandB
    if (ctx?.retryOf) {
      const prev = ctx.retryOf
      if (!prev.entries) return { prefill: prev.prefill, kept: prev.kept, tierId: tier.id }
      // What was printed for the child on the failed attempt (nothing, at tabel-vol).
      const printed = (r: number) => prev.tierId === 'tabel-vol' ? false : (prev.kept ? !!prev.kept[r] : !!prev.prefill[r])
      // Row r of the retry has left = total − r: the child had it right when
      // some row carried that left number with its complement.
      const right = (r: number) => prev.entries!.some(([l, v]) => l === total - r && v !== null && l + v === total)
      const kept = Array.from({ length: total + 1 }, (_, r) => printed(r) || right(r))
      return { prefill: prev.prefill, kept, tierId: tier.id }
    }
    // pre-print roughly half the right column, never all, never none
    const prefill = Array.from({ length: total + 1 }, () => Math.random() < 0.5)
    if (prefill.every(Boolean)) prefill[0] = false
    if (!prefill.some(Boolean)) prefill[total] = true
    return { prefill, tierId: tier.id }
  },
  Component: SplitsAlleComponent,
}

registerExercise(SplitsAlle)
