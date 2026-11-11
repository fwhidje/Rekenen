import { useMemo, useState, type ReactNode } from 'react'
import type { Profile, SkillState } from '../state/types'
import { SKILLS } from '../curriculum/skills'
import { layoutSkillTree } from '../admin/skillTreeLayout'
import {
  planOverride, canOverride, blockedBy, prerequisites,
  DIRECT_PREREQ_SCORE, DEEP_PREREQ_SCORE, MASTERED_SCORE, OPEN_TARGET_SCORE,
  type OverrideMode, type ChangeRole, type SkillChange,
} from '../admin/progressOverride'

// Admin screen: the skill tree for one profile, with the progress override.
// Opties → 🌳 on a profile card. Tap a skill, pick 'Open hier' or 'Beheerst',
// check the preview, Toepassen. Rules live in admin/progressOverride.ts.

interface Props {
  profile: Profile
  onApply: (updated: Profile) => void
  onClose: () => void
}

const ROW_H = 78
const NODE_W = 0.225   // fraction of the width (4 per row max)
const NODE_H = 58

const ROLE_COLOR: Record<ChangeRole, string> = {
  target:  '#FF6B35',
  direct:  '#2A9D8F',
  deeper:  '#6C63C7',
  cascade: '#E9A23B',
}

const byId = new Map(SKILLS.map(s => [s.id, s]))
const nameOf = (id: string) => byId.get(id)?.name ?? id

function statusLabel(state: SkillState | undefined): string {
  if (!state) return '🔒'
  if (state.archived) return `📦 ${state.score}`
  if (state.unlocked) return `${state.score}`
  return '🔒'
}

