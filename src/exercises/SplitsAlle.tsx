import { useEffect, useState } from 'react'
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

const TIERS: ExerciseTier[] = [
  { id: 'tabel-aanvullen', minScore: 65, label: 'tabel aanvullen', description: 'Left column pre-printed counting down (the systematic pattern given); fill the right column\'s gaps.' },
  { id: 'tabel-vol',       minScore: 85, label: 'hele tabel',      description: 'Empty table; the child reproduces the descending left column AND the complements — full systematic enumeration.' },
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

  // The required entry sequence: expected value per step, plus its cell.
  // tabel-aanvullen: only the non-prefilled right cells, top-down.
  // tabel-vol: every cell, row by row, left then right.
  const sequence: { row: number; col: 'l' | 'r'; expected: number }[] = []
  for (let r = 0; r < rows; r++) {
    const left = total - r
    const right = r
    if (meta.tierId === 'tabel-vol') {
      sequence.push({ row: r, col: 'l', expected: left })
      sequence.push({ row: r, col: 'r', expected: right })
    } else if (!meta.prefill[r]) {
      sequence.push({ row: r, col: 'r', expected: right })
    }
  }

  const [step, setStep] = useState(0)
  const [taps, setTaps] = useState(0)
  useEffect(() => { setStep(0); setTaps(0) }, [question])

  const done = step >= sequence.length
  const active = done ? null : sequence[step]

  useEffect(() => {
    if (done && sequence.length > 0) {
      const t = setTimeout(() => onResolve(true, { tapCount: sequence.length }), 600)
      return () => clearTimeout(t)
    }
  }, [done, sequence.length, onResolve])

  const handleKey = (key: string) => {
    if (disabled || done || !active) return
    if (key === '⌫' || key === '✓') return
    const v = parseInt(key, 10)
    setTaps(t => t + 1)
    if (v === active.expected) setStep(s => s + 1)
    else onResolve(false, { givenAnswer: v, tapCount: taps + 1 })
  }

  // A cell is visible when pre-printed or already (correctly) entered.
  const cellValue = (r: number, col: 'l' | 'r'): string => {
    const expected = col === 'l' ? total - r : r
    if (col === 'l' && meta.tierId !== 'tabel-vol') return String(expected)
    if (col === 'r' && meta.tierId === 'tabel-aanvullen' && meta.prefill[r]) return String(expected)
    const idx = sequence.findIndex(s => s.row === r && s.col === col)
    return idx >= 0 && idx < step ? String(expected) : '?'
  }

  const isActive = (r: number, col: 'l' | 'r') => active?.row === r && active?.col === col

  const cell = (r: number, col: 'l' | 'r') => {
    const v = cellValue(r, col)
    const act = isActive(r, col)
    return (
      <div key={col} style={{
        width: 52, height: 38, background: v === '?' ? paper : paperMid,
        border: `2px solid ${act ? accent : ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fredoka One, cursive', fontSize: 22,
        color: v === '?' ? `${ink}45` : ink,
        boxShadow: act ? `inset 0 0 0 2px ${accent}` : 'none',
      }}>{v}</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
      }}>Alle splitsingen van <span style={{ color: accentText }}>{total}</span>!</div>

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
            {cell(r, 'l')}
            {cell(r, 'r')}
          </div>
        ))}
      </div>

      <NumPad onKey={handleKey} disabled={disabled || done} tokens={scene?.tokens} />
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
    progression: 'tabel-aanvullen (65): the left column is pre-printed counting down — the systematic trick is given, the child supplies complements. tabel-vol (85): empty table — the child reproduces the pattern itself. Any wrong digit ends the attempt (the engine re-serves one tier down).',
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
