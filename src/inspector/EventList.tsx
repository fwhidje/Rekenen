import { useState } from 'react'
import { answerText, exerciseLabel, formatProblem, tierLabel } from './model'
import type { EventRow, ExerciseSummary, RetryLinks } from './model'
import { C, card } from './ui'

// ─── Answer list + per-exercise summary ──────────────────────────────────────

interface Props {
  rows: EventRow[]
  summary: ExerciseSummary[]
  links: RetryLinks
  selectedId: string | null
  onSelect: (id: string) => void
  exerciseFilter: string | null
  onExerciseFilter: (exerciseId: string | null) => void
}

export function EventList({ rows, summary, links, selectedId, onSelect, exerciseFilter, onExerciseFilter }: Props) {
  return (
    <>
      <Summary summary={summary} active={exerciseFilter} onPick={onExerciseFilter} />
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {rows.length === 0 && <div style={{ padding: 14, color: C.muted, fontSize: 14 }}>Niets gevonden met deze filters.</div>}
        {groupByDay(rows).map(([day, dayRows]) => (
          <div key={day}>
            <div style={{
              padding: '6px 14px', background: '#FAF8F4', borderBottom: `1px solid ${C.line}`,
              fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'capitalize',
            }}>{day}</div>
            {dayRows.map(r => (
              <Row key={r.id} row={r} links={links} selected={r.id === selectedId} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

function Row({ row, links, selected, onSelect }: {
  row: EventRow; links: RetryLinks; selected: boolean; onSelect: (id: string) => void
}) {
  const retry = links.retriedBy.get(row.id)
  const tier = tierLabel(row.exercise_id, row.tier_id)
  return (
    <button onClick={() => onSelect(row.id)} style={{
      display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
      padding: '9px 14px', border: 'none', borderBottom: `1px solid ${C.line}`,
      background: selected ? C.select : 'white', fontFamily: 'Nunito, sans-serif', color: C.ink,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: C.muted, width: 38, flexShrink: 0 }}>{time(row.occurred_at)}</span>
        <span style={{ fontWeight: 800, color: row.correct ? C.good : C.bad, width: 14 }}>{row.correct ? '✓' : '✗'}</span>
        {row.flag && <span style={{ color: C.flag, fontWeight: 800 }} title="Gemarkeerd">⚑</span>}
        {row.is_retry && <span style={{ color: C.muted, fontSize: 12 }} title="Herkansing">↻</span>}
        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {exerciseLabel(row.exercise_id)}
        </span>
        {tier && <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>· {tier}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginLeft: 46, fontSize: 13, color: C.muted, flexWrap: 'wrap' }}>
        <span style={{ color: C.ink }}>{formatProblem(row.problem, { a: row.operand_a, b: row.operand_b, op: row.op })}</span>
        <span>{answerText(row)}</span>
        {row.response_time_ms !== null && <span>{(row.response_time_ms / 1000).toFixed(1)} s</span>}
        {retry && <span>→ herkansing {retry.correct ? '✓' : '✗'}</span>}
      </div>
    </button>
  )
}

function Summary({ summary, active, onPick }: {
  summary: ExerciseSummary[]; active: string | null; onPick: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  if (summary.length === 0) return null
  const shown = open ? summary : summary.slice(0, 5)
  const th: React.CSSProperties = { textAlign: 'right', fontWeight: 700, color: C.muted, padding: '4px 6px', fontSize: 12 }
  const td: React.CSSProperties = { textAlign: 'right', padding: '4px 6px', fontSize: 13 }
  return (
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
        Per oefening <span style={{ fontWeight: 400, color: C.muted }}>(eerste pogingen in deze periode · tik om te filteren)</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left' }}>Oefening</th>
            <th style={th}>n</th>
            <th style={th}>fout</th>
            <th style={th}>⚑</th>
            <th style={th}>mediaan</th>
          </tr>
        </thead>
        <tbody>
          {shown.map(s => {
            const isActive = s.exerciseId === active
            const pct = s.answers ? Math.round((100 * s.wrong) / s.answers) : 0
            return (
              <tr key={s.exerciseId} onClick={() => onPick(isActive ? null : s.exerciseId)}
                style={{ cursor: 'pointer', background: isActive ? C.select : undefined }}>
                <td style={{ ...td, textAlign: 'left', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exerciseLabel(s.exerciseId)}
                </td>
                <td style={td}>{s.answers}</td>
                <td style={{ ...td, color: pct >= 25 ? C.bad : C.ink }}>{s.wrong} <span style={{ color: C.muted }}>({pct}%)</span></td>
                <td style={{ ...td, color: s.flagged ? C.flag : C.muted, fontWeight: s.flagged ? 800 : 400 }}>{s.flagged || '–'}</td>
                <td style={td}>{s.medianMs !== null ? `${(s.medianMs / 1000).toFixed(1)} s` : '–'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {summary.length > 5 && (
        <button onClick={() => setOpen(o => !o)} style={{
          marginTop: 6, border: 'none', background: 'none', color: C.accent, cursor: 'pointer',
          fontFamily: 'Nunito, sans-serif', fontSize: 13, padding: 0,
        }}>{open ? 'Minder tonen' : `Alle ${summary.length} oefeningen tonen`}</button>
      )}
    </div>
  )
}

function groupByDay(rows: EventRow[]): [string, EventRow[]][] {
  const out = new Map<string, EventRow[]>()
  for (const r of rows) {
    const day = new Date(r.occurred_at).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const g = out.get(day) ?? []
    g.push(r)
    out.set(day, g)
  }
  return [...out.entries()]
}

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}
