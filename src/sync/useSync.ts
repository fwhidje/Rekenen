import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { AppState, Profile } from '../state/types'
import { diagnostics } from '../engine/diagnostics'
import { applySnapshot } from './progressMerge'
import { supabase, sync } from './client'
import type { SyncView } from './engine'

// ─── React binding for account sync ───────────────────────────────────────────
// Owns WHEN sync happens; the engine owns how. Triggers:
//   full sync (push + pull)  login, app start, back online, tab visible again
//   push only                a few seconds after any profile change, tab hidden
// Every trigger is best-effort: a failure shows in the status and is retried by
// the next trigger. Nothing here can block play.

const PUSH_DEBOUNCE_MS = 4_000
const RESYNC_AFTER_MS = 5 * 60_000

export interface SyncControls {
  available: boolean
  email: string | null
  view: SyncView
  signIn(email: string, password: string): Promise<string | null>  // error message, or null
  signOut(): Promise<void>
  syncNow(): Promise<void>
  upload(profile: Profile): Promise<string | null>
  deleteChild(profileId: string): Promise<string | null>
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e))

export function useSync(appState: AppState, setAppState: Dispatch<SetStateAction<AppState>>): SyncControls {
  const view = useSyncExternalStore(sync.subscribe, sync.getView)
  const [email, setEmail] = useState<string | null>(null)
  const profilesRef = useRef(appState.profiles)
  profilesRef.current = appState.profiles

  const syncNow = useCallback(async () => {
    if (!sync.getView().signedIn) return
    try {
      await sync.push(profilesRef.current)
      const known = new Set(profilesRef.current.map(p => p.id))
      const snap = await sync.pull()
      setAppState(s => applySnapshot(s, snap))
      // Children new to this device: bring their recent history along so the
      // weight factors continue instead of restarting at ×1.
      for (const child of snap.children) {
        if (!known.has(child.id)) diagnostics.importRecords(await sync.seedRecords(child.id))
      }
    } catch {
      // Shown via view.error; the next trigger retries.
    }
  }, [setAppState])

  // Session: restore on load, follow sign-in / sign-out.
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes fire often and change nothing we track.
      if (event === 'TOKEN_REFRESHED') return
      const userId = session?.user.id ?? null
      const was = sync.getView().signedIn
      sync.setUser(userId)
      setEmail(session?.user.email ?? null)
      // Defer: Supabase forbids calling back into the client from this callback.
      if (userId && !was) setTimeout(() => { void syncNow() }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [syncNow])

  // Push shortly after local changes.
  useEffect(() => {
    if (!view.signedIn) return
    const t = setTimeout(() => { sync.push(profilesRef.current).catch(() => {}) }, PUSH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [appState.profiles, view.pending, view.signedIn])

  // Connectivity + visibility.
  useEffect(() => {
    if (!sync.available) return
    const onOnline = () => { void syncNow() }
    const onVisibility = () => {
      const v = sync.getView()
      if (!v.signedIn) return
      if (document.visibilityState === 'hidden') {
        sync.push(profilesRef.current).catch(() => {})
      } else if (Date.now() - (v.lastSyncAt ?? 0) > RESYNC_AFTER_MS) {
        void syncNow()
      }
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [syncNow])

  const signIn = useCallback(async (mail: string, password: string) => {
    if (!supabase) return 'Synchronisatie is niet ingesteld'
    const { error } = await supabase.auth.signInWithPassword({ email: mail.trim(), password })
    return error ? error.message : null
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    try { await sync.push(profilesRef.current) } catch { /* stays queued on this device */ }
    await supabase.auth.signOut()
  }, [])

  const upload = useCallback(async (profile: Profile) => {
    try {
      const stamped = await sync.upload(profile, diagnostics.getAll(profile.id))
      setAppState(s => ({ ...s, profiles: s.profiles.map(p => (p.id === stamped.id ? { ...p, skills: mergeStamps(p, stamped) } : p)) }))
      return null
    } catch (e) {
      return message(e)
    }
  }, [setAppState])

  const deleteChild = useCallback(async (profileId: string) => {
    try {
      await sync.deleteChild(profileId)
      return null
    } catch (e) {
      return message(e)
    }
  }, [])

  return { available: sync.available, email, view, signIn, signOut, syncNow, upload, deleteChild }
}

// The upload stamped change times on a snapshot of the profile. The child may
// have answered meanwhile — keep the current state, only adopt a stamp where
// the current skill has none.
function mergeStamps(current: Profile, stamped: Profile): Profile['skills'] {
  const skills = { ...current.skills }
  for (const [id, s] of Object.entries(stamped.skills)) {
    const cur = skills[id]
    if (cur && cur.updatedAt === undefined && s.updatedAt !== undefined) skills[id] = { ...cur, updatedAt: s.updatedAt }
  }
  return skills
}
