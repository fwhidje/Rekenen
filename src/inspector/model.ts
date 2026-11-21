import type { Problem } from '../curriculum/types'
import { SKILLS_BY_ID } from '../curriculum/skills'
import type { ExerciseQuestion } from '../exercises/types'
import { getAllExerciseIds, getExercise } from '../exercises/registry'
import { THEMES } from '../presentation/themes'
import type { AnswerEventRow } from '../sync/rows'

// ─── Inspector model (pure) ──────────────────────────────────────────────────
// Everything the inspector derives from answer rows, kept free of React and of
// the network so it is unit-tested (model.test.ts). Reads app modules (skills,
// exercise registry, themes); the app never reads this.

// A row as the inspector receives it. Rows written before migration 0002 lack
// the review columns, so they are optional here.
export type EventRow = Omit<AnswerEventRow,
  'flag' | 'scene_theme' | 'scene_background' | 'scene_counter' | 'viewport_w' | 'viewport_h'> &
  Partial<Pick<AnswerEventRow,
    'flag' | 'scene_theme' | 'scene_background' | 'scene_counter' | 'viewport_w' | 'viewport_h'>> & {
    received_at?: string
  }

export interface Child {
  id: string
  name: string
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export type View = 'review' | 'flagged' | 'wrong' | 'all'
export type Period = 'today' | '7' | '30' | 'all'

export const VIEW_LABELS: Record<View, string> = {
  review: 'Te bekijken (fout of gemarkeerd)',
  flagged: 'Gemarkeerd',
  wrong: 'Fout',
  all: 'Alles',
}

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Vandaag',
  '7': '7 dagen',
  '30': '30 dagen',
  all: 'Alles',
}

// Start of the period as an ISO timestamp, or null for no lower bound.
export function periodStart(period: Period, now = new Date()): string | null {
  if (period === 'all') return null
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period !== 'today') d.setDate(d.getDate() - (Number(period) - 1))
  return d.toISOString()
}

export interface Filter {
  view: View
  exercise: string | null
  skill: string | null
}

export function matchesView(row: EventRow, view: View): boolean {
  switch (view) {
    case 'review': return !!row.flag || !row.correct
    case 'flagged': return !!row.flag
    case 'wrong': return !row.correct
    case 'all': return true
  }
}

export function applyFilter(rows: EventRow[], f: Filter): EventRow[] {
  return rows.filter(r =>
    matchesView(r, f.view) &&
    (f.exercise === null || r.exercise_id === f.exercise) &&
    (f.skill === null || r.skill_id === f.skill))
}

// ─── Retry pairing ────────────────────────────────────────────────────────────
// A wrong answer brings the same problem back once, one tier down; the retry is
// the very next answer of that child in that session. Pairs both ways.

export interface RetryLinks {
  retryOf: Map<string, EventRow>     // retry id → the original it re-presents
  retriedBy: Map<string, EventRow>   // original id → its retry
}

export function linkRetries(rows: EventRow[]): RetryLinks {
  const retryOf = new Map<string, EventRow>()
  const retriedBy = new Map<string, EventRow>()
  const byTime = [...rows].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
  const lastOf = new Map<string, EventRow>() // child|session → previous answer
  for (const r of byTime) {
    const key = `${r.child_id}|${r.session_id ?? ''}`
    const prev = lastOf.get(key)
    if (r.is_retry && prev && !prev.is_retry && !prev.correct) {
      retryOf.set(r.id, prev)
      retriedBy.set(prev.id, r)
    }
    lastOf.set(key, r)
  }
  return { retryOf, retriedBy }
}

// ─── Per-exercise summary ─────────────────────────────────────────────────────
// First attempts only (retries would double-count a failure), over every row
// loaded for the child and period — independent of the view filter.

export interface ExerciseSummary {
  exerciseId: string
  answers: number
  wrong: number
  flagged: number           // includes flagged retries
  medianMs: number | null
}

export function summarise(rows: EventRow[]): ExerciseSummary[] {
  const groups = new Map<string, EventRow[]>()
  for (const r of rows) {
    const g = groups.get(r.exercise_id) ?? []
    g.push(r)
    groups.set(r.exercise_id, g)
  }
  const out: ExerciseSummary[] = []
  for (const [exerciseId, g] of groups) {
    const first = g.filter(r => !r.is_retry)
    const times = first.map(r => r.response_time_ms).filter((n): n is number => n !== null).sort((a, b) => a - b)
    out.push({
      exerciseId,
      answers: first.length,
      wrong: first.filter(r => !r.correct).length,
      flagged: g.filter(r => !!r.flag).length,
      medianMs: times.length ? times[Math.floor(times.length / 2)] : null,
    })
  }
  // Most worth a look first: flags, then error rate, then volume.
  return out.sort((a, b) =>
    b.flagged - a.flagged ||
    rate(b) - rate(a) ||
    b.answers - a.answers)
}

const rate = (s: ExerciseSummary) => (s.answers ? s.wrong / s.answers : 0)

// ─── Display helpers ──────────────────────────────────────────────────────────

export function formatProblem(p: Problem | null, fallback: { a: number; b: number; op: string }): string {
  if (!p) return `${fallback.a} ${fallback.op} ${fallback.b}`
  switch (p.op) {
    case '+': return `${p.terms[0]} + ${p.terms[1]}`
    case '-': return `${p.whole} − ${p.part}`
    case 'split': return `${p.partA + p.partB} is ${p.partA} en ${p.partB}`
    case 'count': return `tel ${p.n}`
    case 'half': return `helft van ${p.total}`
  }
}

