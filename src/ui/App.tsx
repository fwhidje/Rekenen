import { useState, useEffect } from 'react'
import type { AppState } from '../state/types'
import { loadAppState, saveAppState, createProfile } from '../state/storage'
import { KidMode } from './KidMode'
import { AdminMode } from './AdminMode'
import { DebugMode } from './DebugMode'

type Screen = 'kid' | 'admin' | 'debug'

export function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const loaded = loadAppState()
    if (loaded.profiles.length === 0) {
      const profile = createProfile('Speler 1')
      return { profiles: [profile], activeProfileId: profile.id }
    }
    return loaded
  })
  const [screen, setScreen] = useState<Screen>('kid')

  useEffect(() => { saveAppState(appState) }, [appState])

  const activeProfile = appState.profiles.find(p => p.id === appState.activeProfileId)

  if (screen === 'debug') {
    return <DebugMode onClose={() => setScreen('admin')} />
  }

  if (!activeProfile || screen === 'admin') {
    return <AdminMode
      appState={appState}
      onSelectProfile={id => setAppState(s => ({ ...s, activeProfileId: id }))}
      onClose={() => setScreen('kid')}
      onAppStateChange={next => { setAppState(next); saveAppState(next) }}
      onOpenDebug={() => setScreen('debug')}
    />
  }

  return (
    <KidMode
      profile={activeProfile}
      onProfileUpdate={updated => {
        setAppState(s => ({
          ...s,
          profiles: s.profiles.map(p => p.id === updated.id ? updated : p),
        }))
      }}
      onOpenAdmin={() => setScreen('admin')}
    />
  )
}
