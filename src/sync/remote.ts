import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnswerEventRow, ChildRow, ProgressEventRow, ProgressRow } from './rows'
import type { RemoteSnapshot } from './progressMerge'

// ─── Remote ───────────────────────────────────────────────────────────────────
// Everything the sync engine needs from the account backend. The engine only
// knows this interface; Supabase is one implementation, tests use a fake.

// `permanent` = the server refused the data itself (constraint, access rule):
// retrying the same rows will never work. Anything else (offline, timeout,
// server hiccup) is transient and retried later.
export class SyncError extends Error {
  constructor(message: string, readonly permanent: boolean) {
    super(message)
    this.name = 'SyncError'
  }
}

export interface Remote {
  pull(): Promise<RemoteSnapshot>
  upsertChild(child: ChildRow): Promise<void>
  deleteChild(childId: string): Promise<void>
  pushProgress(rows: ProgressRow[]): Promise<void>
  pushEvents(rows: AnswerEventRow[]): Promise<void>          // duplicates are no-ops
  pushProgressEvents(rows: ProgressEventRow[]): Promise<void> // duplicates are no-ops
  recentEvents(childId: string, limit: number): Promise<Omit<AnswerEventRow, 'meta'>[]>
}

// Postgres error classes that mean "this data will never be accepted":
// 22 data exception, 23 integrity constraint, 42 access rule / syntax.
const PERMANENT = /^(22|23|42)/

function check(error: { message: string; code?: string } | null): void {
  if (!error) return
  throw new SyncError(error.message, PERMANENT.test(error.code ?? ''))
}

const EVENT_COLUMNS =
  'id, child_id, occurred_at, session_id, app_version, skill_id, exercise_id, tier_id, variant, ' +
  'is_retry, op, semantic_form, problem, operand_a, operand_b, correct_answer, given_answer, ' +
  'correct, error_type, score_before, response_time_ms, tap_count, replay_count'

export function createSupabaseRemote(client: SupabaseClient): Remote {
  return {
    async pull() {
      const [children, names, progress] = await Promise.all([
        client.from('children').select('id, created_at'),
        client.from('child_names').select('child_id, name'),
        client.from('child_progress').select('*'),
      ])
      check(children.error); check(names.error); check(progress.error)
      const nameOf = new Map((names.data ?? []).map(n => [n.child_id as string, n.name as string]))
      return {
        children: (children.data ?? []).map(c => ({
          id: c.id as string,
          name: nameOf.get(c.id as string) ?? 'Speler',
          createdAt: Date.parse(c.created_at as string),
        })),
        progress: (progress.data ?? []) as ProgressRow[],
      }
    },

    async upsertChild(child) {
      // parent_id is filled in by the database from the logged-in account.
      const made = await client.from('children')
        .upsert({ id: child.id, created_at: new Date(child.createdAt).toISOString() },
                { onConflict: 'id', ignoreDuplicates: true })
      check(made.error)
      const named = await client.from('child_names')
        .upsert({ child_id: child.id, name: child.name.slice(0, 40) }, { onConflict: 'child_id' })
      check(named.error)
    },

    async deleteChild(childId) {
      check((await client.from('children').delete().eq('id', childId)).error)
    },

    async pushProgress(rows) {
      if (rows.length === 0) return
      check((await client.from('child_progress').upsert(rows, { onConflict: 'child_id,skill_id' })).error)
    },

    async pushEvents(rows) {
      if (rows.length === 0) return
      check((await client.from('answer_events').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })).error)
    },

    async pushProgressEvents(rows) {
      if (rows.length === 0) return
      check((await client.from('progress_events').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })).error)
    },

    async recentEvents(childId, limit) {
      const res = await client.from('answer_events')
        .select(EVENT_COLUMNS)
        .eq('child_id', childId)
        .order('occurred_at', { ascending: false })
        .limit(limit)
      check(res.error)
      return (res.data ?? []) as unknown as Omit<AnswerEventRow, 'meta'>[]
    },
  }
}
