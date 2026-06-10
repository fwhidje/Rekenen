// ─── Canonical die / subitising dot positions for 0–5 ────────────────────────
// [x%, y%] positions in a square container — the kwadraatbeelden every dotted
// exercise renders from. Single source of truth; don't copy this map into
// exercise files.

export const DOT_POS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}
