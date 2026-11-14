import { useMemo, useState } from 'react'
import type { AppState, Profile } from '../state/types'
import { SKILLS } from '../curriculum/skills'
import { createProfile } from '../state/storage'
import { diagnostics } from '../engine/diagnostics'
import { exerciseFactors, FACTOR_CAP } from '../engine/weightFactors'
import { getAllExerciseIds } from '../exercises/registry'
import { SkillTreeScreen } from './SkillTreeScreen'
import type { SyncControls } from '../sync/useSync'
import { loadDeviceSettings, saveDeviceSettings } from '../state/deviceSettings'

// Ensure the registry is populated even if no exercise screen rendered yet.
import '../exercises/index'

interface Props {
  appState: AppState
  onSelectProfile: (profileId: string) => void
  onClose: () => void
  onAppStateChange: (next: AppState) => void
  onOpenDebug: () => void
  sync: SyncControls
}

export function AdminMode({ appState, onSelectProfile, onClose, onAppStateChange, onOpenDebug, sync }: Props) {
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)
  const [treeProfileId, setTreeProfileId] = useState<string | null>(null)
  const [device, setDevice] = useState(loadDeviceSettings)
  const toggleFlagButton = () => {
    const next = { ...device, flagButton: !device.flagButton }
    saveDeviceSettings(next)
    setDevice(next)
  }

  const addProfile = () => {
    const name = prompt('Naam van het kind:')
    if (!name?.trim()) return
    const profile = createProfile(name.trim())
    onAppStateChange({
      ...appState,
      profiles: [...appState.profiles, profile],
      activeProfileId: appState.activeProfileId ?? profile.id,
    })
    // Logged in: a new profile belongs to the account from the start.
    if (sync.view.signedIn) void uploadProfile(profile)
  }

  const uploadProfile = async (profile: Profile) => {
    const error = await sync.upload(profile)
    if (error) alert(`Uploaden mislukt: ${error}`)
  }

  const deleteProfile = async (id: string) => {
    const profile = appState.profiles.find(p => p.id === id)
    const linked = sync.view.linked.includes(id)
    if (linked && sync.view.signedIn) {
      // In the account: deleting means deleting everywhere, history included.
      if (!confirm(
        `Profiel "${profile?.name}" verwijderen?\n\n` +
        'Dit wist ook alle online gegevens van dit kind (voortgang en antwoorden), op alle toestellen. ' +
        'Dit kan niet ongedaan worden gemaakt.',
      )) return
      const error = await sync.deleteChild(id)
      if (error) { alert(`Verwijderen mislukt: ${error}`); return }
    } else if (linked) {
      if (!confirm(
        `Profiel "${profile?.name}" van dit toestel verwijderen?\n\n` +
        'Je bent niet ingelogd: het profiel blijft in het account bewaard en komt terug bij de volgende login.',
      )) return
    } else if (!confirm(`Profiel "${profile?.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    const remaining = appState.profiles.filter(p => p.id !== id)
    const activeProfileId = appState.activeProfileId === id
      ? (remaining[0]?.id ?? null)
      : appState.activeProfileId
    onAppStateChange({ ...appState, profiles: remaining, activeProfileId })
  }

  // Progress override sub-screen (🌳 on a profile card). Looked up fresh from
  // appState each render so the tree shows the profile as just saved.
  const treeProfile = appState.profiles.find(p => p.id === treeProfileId)
  if (treeProfile) {
    return (
      <SkillTreeScreen
        profile={treeProfile}
        onClose={() => setTreeProfileId(null)}
        onApply={updated => onAppStateChange({
          ...appState,
          profiles: appState.profiles.map(p => (p.id === updated.id ? updated : p)),
        })}
      />
    )
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
                onDelete={() => { void deleteProfile(profile.id) }}
                onToggleInspect={() => setExpandedProfileId(id => (id === profile.id ? null : profile.id))}
                onOpenTree={() => setTreeProfileId(profile.id)}
                cloud={!sync.view.signedIn ? null : sync.view.linked.includes(profile.id) ? 'linked' : 'local'}
                onUpload={() => {
                  if (confirm(
                    `"${profile.name}" naar je account uploaden?\n\n` +
                    'Doe dit op één toestel per kind (dat met de beste voortgang). ' +
                    'Upload je hetzelfde kind ook vanaf een ander toestel, dan staat het er dubbel in.',
                  )) void uploadProfile(profile)
                }}
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

        {sync.available && <AccountSection sync={sync} />}

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18, color: '#666', marginBottom: 12 }}>Ontwikkelaars</h2>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            fontFamily: 'Nunito, sans-serif', fontSize: 15, color: '#333', cursor: 'pointer',
          }}>
            <input type="checkbox" checked={device.flagButton} onChange={toggleFlagButton}
              style={{ width: 20, height: 20 }} />
            <span>⚑ Markeerknop tijdens het spelen <span style={{ color: '#888', fontSize: 13 }}>
              (op dit toestel — markeert de oefening in de gegevens om later te bekijken)</span></span>
          </label>
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

// Account: log in to keep progress in the parent's account (other devices,
// lost browser storage). Without a login the app is the local-only app.
function AccountSection({ sync }: { sync: SyncControls }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { view } = sync

  const input = {
    width: '100%', padding: '10px 12px', marginBottom: 8, boxSizing: 'border-box' as const,
    border: '2px solid #EEE', borderRadius: 12, fontFamily: 'Nunito, sans-serif', fontSize: 15,
  }
  const button = {
    padding: '10px 16px', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontFamily: 'Fredoka One, cursive', fontSize: 15,
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await sync.signIn(email, password))
    setBusy(false)
    setPassword('')
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18, color: '#666', marginBottom: 12 }}>Account</h2>
      <div style={{ background: 'white', border: '2px solid #EEE', borderRadius: 16, padding: '14px 16px' }}>
        {view.signedIn ? (
          <>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
              Ingelogd als <b>{sync.email ?? '…'}</b>
            </div>
            <div style={{ fontSize: 12, color: view.phase === 'error' ? '#b3431f' : '#999', marginBottom: 12 }}>
              {view.phase === 'syncing' ? 'Bezig met synchroniseren…'
                : view.phase === 'error' ? `Synchroniseren mislukt, wordt opnieuw geprobeerd (${view.error})`
                : view.lastSyncAt ? `Laatst gesynchroniseerd om ${new Date(view.lastSyncAt).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}`
                : 'Nog niet gesynchroniseerd'}
              {view.pending > 0 && ` · ${view.pending} ${view.pending === 1 ? 'antwoord wacht' : 'antwoorden wachten'} op upload`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { void sync.syncNow() }} disabled={view.phase === 'syncing'}
                style={{ ...button, background: '#4CC9F0', color: 'white', flex: 1 }}>Nu synchroniseren</button>
              <button onClick={() => { void sync.signOut() }}
                style={{ ...button, background: '#F2F2F2', color: '#666' }}>Uitloggen</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>
              Log in om de voortgang in je account te bewaren en op andere toestellen te gebruiken.
              Zonder login blijft alles alleen op dit toestel.
            </div>
            <input type="email" autoComplete="username" placeholder="E-mailadres" required
              value={email} onChange={e => setEmail(e.target.value)} style={input} />
            <input type="password" autoComplete="current-password" placeholder="Wachtwoord" required
              value={password} onChange={e => setPassword(e.target.value)} style={input} />
            {error && <div style={{ fontSize: 12, color: '#b3431f', marginBottom: 8 }}>Inloggen mislukt: {error}</div>}
            <button type="submit" disabled={busy}
              style={{ ...button, background: '#FF6B35', color: 'white', width: '100%' }}>
              {busy ? 'Bezig…' : 'Inloggen'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function ProfileCard({ profile, active, inspecting, onSelect, onDelete, onToggleInspect, onOpenTree, cloud, onUpload }: {
  cloud: 'linked' | 'local' | null   // null = not logged in, no account state shown
  onUpload: () => void
  profile: Profile
  active: boolean
  inspecting: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleInspect: () => void
  onOpenTree: () => void
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
          {cloud === 'linked' && ' · ☁️ in account'}
          {cloud === 'local' && ' · alleen op dit toestel'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {active && <span style={{ fontFamily: 'Fredoka One, cursive', color: '#FF6B35', fontSize: 14 }}>Actief</span>}
        {cloud === 'local' && (
          <button onClick={e => { e.stopPropagation(); onUpload() }} title="Naar account uploaden" style={{
            background: 'none', border: '1.5px solid #4CC9F0', borderRadius: 8,
            padding: '4px 8px', cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }}>☁️⬆</button>
        )}
        <button onClick={e => { e.stopPropagation(); onToggleInspect() }} style={{
          background: inspecting ? '#EEE' : 'none', border: '1.5px solid #EEE', borderRadius: 8,
          padding: '4px 8px', cursor: 'pointer', fontSize: 16,
          lineHeight: 1,
        }}>📊</button>
        <button onClick={e => { e.stopPropagation(); onOpenTree() }} title="Voortgang instellen" style={{
          background: 'none', border: '1.5px solid #EEE', borderRadius: 8,
          padding: '4px 8px', cursor: 'pointer', fontSize: 16,
          lineHeight: 1,
        }}>🌳</button>
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
// profile's persisted answer stream. Exercise manipulation stays in DebugMode;
// the one write path here is the progress override (🌳 → SkillTreeScreen).
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
