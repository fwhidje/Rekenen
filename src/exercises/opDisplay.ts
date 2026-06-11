import type { Operation } from '../curriculum/types'
import type { SceneTokens } from '../presentation/tokens'

// ─── Operator display ────────────────────────────────────────────────────────
// Shared by every exercise that renders a bare equation, so the operator looks
// identical across presentations. Only '+' and '-' skills serve these
// exercises; '-' renders as a true minus sign (U+2212), not a hyphen.

export function opGlyph(op: Operation): string {
  return op === '-' ? '−' : '+'
}

// The operator is the one symbol the child must not glide over (+/− confusion
// is a documented pitfall), so it gets a salient, op-distinct colour, the same
// in every exercise: green-family for erbij (+), red-family for eraf (−) —
// the workbook convention. Read from tokens so themes stay in control.
export function opColor(op: Operation, tokens: SceneTokens): string {
  return op === '-' ? tokens.refuse : tokens.confirm
}
