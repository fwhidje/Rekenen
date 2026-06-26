import { useCallback, useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { NumPad } from '../ui/components/NumPad'

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
// is full; wrong rows are highlighted before onResolve(false) hands off to
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
  tierId: string
}

function SplitsAlleComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsAlleMeta>) {
  const { operandA, operandB, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, paperMid, accent, cream, accentText } = tokens
  const total = operandA + operandB
  const rows = total + 1   // total..0 in the left column

  const isRequired = useCallback((r: number, col: number): boolean => {
    if (meta.tierId === 'tabel-vol') return true
    return col === 1 && !meta.prefill[r]
  }, [meta])

  // cells[row][col]: 0=left, 1=right
  const [cells, setCells] = useState<(number | null)[][]>([])
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null)
  const [leftWarning, setLeftWarning] = useState(false)
  const [wrongRows, setWrongRows] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCells(Array.from({ length: rows }, (_, r) => [
      meta.tierId === 'tabel-vol' ? null : total - r,
      meta.tierId === 'tabel-aanvullen' && meta.prefill[r] ? r : null,
    ]))
    setActiveCell(null)
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
      else if (!meta.prefill[r]) { order.push([r, 1]) }
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
      onResolve(true, { tapCount })
    } else {
      setWrongRows(wrongSet)
      setSubmitting(true)
      setTimeout(() => onResolve(false, { tapCount }), 800)
    }
  }

  const handleKey = (key: string) => {
    if (disabled || submitting) return
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
        onClick={(!required || submitting || disabled) ? undefined : () => { setActiveCell([r, col]); setLeftWarning(false) }}
        style={{
          width: 52, height: 38,
          background: value !== null ? paperMid : paper,
          border: `2px solid ${wrong ? '#ef4444' : act ? accent : ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 22,
          color: value !== null ? ink : `${ink}45`,
          boxShadow: act ? `inset 0 0 0 2px ${accent}` : 'none',
          cursor: required && !submitting && !disabled ? 'pointer' : 'default',
          transition: 'border-color .12s',
        }}
      >{displayVal}</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {leftWarning ? (
        <div style={{
          background: '#f97316', border: '2px solid #ea6c0a', borderRadius: 18,
          padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
          fontFamily: 'Fredoka One, cursive', fontSize: 20, color: 'white',
        }}>Dit getal staat er al!</div>
      ) : (
        <div style={{
          background: cream, border: `2px solid ${ink}`, borderRadius: 18,
          padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
          fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
        }}>Alle splitsingen van <span style={{ color: accentText }}>{total}</span>!</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* roof header */}
        <div style={{
          width: 110, height: 40, background: paper, border: `2px solid ${ink}`,
          borderBottom: 'none', borderRadius: '14px 14px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 26, color: ink,
        }}>{total}</div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
            {cellEl(r, 0)}
            {cellEl(r, 1)}
          </div>
        ))}
      </div>

      <NumPad onKey={handleKey} disabled={disabled || submitting} tokens={scene?.tokens} />
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
    progression: 'tabel-aanvullen (65): the left column is pre-printed counting down — the systematic trick is given; the child fills the right column\'s gaps in any order and submits. tabel-vol (85): empty table — the child fills both columns freely; the left-column duplicate guard (orange warning on repeat values) teaches uniqueness; full validation fires on submit and wrong rows are highlighted before the engine retries one tier down.',
  },
  generateMeta(operandA, operandB, score) {
    const tier = pickTier(TIERS, score)
    const total = operandA + operandB
    // pre-print roughly half the right column, never all, never none
    const prefill = Array.from({ length: total + 1 }, () => Math.random() < 0.5)
    if (prefill.every(Boolean)) prefill[0] = false
    if (!prefill.some(Boolean)) prefill[total] = true
    return { prefill, tierId: tier.id }
  },
  Component: SplitsAlleComponent,
}

registerExercise(SplitsAlle)
