import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { DotGroup } from '../presentation/components/DotGroup'
import { SceneGroup } from '../presentation/components/SceneGroup'
import { NumPad } from '../ui/components/NumPad'
import { pickScene, pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { useReveal } from '../presentation/useReveal'
import { opGlyph, opColor } from './opDisplay'

// ─── Meta ─────────────────────────────────────────────────────────────────────

type VisualKind = 'dots' | 'scene' | 'none'
type RevealKind = 'visual' | 'equation' | 'instant'
// Semantic variant: which meaning of the operation the visual acts out. Each
// variant pairs ONE canonical cue phrase with ONE matching animation — never
// mixed — so the rekentaal binds to the visual meaning. Lifted into the
// AnswerRecord (KidMode reads meta.variant), so per-meaning accuracy is
// visible in the data.
type SemVariant = 'erbij' | 'samenvoegen' | 'wegnemen'

interface FillVisualMeta {
  visualKind: VisualKind
  revealKind: RevealKind
  variant: SemVariant
  // Post-60 '+' problems can arrive small-addend-first (1 + 4); at the
  // equation tier the two terms then visibly trade places after the build —
  // the "je mag het omdraaien" demonstration. The swap is explicit because
  // enacting-from-the-larger alone is too implicit to read as a strategy.
  commuteSwap: boolean
  sceneIndex: number
  colorA: string
  colorB: string
  tierId: string
}

// Tier ids double as the reveal kind: the score band picks how much of the
// equation is built up before input unlocks.
const TIERS: ExerciseTier[] = [
  { id: 'visual',   minScore: 0,  label: 'volledige opbouw', description: 'Full piece-by-piece reveal: the semantic action (erbij arrival / samenvoegen merge / wegnemen leave) with its cue phrase, then numbers, then "= ?". Maximum support.' },
  { id: 'equation', minScore: 40, label: 'som opbouw',       description: 'Numbers-only reveal — no visual groups; the equation animates in then unlocks. Flipped + problems demonstrate the commutativity swap here.' },
  { id: 'instant',  minScore: 80, label: 'meteen',           description: 'Equation shown instantly, no reveal — the child works abstractly at speed.' },
]

// ─── Reveal timing ────────────────────────────────────────────────────────────
// visual (7 steps): vis1 → cue/op → vis2/action → numA → eqOp → numB → complete
// equation (4 steps): numA → eqOp → numB → complete
// equation+swap (5 steps): numA → eqOp → numB → swap → complete
// instant (0 steps): complete immediately

const VISUAL_DELAYS        = [400, 600, 600, 700, 500, 500, 600]
const EQUATION_DELAYS      = [400, 500, 500, 600]
const EQUATION_SWAP_DELAYS = [400, 500, 500, 700, 900]

// ─── Cue phrases ──────────────────────────────────────────────────────────────
// The canonical rekentaal per semantic variant (§5 cue tables). Sub-60 the
// phrase labels the animation; the sentence-form rekenverhaal is a separate
// post-60 exercise.

function cuePhrase(variant: SemVariant, b: number): string {
  switch (variant) {
    case 'erbij':       return b === 1 ? 'Er komt er 1 bij!' : `Er komen er ${b} bij!`
    case 'samenvoegen': return 'Hoeveel samen?'
    case 'wegnemen':    return b === 1 ? 'Er gaat er 1 weg!' : `Er gaan er ${b} weg!`
  }
}

// ─── Fade helper ──────────────────────────────────────────────────────────────

function fade(visible: boolean, hiddenTransform = 'scale(0.4)'): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : hiddenTransform,
    transition: 'opacity .3s ease, transform .35s ease',
    display: 'inline-block',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function FillVisualComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<FillVisualMeta>) {
  const [input, setInput] = useState('')
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const legacyScene = meta.visualKind === 'scene' ? pickScene(meta.sceneIndex) : null

  const delays = meta.revealKind === 'visual' ? VISUAL_DELAYS
               : meta.revealKind === 'equation' ? (meta.commuteSwap ? EQUATION_SWAP_DELAYS : EQUATION_DELAYS)
               : []

  const { step, complete } = useReveal(delays, question)

  // Visibility flags per element
  const v = meta.revealKind === 'instant' ? {
    vis1: true, cue: false, action: true,
    numA: true, eqOp: true, numB: true, eq: true, swap: false,
  } : meta.revealKind === 'visual' ? {
    vis1:   step >= 1,
    cue:    step >= 2,
    action: step >= 3,   // erbij: B arrives · samenvoegen: B joins · wegnemen: b leave
    numA:   step >= 4,
    eqOp:   step >= 5,
    numB:   step >= 6,
    eq:     complete,
    swap:   false,
  } : {
    // equation reveal — no visual
    vis1: false, cue: false, action: false,
    numA: step >= 1,
    eqOp: step >= 2,
    numB: step >= 3,
    swap: meta.commuteSwap && step >= 4,
    eq:   complete,
  }

  // ── Commutativity swap: measure the real distance between the two number
  // slots and let them trade places (single-digit terms, so widths match).
  const numARef = useRef<HTMLSpanElement>(null)
  const numBRef = useRef<HTMLSpanElement>(null)
  const [swapDx, setSwapDx] = useState(0)
  useEffect(() => { setSwapDx(0) }, [question])
  useEffect(() => {
    if (v.swap && swapDx === 0 && numARef.current && numBRef.current) {
      const a = numARef.current.getBoundingClientRect()
      const b = numBRef.current.getBoundingClientRect()
      setSwapDx((b.left + b.width / 2) - (a.left + a.width / 2))
    }
  }, [v.swap, swapDx])

  const hasVisual = meta.visualKind !== 'none'
  const fs        = hasVisual ? 42 : 60
  const slotSize  = hasVisual ? 54 : 72

  const handleKey = (key: string) => {
    if (disabled || !complete) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); onResolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(s => s + key)
  }

  const renderGroup = (n: number, color: string, crossed = 0) =>
    meta.visualKind === 'dots'
      ? <DotGroup n={n} color={color} crossed={crossed} />
      : <SceneGroup n={n} scene={legacyScene!} crossed={crossed} />

  const glyph = opGlyph(op)
  const glyphColor = opColor(op, tokens)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

      {/* Cue phrase — the rekentaal of the variant, shown with the action */}
      {hasVisual && (
        <div style={{
          ...fade(v.cue),
          background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
          padding: '6px 18px 8px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)',
          fontFamily: 'Fredoka One, cursive', fontSize: 20, color: tokens.ink,
        }}>{cuePhrase(meta.variant, operandB)}</div>
      )}

      {/* Visual row — the semantic action */}
      {hasVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', minHeight: 80 }}>
          {meta.variant === 'wegnemen' ? (
            // One whole group; on the action step the removed part becomes
            // crossed-out ghosts — the leave IS the minus sign's meaning.
            <div style={fade(v.vis1)}>
              {renderGroup(operandA, meta.colorA, v.action ? operandB : 0)}
            </div>
          ) : (
            <>
              <div style={fade(v.vis1)}>
                {renderGroup(operandA, meta.colorA)}
              </div>
              <span style={{
                ...fade(meta.variant === 'samenvoegen' ? v.cue : v.action),
                fontFamily: 'Fredoka One, cursive', fontSize: 28, color: glyphColor,
              }}>{glyph}</span>
              {/* erbij: the second group ARRIVES (slides in); samenvoegen: it
                  stands alongside from its own step — joining, not arriving. */}
              <div style={fade(v.action, meta.variant === 'erbij' ? 'translateX(48px) scale(0.4)' : 'scale(0.4)')}>
                {renderGroup(operandB, meta.colorB)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Equation row — always in DOM, elements animate in via opacity/transform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: hasVisual ? 10 : 14, flexWrap: 'wrap', justifyContent: 'center', minHeight: hasVisual ? 60 : 80 }}>
        <span ref={numARef} style={{
          ...fade(v.numA), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: tokens.accentText,
          ...(v.swap ? { transform: `translateX(${swapDx}px)`, transition: 'transform .65s cubic-bezier(.45,-.25,.55,1.25)' } : {}),
        }}>{operandA}</span>
        <span style={{ ...fade(v.eqOp), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: glyphColor }}>{glyph}</span>
        <span ref={numBRef} style={{
          ...fade(v.numB), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: tokens.pop,
          ...(v.swap ? { transform: `translateX(${-swapDx}px)`, transition: 'transform .65s cubic-bezier(.45,-.25,.55,1.25)' } : {}),
        }}>{operandB}</span>
        <span style={{ ...fade(v.eq), fontFamily: 'Fredoka One, cursive', fontSize: Math.round(fs * 0.85), color: tokens.ink, opacity: v.eq ? 0.4 : 0 }}>=</span>
        <div style={{
          ...fade(v.eq),
          minWidth: slotSize, height: slotSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: Math.round(fs * 0.85),
          background: input ? tokens.accent : tokens.paper,
          color: input ? 'white' : `${tokens.ink}55`,
          border: `2px solid ${input ? tokens.accent : tokens.paperMid}`,
          borderRadius: 14,
          // override transition to also animate background/shadow
          transition: 'background .18s, border-color .18s, opacity .3s ease, transform .35s ease',
        }}>{input || '?'}</div>
      </div>

      <NumPad onKey={handleKey} disabled={disabled || !complete} tokens={scene?.tokens} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const FillVisual: ExerciseDefinition<FillVisualMeta> = {
  id: 'fill-vis',
  label: 'Tel en tel op',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Compute a sum or difference, scaffolded by a timed reveal that acts out the operation\'s meaning (erbij arrival, samenvoegen merge, wegnemen leave — each with its canonical cue phrase) and then builds the equation from it.',
    pitfalls: ['Counting all from 1 instead of counting on', 'Off-by-one', 'Reading the variant\'s visual without linking it to the cue phrase'],
    progression: 'visual (semantic action + full concrete→symbolic reveal) → equation (symbols only; flipped + terms demonstrate the commutativity swap) → instant (no reveal). Support fades as score rises.',
  },

  generateMeta(_operandA, _operandB, score, problem) {
    const tier = pickTier(TIERS, score)
    const revealKind = tier.id as RevealKind
    const op = problem?.op ?? '+'
    // One semantic variant per question: '-' is wegnemen; '+' leans erbij
    // (the counting-on action) with samenvoegen mixed in.
    const variant: SemVariant =
      op === '-' ? 'wegnemen' : (Math.random() < 0.6 ? 'erbij' : 'samenvoegen')
    const commuteSwap =
      revealKind === 'equation' && op === '+' &&
      problem?.op === '+' && problem.terms[0] < problem.terms[1]
    const visualKind: VisualKind =
      revealKind === 'visual' ? (Math.random() < 0.5 ? 'dots' : 'scene') : 'none'
    const [colorA, colorB] = pickColors()
    return { visualKind, revealKind, variant, commuteSwap, sceneIndex: Math.floor(Math.random() * 24), colorA, colorB, tierId: tier.id }
  },

  Component: FillVisualComponent,
}

registerExercise(FillVisual)
