import { useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { DotGroup } from '../presentation/components/DotGroup'
import { SceneGroup } from '../presentation/components/SceneGroup'
import { NumPad } from '../ui/components/NumPad'
import { pickScene, pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { opGlyph, opColor, equationText } from './opDisplay'
import { useClosure } from '../presentation/useClosure'
import { AnswerSlot } from '../presentation/components/AnswerSlot'

// ─── Meta ─────────────────────────────────────────────────────────────────────

type VisualKind = 'dots' | 'scene' | 'none'
// 'visual' builds picture and sum together; anything else shows the bare sum
// at once. (Stored records may still carry the retired 'equation' kind — it
// renders as the bare sum.)
type RevealKind = 'visual' | 'instant'
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
  sceneIndex: number
  colorA: string
  colorB: string
  tierId: string
}

const TIERS: ExerciseTier[] = [
  { id: 'visual',  minScore: 0,  label: 'beeld + som', description: 'Picture and sum form together, in three beats: the first number with its group, the sign in both, the second number with its group (erbij arrival / samenvoegen / wegnemen leave), then "= ?". Maximum support.' },
  { id: 'instant', minScore: 40, label: 'kale som',    description: 'The bare sum, shown at once. Same as fill-plain on the first try; a wrong answer brings the picture back (retry one tier down).' },
]

// ─── Reveal timing ────────────────────────────────────────────────────────────
// Picture and sum share every beat — the numeral never arrives after its
// group, so the child reads "3" and three things as one statement.
//   step 1: number A  + group A
//   step 2: the sign, in the picture and in the sum
//   step 3: number B  + group B (erbij: slides in · samenvoegen: stands beside ·
//           wegnemen: B of the whole are crossed out)
//   step 4: "= ?" — input unlocks
const VISUAL_DELAYS = [350, 600, 600, 650]

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

  const hasVisual = meta.revealKind === 'visual' && meta.visualKind !== 'none'
  const { step, complete } = useReveal(hasVisual ? VISUAL_DELAYS : [], question)
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // One flag per beat, shared by the picture and the sum.
  const showA  = !hasVisual || step >= 1
  const showOp = !hasVisual || step >= 2
  const showB  = !hasVisual || step >= 3
  const showEq = complete

  const fs        = hasVisual ? 42 : 60
  const slotSize  = hasVisual ? 54 : 72

  const handleKey = (key: string) => {
    if (disabled || answered || !complete) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') { if (input) { const given = parseInt(input, 10); resolve(given === answer, { givenAnswer: given }) } return }
    if (input.length < 2) setInput(s => s + key)
  }

  const renderGroup = (n: number, color: string, crossed = 0) =>
    meta.visualKind === 'dots'
      ? <DotGroup n={n} color={color} crossed={crossed} />
      : <SceneGroup n={n} scene={legacyScene!} Counter={scene?.Counter} crossed={crossed} />

  const glyph = opGlyph(op)
  const glyphColor = opColor(op, tokens)

  // Title band: the variant's cue phrase frames the task when there's a visual
  // (erbij / samenvoegen / wegnemen), otherwise a neutral prompt.
  const title = hasVisual ? cuePhrase(meta.variant, operandB) : 'Hoeveel is het?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

     <ExerciseTitle tokens={tokens}>{title}</ExerciseTitle>

     {/* Visual + equation share one stage; the numpad sits outside it. */}
     <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box' }}>

      {/* Picture row — the semantic action, beat for beat with the sum below */}
      {hasVisual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 44 }}>
          {meta.variant === 'wegnemen' ? (
            // One whole group; on the third beat the removed part becomes
            // crossed-out ghosts — the leave IS the minus sign's meaning.
            <div style={fade(showA)}>
              {renderGroup(operandA, meta.colorA, showB ? operandB : 0)}
            </div>
          ) : (
            <>
              <div style={fade(showA)}>
                {renderGroup(operandA, meta.colorA)}
              </div>
              <span style={{
                ...fade(showOp),
                fontFamily: 'Fredoka One, cursive', fontSize: 28, color: glyphColor,
              }}>{glyph}</span>
              {/* erbij: the second group ARRIVES (slides in); samenvoegen: it
                  appears alongside — joining, not arriving. */}
              <div style={fade(showB, meta.variant === 'erbij' ? 'translateX(48px) scale(0.4)' : 'scale(0.4)')}>
                {renderGroup(operandB, meta.colorB)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sum row — always in the DOM; pieces fade in on the picture's beats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: hasVisual ? 10 : 14, justifyContent: 'center', minHeight: hasVisual ? 60 : 80 }}>
        <span style={{ ...fade(showA), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: tokens.accentText }}>{operandA}</span>
        <span style={{ ...fade(showOp), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: glyphColor }}>{glyph}</span>
        <span style={{ ...fade(showB), fontFamily: 'Fredoka One, cursive', fontSize: fs, color: tokens.pop }}>{operandB}</span>
        <span style={{ ...fade(showEq), fontFamily: 'Fredoka One, cursive', fontSize: Math.round(fs * 0.85), color: tokens.ink, opacity: showEq ? 0.4 : 0 }}>=</span>
        <div style={fade(showEq)}>
          <AnswerSlot value={input} solved={solved} size={slotSize} tokens={tokens} />
        </div>
      </div>

     </ExerciseStage>

      <NumPad onKey={handleKey} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
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
    goal: 'Compute a sum or difference from a picture that forms together with its sum: each number appears with its group, the sign in both, so the written sum is read AS the picture (erbij arrival, samenvoegen, wegnemen leave — each with its canonical cue phrase).',
    pitfalls: ['Counting all from 1 instead of counting on', 'Off-by-one', 'Reading the variant\'s visual without linking it to the cue phrase'],
    progression: 'visual: picture and sum built in step, beat for beat. instant (40): the bare sum — identical to fill-plain on the first try, but a wrong answer brings the picture back. Support fades as score rises.',
  },

  // Retry keeps the meaning acted out (variant) and the look (kind of picture,
  // colours, creature). visualKind is tier-dependent ('none' above the visual
  // tier), so it is kept only when the original already had a picture.
  retryStable: ['variant', 'sceneIndex', 'colorA', 'colorB'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),

  // No zero term (a + 0, 0 + a, a − 0): its action picture needs something that arrives or leaves.
  isCompatible: (a, b) => a !== 0 && b !== 0,
  generateMeta(_operandA, _operandB, score, problem, ctx) {
    const prev = ctx?.retryOf
    const tier = pickTier(TIERS, score)
    const revealKind = tier.id as RevealKind
    const op = problem?.op ?? '+'
    // One semantic variant per question: '-' is wegnemen; '+' leans erbij
    // (the counting-on action) with samenvoegen mixed in.
    const variant: SemVariant = prev?.variant ??
      (op === '-' ? 'wegnemen' : (Math.random() < 0.6 ? 'erbij' : 'samenvoegen'))
    const visualKind: VisualKind =
      revealKind !== 'visual' ? 'none'
      : prev && prev.visualKind !== 'none' ? prev.visualKind
      : (Math.random() < 0.5 ? 'dots' : 'scene')
    const [colorA, colorB] = prev ? [prev.colorA, prev.colorB] : pickColors()
    const sceneIndex = prev?.sceneIndex ?? Math.floor(Math.random() * 24)
    return { visualKind, revealKind, variant, sceneIndex, colorA, colorB, tierId: tier.id }
  },

  Component: FillVisualComponent,
}

registerExercise(FillVisual)