export function exerciseLabel(id: string): string {
  return isRegistered(id) ? getExercise(id).label : id
}

export function skillLabel(id: string): string {
  return SKILLS_BY_ID[id]?.name ?? id
}

export function tierLabel(exerciseId: string, tierId: string | null): string | null {
  if (!tierId) return null
  if (!isRegistered(exerciseId)) return tierId
  return getExercise(exerciseId).tiers.find(t => t.id === tierId)?.label ?? tierId
}

export function isRegistered(exerciseId: string): boolean {
  return getAllExerciseIds().includes(exerciseId)
}

// What the child answered, in words. For splits the stored correct answer is
// the TOTAL (engine/answer.ts), while the child gave a missing part — which
// part was asked is exercise-specific (in meta), so only the verdict is shown.
export function answerText(row: EventRow, long = false): string {
  const given = row.given_answer ?? '?'
  if (row.op === 'split') {
    return row.correct
      ? (long ? `${given} (goed)` : `gaf ${given}`)
      : `gaf ${given} (fout)${long ? ' — welk deel gevraagd werd staat in de oefening hieronder' : ''}`
  }
  if (row.correct) return long ? `${row.correct_answer} (goed)` : `= ${row.correct_answer}`
  return long ? `gaf ${given} — juist was ${row.correct_answer}` : `gaf ${given}, juist ${row.correct_answer}`
}

// ─── Replay ───────────────────────────────────────────────────────────────────
// Rebuilds the question exactly as served, from the stored row. `meta` is what
// was shown; without it (pre-sync history, or meta over the size cap) only an
// approximation is possible: fresh meta from the generator, with new random
// layout choices (distractors, positions).

export type ReplayResult =
  | { kind: 'exact'; question: ExerciseQuestion }
  | { kind: 'approx'; question: ExerciseQuestion }
  | { kind: 'impossible'; reason: string }

export function rowToQuestion(row: EventRow, allowApprox: boolean): ReplayResult {
  if (!isRegistered(row.exercise_id)) {
    return { kind: 'impossible', reason: `Oefening "${row.exercise_id}" bestaat niet (meer) in deze versie.` }
  }
  if (!row.problem) {
    return { kind: 'impossible', reason: 'Het probleem zelf is niet bewaard (opname van vóór de synchronisatie).' }
  }
  const base = {
    exerciseId: row.exercise_id,
    skillId: row.skill_id,
    problem: row.problem,
    operandA: row.operand_a,
    operandB: row.operand_b,
    op: row.problem.op,
    answer: row.correct_answer,
    isRetry: row.is_retry || undefined,
  }
  if (row.meta) return { kind: 'exact', question: { ...base, meta: row.meta } }
  if (!allowApprox) {
    return { kind: 'impossible', reason: 'Wat er getoond werd is niet bewaard (oude opname, of te groot).' }
  }
  const def = getExercise(row.exercise_id)
  const meta = def.generateMeta(row.operand_a, row.operand_b, row.score_before ?? 0, row.problem, { skillId: row.skill_id ?? undefined })
  return { kind: 'approx', question: { ...base, meta } }
}

export interface ResolvedScene {
  themeIdx: number
  background: number
  counter: number
  recorded: boolean          // false = row predates scene capture; defaults shown
}

export function resolveScene(row: EventRow): ResolvedScene {
  const themeIdx = THEMES.findIndex(t => t.id === row.scene_theme)
  if (themeIdx < 0) return { themeIdx: 0, background: 0, counter: 0, recorded: false }
  const theme = THEMES[themeIdx]
  return {
    themeIdx,
    background: (row.scene_background ?? 0) % theme.backgrounds.length,
    counter: (row.scene_counter ?? 0) % theme.counters.length,
    recorded: true,
  }
}

// Fallback frame for rows without a recorded window size: a common phone.
export const DEFAULT_VIEWPORT = { w: 400, h: 820 }

// ─── Export ───────────────────────────────────────────────────────────────────

// One row, trimmed for pasting into a conversation about a fix: no ids that
// mean nothing outside the database, labels added so it reads on its own.
export function rowForSharing(row: EventRow): Record<string, unknown> {
  return {
    occurredAt: row.occurred_at,
    appVersion: row.app_version,
    exercise: row.exercise_id,
    exerciseLabel: exerciseLabel(row.exercise_id),
    skill: row.skill_id,
    tier: row.tier_id,
    variant: row.variant,
    isRetry: row.is_retry,
    scoreBefore: row.score_before,
    problem: row.problem,
    correctAnswer: row.correct_answer,
    givenAnswer: row.given_answer,
    correct: row.correct,
    errorType: row.error_type,
    responseTimeMs: row.response_time_ms,
    tapCount: row.tap_count,
    replayCount: row.replay_count,
    flag: row.flag ?? null,
    scene: row.scene_theme
      ? { theme: row.scene_theme, background: row.scene_background, counter: row.scene_counter }
      : null,
    viewport: row.viewport_w ? { w: row.viewport_w, h: row.viewport_h } : null,
    meta: row.meta,
  }
}
