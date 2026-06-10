// ─── Shared numeral-distractor builder ───────────────────────────────────────
// One implementation for every "pick the numeral" exercise. Distractors are
// near-misses (±1 first, then wider), clamped to the skill's number range so a
// tot-5 child is never offered a numeral above 5, nor a tot-10 child one
// above 10.

export function makeNumeralOptions(correct: number, max: number, min = 1): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3, 4, -4]) {
    const v = correct + delta
    if (v >= min && v <= max) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
}

// Range convention shared by the getalbegrip exercises: a quantity ≤ 5 is
// treated as a tot-5 question (numerals stay within 1–5), above that tot-10.
export function numeralRangeMax(n: number): number {
  return n <= 5 ? 5 : 10
}