export function SkillTreeScreen({ profile, onApply, onClose }: Props) {
  const layout = useMemo(() => layoutSkillTree(), [])
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<OverrideMode>('open')
  const [flash, setFlash] = useState<string | null>(null)

  const plan = useMemo(
    () => (selected && canOverride(selected) ? planOverride(profile, selected, mode) : null),
    [profile, selected, mode],
  )
  const roleOf = useMemo(() => {
    // Graph roles come from the tree itself (highlighted even when unchanged);
    // 'cascade' only exists as a change.
    const m = new Map<string, ChangeRole>()
    plan?.changes.forEach(c => { if (c.role === 'cascade') m.set(c.skillId, 'cascade') })
    if (selected) {
      const { direct, deeper } = prerequisites(selected)
      deeper.forEach(id => m.set(id, 'deeper'))
      direct.forEach(id => m.set(id, 'direct'))
      m.set(selected, 'target')
    }
    return m
  }, [plan, selected])

  const pos = useMemo(() => new Map(layout.nodes.map(n => [n.id, n])), [layout])
  const height = layout.rows.length * ROW_H

  const apply = () => {
    if (!plan) return
    const drops = plan.changes.filter(c => c.after.score < c.before.score)
    const lines = [
      `${profile.name}: ${plan.changes.length} ${plan.changes.length === 1 ? 'vaardigheid' : 'vaardigheden'} aanpassen?`,
      ...drops.map(c => `⚠ ${nameOf(c.skillId)} zakt van ${c.before.score} naar ${c.after.score}`),
    ]
    if (!confirm(lines.join('\n'))) return
    onApply(plan.profile)
    setFlash(`✓ ${mode === 'open' ? 'Geopend' : 'Beheerst'}: ${nameOf(plan.skillId)}`)
    setSelected(null)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F4FF',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 14px', fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 430 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: '#333', margin: 0 }}>
            Voortgang · {profile.name}
          </h1>
          <button onClick={onClose} style={{
            background: '#FF6B35', color: 'white', border: 'none', borderRadius: 12,
            padding: '8px 18px', fontFamily: 'Fredoka One, cursive', fontSize: 16, cursor: 'pointer',
          }}>← Terug</button>
        </div>
        <p style={{ fontSize: 12.5, color: '#666', margin: '0 0 12px', lineHeight: 1.45 }}>
          Tik een vaardigheid aan. <b>Open hier</b>: die start op {OPEN_TARGET_SCORE}, de directe voorwaarden
          op {DIRECT_PREREQ_SCORE}, alles daarvoor op {DEEP_PREREQ_SCORE}. <b>Beheerst</b>: die en alles
          daarvoor op {MASTERED_SCORE}. Scores van voorwaarden gaan nooit omlaag.
        </p>

        {flash && (
          <div style={{
            background: '#E3F6EC', color: '#22704A', borderRadius: 10, padding: '8px 12px',
            fontSize: 13, fontWeight: 700, marginBottom: 10,
          }}>{flash}</div>
        )}

        {/* Tree */}
        <div style={{
          position: 'relative', width: '100%', height,
          background: 'white', borderRadius: 16, border: '2px solid #EEE',
        }}>
          <svg
            width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0 }}
          >
            {layout.edges.map(e => {
              const a = pos.get(e.from)!, b = pos.get(e.to)!
              const x1 = a.x * 100, y1 = a.row * ROW_H + (ROW_H + NODE_H) / 2
              const x2 = b.x * 100, y2 = b.row * ROW_H + (ROW_H - NODE_H) / 2
              const my = (y1 + y2) / 2
              const hot = selected !== null && roleOf.has(e.from) && roleOf.has(e.to)
                && roleOf.get(e.from) !== 'cascade'
              return (
                <path
                  key={`${e.from}>${e.to}`}
                  d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
                  fill="none"
                  stroke={hot ? '#555' : '#D6D0E4'}
                  strokeWidth={hot ? 2 : 1.25}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>

          {layout.nodes.map(n => {
            const skill = byId.get(n.id)!
            const state = profile.skills[n.id]
            const selectable = canOverride(n.id)
            const role = roleOf.get(n.id)
            const isSel = selected === n.id
            const ring = role ? ROLE_COLOR[role] : state?.unlocked ? '#B8B0CC' : '#E4E0EC'
            return (
              <button
                key={n.id}
                disabled={!selectable}
                onClick={() => { setSelected(id => (id === n.id ? null : n.id)); setFlash(null) }}
                title={selectable ? skill.name : `Nog niet beschikbaar (${blockedBy(n.id).join(', ')})`}
                style={{
                  position: 'absolute',
                  left: `${(n.x - NODE_W / 2) * 100}%`,
                  top: n.row * ROW_H + (ROW_H - NODE_H) / 2,
                  width: `${NODE_W * 100}%`, height: NODE_H,
                  padding: '3px 4px', boxSizing: 'border-box',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                  background: isSel ? '#FFF0E8' : selectable ? 'white' : '#F4F2F7',
                  border: `${role ? 2.5 : 1.5}px ${role === 'cascade' ? 'dashed' : 'solid'} ${ring}`,
                  borderRadius: 10,
                  opacity: selectable ? 1 : 0.5,
                  cursor: selectable ? 'pointer' : 'not-allowed',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                <span style={{
                  fontSize: 10.5, lineHeight: 1.15, color: '#333', fontWeight: 700,
                  textAlign: 'center', overflow: 'hidden',
                }}>{skill.name}</span>
                <span style={{ fontSize: 11, color: state?.unlocked ? '#555' : '#AAA', fontWeight: 700 }}>
                  {selectable ? statusLabel(state) : '⛔'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 11, color: '#777', margin: '8px 2px 14px' }}>
          <span>🔒 vergrendeld</span><span>📦 gearchiveerd</span><span>⛔ nog niet gebouwd</span>
          {selected && (Object.keys(ROLE_COLOR) as ChangeRole[]).map(r => (
            <span key={r} style={{ color: ROLE_COLOR[r], fontWeight: 700 }}>■ {ROLE_LABEL[r]}</span>
          ))}
        </div>

        {/* Action panel */}
        {selected && plan && (
          <section style={{ background: 'white', border: '2px solid #EEE', borderRadius: 16, padding: '12px 14px' }}>
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 17, color: '#333', marginBottom: 8 }}>
              {nameOf(selected)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <ModeButton active={mode === 'open'} onClick={() => setMode('open')}>
                Open hier ({OPEN_TARGET_SCORE})
              </ModeButton>
              <ModeButton active={mode === 'mastered'} onClick={() => setMode('mastered')}>
                Beheerst ({MASTERED_SCORE})
              </ModeButton>
            </div>

            {plan.changes.length === 0 ? (
              <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic', marginBottom: 10 }}>
                Niets te veranderen — staat al zo.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', fontSize: 12.5 }}>
                {plan.changes.map(c => <ChangeRow key={c.skillId} change={c} />)}
              </ul>
            )}

            <button
              onClick={apply}
              disabled={plan.changes.length === 0}
              style={{
                width: '100%', padding: '11px', border: 'none', borderRadius: 12,
                fontFamily: 'Fredoka One, cursive', fontSize: 16, color: 'white',
                background: plan.changes.length === 0 ? '#CCC' : '#FF6B35',
                cursor: plan.changes.length === 0 ? 'default' : 'pointer',
              }}
            >Toepassen</button>
          </section>
        )}
      </div>
    </div>
  )
}

const ROLE_LABEL: Record<ChangeRole, string> = {
  target: 'gekozen',
  direct: 'directe voorwaarde',
  deeper: 'eerdere voorwaarde',
  cascade: 'gaat mee open',
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
      fontFamily: 'Fredoka One, cursive', fontSize: 14,
      background: active ? '#333' : 'white', color: active ? 'white' : '#555',
      border: `2px solid ${active ? '#333' : '#DDD'}`,
    }}>{children}</button>
  )
}

function describe(s: SkillState): string {
  if (!s.unlocked) return '🔒'
  return s.archived ? `📦 ${s.score}` : `${s.score}`
}

function ChangeRow({ change }: { change: SkillChange }) {
  const drop = change.after.score < change.before.score
  return (
    <li style={{
      display: 'flex', justifyContent: 'space-between', gap: 8,
      padding: '4px 0', borderBottom: '1px solid #F2F2F2',
    }}>
      <span>
        <span style={{ color: ROLE_COLOR[change.role], fontWeight: 700 }}>■</span>{' '}
        {nameOf(change.skillId)}
      </span>
      <span style={{ whiteSpace: 'nowrap', fontWeight: 700, color: drop ? '#C62828' : '#333' }}>
        {describe(change.before)} → {describe(change.after)}
      </span>
    </li>
  )
}
