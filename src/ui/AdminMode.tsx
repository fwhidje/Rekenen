import type { AppState, Profile } from '../state/types'
import { SKILLS } from '../curriculum/skills'
import { createProfile } from '../state/storage'

interface Props {
  appState: AppState
  onSelectProfile: (profileId: string) => void
  onClose: () => void
  onAppStateChange: (next: AppState) => void
}

export function AdminMode({ appState, onSelectProfile, onClose, onAppStateChange }: Props) {
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
            />
          ))}
          <button onClick={addProfile} style={{
            width: '100%', padding: '12px', marginTop: 8,
            fontFamily: 'Fredoka One, cursive', fontSize: 16,
            background: 'white', border: '2px dashed #CCC', borderRadius: 16,
            color: '#999', cursor: 'pointer',
          }}>+ Nieuw profiel</button>
        </section>
      </div>
    </div>
  )
}

function ProfileCard({ profile, active, onSelect }: { profile: Profile; active: boolean; onSelect: () => void }) {
  return (
    <div onClick={onSelect} style={{
      background: active ? '#FFF0E8' : 'white',
      border: `2px solid ${active ? '#FF6B35' : '#EEE'}`,
      borderRadius: 16, padding: '12px 16px', marginBottom: 8,
      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18, color: '#333' }}>{profile.name}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {SKILLS.filter(s => profile.skills[s.id]?.unlocked).length} / {SKILLS.length} vaardigheden ontgrendeld
        </div>
      </div>
      {active && <span style={{ fontFamily: 'Fredoka One, cursive', color: '#FF6B35', fontSize: 14 }}>Actief</span>}
    </div>
  )
}
