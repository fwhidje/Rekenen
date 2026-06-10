import { useMemo, useState } from 'react'
import type { AppState, Profile } from '../state/types'
import { SKILLS } from '../curriculum/skills'
import { createProfile } from '../state/storage'
import { diagnostics } from '../engine/diagnostics'
import { exerciseFactors, FACTOR_CAP } from '../engine/weightFactors'
import { getAllExerciseIds } from '../exercises/registry'

// Ensure the registry is populated even if no exercise screen rendered yet.
import '../exercises/index'

interface Props {
  appState: AppState
  onSelectProfile: (profileId: string) => void
  onClose: () => void
  onAppStateChange: (next: AppState) => void
  onOpenDebug: () => void
}

export function AdminMode({ appState, onSelectProfile, onClose, onAppStateChange, onOpenDebug }: Props) {
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)

  const addProfile = () => {
    const name = prompt('Naam van het kind:')
    if (!name?.trim()) return
    const profile = createProfile(name.trim())
    onAppStateChange({
      ...appState,
      profiles: [...appState.profiles, profile],
      activeProfileId: appState.activeProfileId ?? profile.id,
    })
  }

  const deleteProfile = (id: string) => {
    const profile = appState.profiles.find(p => p.id === id)
    if (!confirm(`Profiel "${profile?.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    const remaining = appState.profiles.filter(p => p.id !== id)
    const activeProfileId = appState.activeProfileId === id
      ? (remaining[0]?.id ?? null)
      : appState.activeProfileId
    onAppStateChange({ ...appState, profiles: remaining, activeProfileId })
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F4FF',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 14px', fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 430 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 26, color: '#333', margin: 0 }}>Opties</h1>
          <button onClick={onClose} style={{
            background: '#FF6B35', color: 'white', border: 'none', borderRadius: 12,
            padding: '8px 18px', fontFamily: 'Fredoka One, cursive', fontSize: 16, cursor: 'pointer',
          }}>← Terug</button>
        </div>

        {/* Profiles */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18, color: '#666', marginBottom: 12 }}>Profielen</h2>
          {appState.profiles.map(profile => (
            <div key={profile.id}>
              <ProfileCard
                profile={profile}
                active={profile.id === appState.activeProfileId}
                inspecting={profile.id === expandedProfileId}
                onSelect={() => { onSelectProfile(profile.id); onClose() }}
                onDelete={() => deleteProfile(profile.id)}
                onToggleInspect={() => setExpandedProfileId(id => (id === profile.id ? null : profile.id))}
              />
              {profile.id === expandedProfileId && <ProfileInspector profile={profile} />}
            </div>
          ))}
          <button onClick={addProfile} style={{
            width: '100%', padding: '12px', marginTop: 8,
            fontFamily: 'Fredoka One, cursive', fontSize: 16,
            background: 'white', border: '2px dashed #CCC', borderRadius: 16,
            color: '#999', cursor: 'pointer',
          }}>+ Nieuw profiel</button>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18, color: '#666', marginBottom: 12 }}>Ontwikkelaars</h2>
          <button onClick={onOpenDebug} style={{
            width: '100%', padding: '12px',
            fontFamily: 'Fredoka One, cursive', fontSize: 16,
            background: '#4CC9F0', color: 'white', border: 'none', borderRadius: 16,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(76,201,240,.35)',
          }}>🛠 Debug oefeningen</button>
        </section>
      </div>
    </div>
  )
}

function ProfileCard({ profile, active, inspecting, onSelect, onDelete, onToggleInspect }: {
  profile: Profile
  active: boolean
  inspecting: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleInspect: () => void
}) {
  return (
    <div style={{
      background: active ? '#FFF0E8' : 'white',
      border: `2px solid ${active ? '#FF6B35' : '#EEE'}`,
      borderRadius: 16, padding: '12px 16px', marginBottom: inspecting ? 0 : 8,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div onClick={onSelect} style={{ cursor: 'pointer', flex: 1 }}>
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18, color: '#333' }}>{profile.name}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {SKILLS.filter(s => profile.skills[s.id]?.unlocked).length} / {SKILLS.length} vaardigheden ontgrendeld
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {active && <span style={{ fontFamily: 'Fredoka One, cursive', color: '#FF6B35', fontSize: 14 }}>Actief</span>}
        <button onClick={e => { e.stopPropagation(); onToggleInspect() }} style={{
          background: inspecting ? '#EEE' : 'none', border: '1.5px solid #EEE', borderRadius: 8,
          padding: '4px 8px', cursor: 'pointer', fontSize: 16,
          lineHeight: 1,
        }}>📊</button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          background: 'none', border: '1.5px solid #EEE', borderRadius: 8,
          padding: '4px 8px', cursor: 'pointer', fontSize: 16, color: '#CCC',
          lineHeight: 1,
        }}>🗑</button>
      </div>
    </div>
  )
}

// Read-only state inspector: per skill the score (the scaffolding dial + unlock
// gate) and per exercise the live dynamic weight factor, derived from the
// profile's persisted answer stream. Manipulation tools stay in DebugMode.
function ProfileInspector({ profile }: { profile: Profile }) {
  const registered = useMemo(() => new Set(getAllExerciseIds()), [])
  const records = useMemo(() => diagnostics.getAll(profile.id), [profile.id])

  // Skip skills that are locked AND recordless — they have no state worth showing.
  const visibleSkills = SKILLS.filter(skill => {
    const state = profile.skills[skill.id]
    return state?.unlocked || state?.archived || records.some(r => r.skillId === skill.id)
  })

  return (
    <div style={{
      background: 'white', border: '2px solid #EEE', borderTop: 'none',
      borderRadius: '0 0 16px 16px', padding: '10px 16px 12px', marginBottom: 8,
      fontSize: 12, color: '#555',
    }}>
      {visibleSkills.length === 0 ? (
        <div style={{ fontStyle: 'italic', color: '#999' }}>Nog geen voortgang.</div>
      ) : visibleSkills.map(skill => {
        const state = profile.skills[skill.id]
        const factors = exerciseFactors(records, skill.id)
        const exercises = skill.applicableExercises.filter(id => registered.has(id))
        const status = state?.archived ? '📦 gearchiveerd' : state?.unlocked ? '✓ actief' : '🔒 vergrendeld'
        return (
          <div key={skill.id} style={{ padding: '6px 0', borderBottom: '1px solid #F2F2F2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, color: '#333' }}>{skill.name}</span>
              <span style={{ whiteSpace: 'nowrap' }}>
                <b>{state?.score ?? 0}</b>/100 · {status}
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
              {exercises.map(exId => {
                const factor = factors[exId] ?? 1
                const pinned = factor >= FACTOR_CAP
                return (
                  <span key={exId} style={{
                    color: pinned ? '#b3431f' : factor > 1 ? '#8a6210' : '#999',
                    fontWeight: factor > 1 ? 700 : 400,
                  }}>
                    {pinned ? '⚠ ' : ''}{exId} ×{factor.toFixed(2)}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
      <div style={{ marginTop: 6, fontSize: 10.5, color: '#AAA' }}>
        ×factor = dynamisch gewicht per oefening (fout +0.5, juist −0.25, bereik [1, {FACTOR_CAP}]) — ⚠ zit op het plafond
      </div>
    </div>
  )
}
