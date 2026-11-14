import { useState, useEffect } from 'react'
import type { AppState } from '../state/types'
import { loadAppState, saveAppState, createProfile } from '../state/storage'
import { KidMode } from './KidMode'
import { AdminMode } from './AdminMode'
import { DebugMode } from './DebugMode'
import { SharedDefs } from '../presentation/nature/Defs'
import { stampState } from '../sync/progressMerge'
import { useSync } from '../sync/useSync'

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

  // Account sync (optional — inert without a configured backend or a login).
  const syncControls = useSync(appState, setAppState)

  // The single commit point for changes made on this device: every skill whose
  // state changed gets its change time, which is what account sync merges on.
  const commit = (update: (s: AppState) => AppState) =>
    setAppState(prev => stampState(prev, update(prev), Date.now()))

  const activeProfile = appState.profiles.find(p => p.id === appState.activeProfileId)

  if (screen === 'debug') {
    return <><SharedDefs /><DebugMode onClose={() => setScreen('admin')} /></>
  }

  if (!activeProfile || screen === 'admin') {
    return <><SharedDefs /><AdminMode
      appState={appState}
      onSelectProfile={id => setAppState(s => ({ ...s, activeProfileId: id }))}
      sync={syncControls}
      onClose={() => setScreen('kid')}
      onAppStateChange={next => commit(() => next)}
      onOpenDebug={() => setScreen('debug')}
    /></>
  }

  return (
    <>
      <SharedDefs />
      <KidMode
        profile={activeProfile}
        onProfileUpdate={updated => {
          commit(s => ({
            ...s,
            profiles: s.profiles.map(p => p.id === updated.id ? updated : p),
          }))
        }}
        onOpenAdmin={() => setScreen('admin')}
      />
    </>
  )
}
