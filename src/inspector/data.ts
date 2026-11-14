import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Child, EventRow } from './model'

// ─── Inspector data access (read-only) ───────────────────────────────────────
// Its own Supabase client from the same two build variables as the app. It
// shares the app's login (same origin, same browser storage), but not the
// app's sync engine: the inspector never queues, pushes or deletes anything.
// Only `select` is used here — `inspectorIsolation.test.ts` tripwires it.
//
// What a login can see is decided by the database (row level security in
// supabase/migrations/0001): only the logged-in parent's own children.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const client: SupabaseClient | null = url && key ? createClient(url, key) : null

// PostgREST returns at most 1000 rows per request on Supabase's default
// settings, so larger periods are read in pages.
const PAGE = 1000
// Safety stop for the "Alles" period; well above a year of daily play.
export const MAX_ROWS = 50_000

export async function fetchChildren(c: SupabaseClient): Promise<Child[]> {
  const [children, names] = await Promise.all([
    c.from('children').select('id, created_at').order('created_at'),
    c.from('child_names').select('child_id, name'),
  ])
  if (children.error) throw new Error(children.error.message)
  if (names.error) throw new Error(names.error.message)
  const nameOf = new Map((names.data ?? []).map(n => [n.child_id as string, n.name as string]))
  return (children.data ?? []).map(ch => ({
    id: ch.id as string,
    name: nameOf.get(ch.id as string) ?? 'Naamloos',
  }))
}

// All answers of one child (or of every child, for the export) since `since`
// (ISO), newest first. Selects '*' so it works before and after migration 0002.
export async function fetchEvents(
  c: SupabaseClient,
  opts: { childId: string | null; since: string | null },
): Promise<{ rows: EventRow[]; truncated: boolean }> {
  const rows: EventRow[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    let q = c.from('answer_events').select('*')
    if (opts.childId) q = q.eq('child_id', opts.childId)
    if (opts.since) q = q.gte('occurred_at', opts.since)
    const res = await q
      .order('occurred_at', { ascending: false })
      .order('id')
      .range(from, from + PAGE - 1)
    if (res.error) throw new Error(res.error.message)
    const page = (res.data ?? []) as EventRow[]
    rows.push(...page)
    if (page.length < PAGE) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}

// Everything this login can read, for a backup on disk. Answer events and
// progress events are the evidence; progress is the current state.
export async function fetchBackup(c: SupabaseClient): Promise<Record<string, unknown>> {
  const children = await fetchChildren(c)
  const { rows: answers, truncated } = await fetchEvents(c, { childId: null, since: null })
  const progressEvents: unknown[] = []
  for (let from = 0; ; from += PAGE) {
    const res = await c.from('progress_events').select('*').order('occurred_at').order('id').range(from, from + PAGE - 1)
    if (res.error) throw new Error(res.error.message)
    progressEvents.push(...(res.data ?? []))
    if ((res.data ?? []).length < PAGE) break
  }
  const progress = await c.from('child_progress').select('*')
  if (progress.error) throw new Error(progress.error.message)
  return {
    exportedAt: new Date().toISOString(),
    truncated,
    children,
    progress: progress.data ?? [],
    answerEvents: answers,
    progressEvents,
  }
}
