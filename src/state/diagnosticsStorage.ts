import { mergeRecords } from '../engine/recordMerge'
import type { AnswerRecord, DiagnosticsSink } from '../engine/diagnostics'

// ─── Persistent diagnostics sink ──────────────────────────────────────────────
// localStorage-backed implementation of DiagnosticsSink. Records are held in
// memory and mirrored to localStorage on every write, so reads are cheap and
// the stream survives reloads. Storage failures (quota, missing localStorage
// in tests) degrade silently to in-memory behaviour — capture must never
// break the exercise loop.

const STORAGE_KEY = 'rekenen_v2_diagnostics'

// Cap per profile: ~2000 records ≈ a few hundred KB serialized, well within
// localStorage budgets while keeping months of play history.
const MAX_RECORDS_PER_PROFILE = 2000

function loadRecords(): AnswerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AnswerRecord[]) : []
  } catch {
    return []
  }
}

function saveRecords(records: AnswerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Quota exceeded or no localStorage — keep going in memory only.
  }
}

export class LocalStorageDiagnosticsSink implements DiagnosticsSink {
  private records: AnswerRecord[] = loadRecords()

  record(full: AnswerRecord): void {
    // `meta` (what was shown) can be large; it is upload evidence, not something
    // any local derivation reads. Keep the local stream lean.
    const { meta: _meta, ...r } = full
    this.records.push(r)
    // FIFO trim per profile: drop this profile's oldest record once over cap.
    const mine = this.records.filter(rec => rec.profileId === r.profileId)
    if (mine.length > MAX_RECORDS_PER_PROFILE) {
      const oldestIdx = this.records.findIndex(rec => rec.profileId === r.profileId)
      this.records.splice(oldestIdx, 1)
    }
    saveRecords(this.records)
  }

  getAll(profileId?: string): AnswerRecord[] {
    return profileId === undefined
      ? this.records
      : this.records.filter(r => r.profileId === profileId)
  }

  getForSkill(profileId: string, skillId: string): AnswerRecord[] {
    return this.records.filter(r => r.profileId === profileId && r.skillId === skillId)
  }

  importRecords(incoming: AnswerRecord[]): void {
    const merged = mergeRecords(this.records, incoming.map(({ meta: _meta, ...r }) => r))
    if (merged === this.records) return
    // Re-apply the per-profile cap, dropping each profile's oldest first.
    const kept = new Map<string, number>()
    this.records = merged.reverse().filter(r => {
      const n = (kept.get(r.profileId) ?? 0) + 1
      kept.set(r.profileId, n)
      return n <= MAX_RECORDS_PER_PROFILE
    }).reverse()
    saveRecords(this.records)
  }

  clear(): void {
    this.records = []
    saveRecords(this.records)
  }
}
