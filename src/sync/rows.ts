import type { AnswerRecord, ErrorType } from '../engine/diagnostics'
import type { Operation, Problem, SemanticForm } from '../curriculum/types'

// ─── Wire shapes ──────────────────────────────────────────────────────────────
// Row types mirror supabase/migrations/0001_accounts_and_evidence.sql. Every
// key is always present (null when unknown): batch inserts need uniform rows.

export interface ChildRow {
  id: string
  name: string
  createdAt: number
}

export interface ProgressRow {
  child_id: string
  skill_id: string
  score: number
  unlocked: boolean
  archived: boolean
  unlocked_at: string | null
  archived_at: string | null
  updated_at: string
}

export interface AnswerEventRow {
  id: string
  child_id: string
  occurred_at: string
  session_id: string | null
  app_version: string
  skill_id: string
  exercise_id: string
  tier_id: string | null
  variant: string | null
  is_retry: boolean
  op: string
  semantic_form: string | null
  problem: Problem | null
  operand_a: number
  operand_b: number
  correct_answer: number
  given_answer: number | null
  correct: boolean
  error_type: string | null
  score_before: number | null
  response_time_ms: number | null
  tap_count: number | null
  replay_count: number | null
  meta: Record<string, unknown> | null
}

export interface ProgressEventRow {
  id: string
  child_id: string
  occurred_at: string
  app_version: string
  kind: string
  skill_id: string | null
  detail: unknown
}

// Records captured before sync existed have no id / version. The id is derived
// from (profile, timestamp) so uploading the same history twice is a no-op.
export const PRE_SYNC_VERSION = 'pre-sync'

export function legacyEventId(profileId: string, timestamp: number): string {
  return profileId.slice(0, 24) + Math.trunc(timestamp).toString(16).padStart(12, '0').slice(-12)
}

// The server rejects meta above 16 kB; stay well under it. Dropping the meta
// loses "what was shown" for that answer but never the answer itself.
const MAX_META_CHARS = 12_000

function boundedMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!meta) return null
  try {
    return JSON.stringify(meta).length <= MAX_META_CHARS ? meta : null
  } catch {
    return null
  }
}

const int = (n: number | undefined): number | null =>
  n !== undefined && Number.isFinite(n) ? Math.round(n) : null

export function toEventRow(r: AnswerRecord): AnswerEventRow {
  return {
    id: r.id ?? legacyEventId(r.profileId, r.timestamp),
    child_id: r.profileId,
    occurred_at: new Date(r.timestamp).toISOString(),
    session_id: r.sessionId ?? null,
    app_version: r.appVersion ?? PRE_SYNC_VERSION,
    skill_id: r.skillId,
    exercise_id: r.exerciseId,
    tier_id: r.tierId ?? null,
    variant: r.variant ?? null,
    is_retry: r.isRetry === true,
    op: r.op,
    semantic_form: r.semanticForm ?? null,
    problem: r.problem ?? null,
    operand_a: Math.round(r.operandA),
    operand_b: Math.round(r.operandB),
    correct_answer: Math.round(r.correctAnswer),
    given_answer: int(r.givenAnswer),
    correct: r.correct,
    error_type: r.errorType,
    score_before: int(r.scoreBefore),
    response_time_ms: int(r.responseTimeMs),
    tap_count: int(r.tapCount),
    replay_count: int(r.replayCount),
    meta: boundedMeta(r.meta),
  }
}

// Back to the local (lean) record — used to seed a new device's history so the
// weight factors continue instead of restarting at ×1. Meta is not restored.
export function fromEventRow(row: Omit<AnswerEventRow, 'meta'>): AnswerRecord {
  const opt = <T,>(v: T | null): T | undefined => (v === null ? undefined : v)
  return {
    id: row.id,
    timestamp: Date.parse(row.occurred_at),
    profileId: row.child_id,
    sessionId: opt(row.session_id),
    appVersion: row.app_version,
    skillId: row.skill_id,
    exerciseId: row.exercise_id,
    tierId: opt(row.tier_id),
    variant: opt(row.variant),
    isRetry: row.is_retry || undefined,
    op: row.op as Operation,
    semanticForm: opt(row.semantic_form) as SemanticForm | undefined,
    problem: opt(row.problem),
    operandA: row.operand_a,
    operandB: row.operand_b,
    correctAnswer: row.correct_answer,
    givenAnswer: opt(row.given_answer),
    correct: row.correct,
    errorType: row.error_type as ErrorType | null,
    scoreBefore: opt(row.score_before),
    responseTimeMs: opt(row.response_time_ms),
    tapCount: opt(row.tap_count),
    replayCount: opt(row.replay_count),
  }
}
