import type { AnswerRecord } from './diagnostics'

// Shared by the sink implementations (kept in its own module so the sinks can
// import it without a value cycle through diagnostics.ts): add the records not
// seen yet, by id, and keep the stream in time order.
export function mergeRecords(existing: AnswerRecord[], incoming: AnswerRecord[]): AnswerRecord[] {
  const seen = new Set(existing.map(r => r.id).filter(Boolean))
  const fresh = incoming.filter(r => !r.id || !seen.has(r.id))
  if (fresh.length === 0) return existing
  return [...existing, ...fresh].sort((a, b) => a.timestamp - b.timestamp)
}
