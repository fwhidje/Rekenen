// ─── Replays: how often the child asked to see a question's animation again ──
// Every ↻ (convention V — CLAUDE.md) counts against the question on screen:
// useReveal's and useFlash's `replay` note it here, and useClosure adds the
// count to the answer as `replayCount`. One ledger, so an exercise never has to
// thread the number through its own answer calls.

const counts = new WeakMap<object, number>()

export function noteReplay(question: unknown) {
  if (typeof question !== 'object' || question === null) return
  counts.set(question, (counts.get(question) ?? 0) + 1)
}

export function replaysOf(question: unknown): number {
  if (typeof question !== 'object' || question === null) return 0
  return counts.get(question) ?? 0
}
