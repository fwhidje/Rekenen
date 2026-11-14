import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SyncEngine } from './engine'
import type { SyncState, SyncStore } from './engine'
import { createSupabaseRemote } from './remote'

// ─── Wiring ───────────────────────────────────────────────────────────────────
// The account backend is optional. Without the two build variables the app is
// exactly the local-only app: no client, no network, no account section.
// Both values are public by design — the database's access rules protect the
// data, not the secrecy of this key.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

const STORAGE_KEY = 'rekenen_v2_sync'

const localStore: SyncStore = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SyncState) : null
    } catch {
      return null
    }
  },
  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
}

// Process-wide singleton, like `diagnostics`.
export const sync = new SyncEngine(supabase ? createSupabaseRemote(supabase) : null, localStore)
