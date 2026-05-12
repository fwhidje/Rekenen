import type { AppState, Profile } from '../state/types'
import { SKILLS } from '../curriculum/skills'
import { createProfile } from '../state/storage'

interface Props {
  appState: AppState
  onSelectProfile: (profileId: string) => void
  onClose: () => void
  onAppStateChange: (next: AppState) => void
  onOpenDebug: () => void
}

export function AdminMode({ appState, onSelectProfile, onClose, onAppStateChange, onOpenDebug }: Props) {
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
      minHeight: '100vh', background: '#F8F4FF',
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
            <ProfileCard
              key={profile.id}
              profile={profile}
              active={profile.id === appState.activeProfileId}
              onSelect={() => { onSelectProfile(profile.id); onClose() }}
              onDelete={() => deleteProfile(profile.id)}
            />
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

function ProfileCard({ profile, active, onSelect, onDelete }: { profile: Profile; active: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <div style={{
      background: active ? '#FFF0E8' : 'white',
      border: `2px solid ${active ? '#FF6B35' : '#EEE'}`,
      borderRadius: 16, padding: '12px 16px', marginBottom: 8,
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
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          background: 'none', border: '1.5px solid #EEE', borderRadius: 8,
          padding: '4px 8px', cursor: 'pointer', fontSize: 16, color: '#CCC',
          lineHeight: 1,
        }}>🗑</button>
      </div>
    </div>
  )
}
