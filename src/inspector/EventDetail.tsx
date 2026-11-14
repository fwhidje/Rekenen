import { useState } from 'react'
import {
  answerText, exerciseLabel, formatProblem, resolveScene, rowForSharing, skillLabel, tierLabel, DEFAULT_VIEWPORT,
} from './model'
import type { EventRow, RetryLinks } from './model'
import { THEMES } from '../presentation/themes'
import { Replay } from './Replay'
import { btn, C, card, mono } from './ui'

// ─── One answer: the evidence, the replay, the share button ─────────────────

interface Props {
  row: EventRow
  links: RetryLinks
  onSelect: (id: string) => void
  onClose?: () => void          // narrow screens: back to the list
}

export function EventDetail({ row, links, onSelect, onClose }: Props) {
  const retry = links.retriedBy.get(row.id)
  const original = links.retryOf.get(row.id)
  const scene = resolveScene(row)
  const theme = THEMES[scene.themeIdx]
  const tier = tierLabel(row.exercise_id, row.tier_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              <span style={{ color: row.correct ? C.good : C.bad }}>{row.correct ? '✓' : '✗'}</span>{' '}
              {exerciseLabel(row.exercise_id)}
              {row.flag && <span style={{ color: C.flag, marginLeft: 8 }} title={row.flag}>⚑ gemarkeerd</span>}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {new Date(row.occurred_at).toLocaleString('nl-BE')} · {skillLabel(row.skill_id)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <CopyButton row={row} />
            {onClose && <button style={btn('quiet')} onClick={onClose}>← Lijst</button>}
          </div>
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 14px', margin: '12px 0 0', fontSize: 14 }}>
          <Field k="Probleem" v={formatProblem(row.problem, { a: row.operand_a, b: row.operand_b, op: row.op })} />
          <Field k="Antwoord" v={answerText(row, true)} />
          {row.error_type && <Field k="Fouttype" v={row.error_type} />}
          <Field k="Niveau" v={tier ? `${tier} (${row.tier_id})` : '–'} />
          {row.variant && <Field k="Variant" v={row.variant} />}
          <Field k="Score vooraf" v={row.score_before ?? '–'} />
          <Field k="Tijd" v={row.response_time_ms !== null ? `${(row.response_time_ms / 1000).toFixed(1)} s` : '–'} />
          {row.tap_count !== null && <Field k="Tikken" v={row.tap_count} />}
          {row.replay_count !== null && <Field k="Herhalingen" v={row.replay_count} />}
          {row.is_retry && (
            <Field k="Herkansing van" v={original
              ? <LinkButton onClick={() => onSelect(original.id)}>{original.correct ? '✓' : '✗'} gaf {original.given_answer ?? '?'} ({tierLabel(original.exercise_id, original.tier_id) ?? '–'})</LinkButton>
              : 'eerste poging niet geladen'} />
          )}
          {retry && (
            <Field k="Herkansing" v={
              <LinkButton onClick={() => onSelect(retry.id)}>{retry.correct ? '✓ goed' : `✗ gaf ${retry.given_answer ?? '?'}`} ({tierLabel(retry.exercise_id, retry.tier_id) ?? '–'})</LinkButton>
            } />
          )}
          <Field k="Scène" v={scene.recorded
            ? `${theme.id} · achtergrond ${scene.background} · figuur ${scene.counter}`
            : 'niet opgenomen (van vóór migratie 0002)'} />
          <Field k="Scherm" v={row.viewport_w ? `${row.viewport_w} × ${row.viewport_h}` : 'niet opgenomen'} />
          <Field k="App-versie" v={<span style={mono}>{row.app_version}</span>} />
        </dl>
      </div>

      <Replay key={row.id} row={row} scene={scene}
        viewport={row.viewport_w && row.viewport_h ? { w: row.viewport_w, h: row.viewport_h } : DEFAULT_VIEWPORT}
        viewportRecorded={!!row.viewport_w} />

      <details style={card}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 800 }}>Wat er getoond werd (meta) en de ruwe rij</summary>
        <pre style={{ ...mono, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '10px 0 0' }}>
          {JSON.stringify(row, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: C.muted }}>{k}</dt>
      <dd style={{ margin: 0 }}>{v}</dd>
    </>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', background: 'none', padding: 0, color: C.accent, cursor: 'pointer',
      fontFamily: 'Nunito, sans-serif', fontSize: 14, textAlign: 'left',
    }}>{children}</button>
  )
}

// Copies the answer as JSON, trimmed and labelled, ready to paste into a chat
// about fixing the exercise.
function CopyButton({ row }: { row: EventRow }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rowForSharing(row), null, 2))
      setState('done')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 1800)
  }
  return (
    <button style={btn('quiet')} onClick={() => { void copy() }}
      title="Kopieer dit antwoord als JSON, om te plakken in een gesprek over een oplossing">
      {state === 'done' ? '✓ Gekopieerd' : state === 'failed' ? 'Kopiëren mislukt' : '📋 Kopieer'}
    </button>
  )
}
