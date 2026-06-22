import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { Problem } from '../curriculum/types'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { NumPad } from '../ui/components/NumPad'
import { opGlyph, opColor } from './opDisplay'

// ─── rekenverhaal ─────────────────────────────────────────────────────────────
// The mini story problem: short sentences whose WORDS carry the semantics
// (erbij / samenvoegen / wegnemen), acted out by the scene creatures. This is
// the post-60 semantic-width probe of the language gradient: sub-60 exercises
// pair a cue phrase with an animation; here the sentence comes first and the
// animation is support. The equation builds piece by piece as the story
// unfolds (invariant: visible by answer time), so the words introduce each
// number — but the child reads the operation from the story.
// Weight-controlled, never a gate: a weak reader meets it rarely, and the
// replay button re-acts the story without text.

const TIERS: ExerciseTier[] = [
  { id: 'tekst-film', minScore: 60, label: 'tekst + film', description: 'Sentences appear one by one, each acted by the creatures while its number joins the equation. Reading is supported by watching.' },
  { id: 'tekst',      minScore: 80, label: 'enkel tekst',  description: 'The story stands alone; the animation only plays on the replay tap. The words have to carry the operation.' },
]

type Variant = 'erbij' | 'samenvoegen' | 'wegnemen'

interface RekenverhaalMeta {
  variant: Variant
  sceneIndex: number
  tierId: string
}

// Dutch number agreement: 1 → "1 vriendje" (singular), N → "N vriendjes".
const vriendjes = (n: number) => `${n} ${n === 1 ? 'vriendje' : 'vriendjes'}`
// "er zit/zitten", "hier speelt/spelen" — verb agrees with the count.
const zit = (n: number) => (n === 1 ? 'zit' : 'zitten')
const speelt = (n: number) => (n === 1 ? 'speelt' : 'spelen')

function sentences(variant: Variant, a: number, b: number): [string, string, string] {
  switch (variant) {
    case 'erbij': return [
      `Er ${zit(a)} ${vriendjes(a)}.`,
      b === 1 ? 'Er komt er 1 bij.' : `Er komen er ${b} bij.`,
      'Hoeveel zijn er nu?',
    ]
    case 'samenvoegen': return [
      `Hier ${speelt(a)} ${vriendjes(a)}.`,
      `Daar ${speelt(b)} ${vriendjes(b)}.`,
      'Hoeveel zijn er samen?',
    ]
    case 'wegnemen': return [
      `Er ${zit(a)} ${vriendjes(a)}.`,
      b === 1 ? 'Er gaat er 1 weg.' : `Er gaan er ${b} weg.`,
      'Hoeveel blijven er over?',
    ]
  }
}

const STEP_DELAYS = [700, 1500, 1300]

function RekenverhaalComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<RekenverhaalMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const legacyScene = pickScene(meta.sceneIndex)
  const Counter = scene?.Counter
  const containerBg = scene?.containerBg ?? legacyScene.bg

  const isTekst = meta.tierId === 'tekst'
  // film: step drives text + equation + animation together (input at step 3).
  // tekst: text + equation complete from the start; step only drives the
  // animation, which is hidden until the first replay.
  const [step, setStep] = useState(isTekst ? 3 : 0)
  const [playing, setPlaying] = useState(!isTekst)
  const [replays, setReplays] = useState(0)
  const [input, setInput] = useState('')

  useEffect(() => {
    setStep(isTekst ? 3 : 0)
    setPlaying(!isTekst)
    setReplays(0)
    setInput('')
  }, [question, isTekst])

  useEffect(() => {
    if (!playing || step >= 3) { setPlaying(p => (step >= 3 ? false : p)); return }
    const t = setTimeout(() => setStep(s => s + 1), STEP_DELAYS[step])
    return () => clearTimeout(t)
  }, [playing, step])

  const textStep = isTekst ? 3 : step
  const complete = textStep >= 3 && (isTekst || step >= 3)
  const showAnim = !isTekst || replays > 0

  const replay = () => {
    if (disabled) return
    setReplays(r => r + 1)
    setStep(0)
    setPlaying(true)
  }

  const handleKey = (key: string) => {
    if (disabled || !complete) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') {
      if (input) {
        const given = parseInt(input, 10)
        onResolve(given === answer, { givenAnswer: given, replayCount: replays })
      }
      return
    }
    if (input.length < 2) setInput(s => s + key)
  }

  const lines = sentences(meta.variant, operandA, operandB)

  const creature = (key: string, ghost: boolean) => (
    <div key={key} style={{
      position: 'relative', display: 'inline-block',
      opacity: ghost ? 0.35 : 1, transition: 'opacity .35s',
    }}>
      {Counter ? <Counter size={34} /> : <span style={{ fontSize: 30 }}>{legacyScene.e}</span>}
      {ghost && (
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 26, color: 'rgba(40,30,20,.8)',
        }}>✕</span>
      )}
    </div>
  )

  // Animation per variant, driven by `step`.
  const anim = () => {
    const actionDone = step >= 2
    if (meta.variant === 'samenvoegen') {
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: containerBg, borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 6, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
            {Array.from({ length: operandA }, (_, i) => creature(`a${i}`, false))}
          </div>
          <div style={{ background: containerBg, borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 6, opacity: actionDone ? 1 : 0, transition: 'opacity .3s' }}>
            {Array.from({ length: operandB }, (_, i) => creature(`b${i}`, false))}
          </div>
        </div>
      )
    }
    const ghosts = meta.variant === 'wegnemen' && actionDone
    const extra = meta.variant === 'erbij' && actionDone ? operandB : 0
    const base = operandA
    return (
      <div style={{ background: containerBg, borderRadius: 14, padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 250, opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
        {Array.from({ length: base }, (_, i) => creature(`a${i}`, ghosts && i >= base - operandB))}
        {Array.from({ length: extra }, (_, i) => creature(`x${i}`, false))}
      </div>
    )
  }

  const lineStyle = (i: number): React.CSSProperties => ({
    opacity: textStep >= i + 1 ? 1 : 0.06,
    transition: 'opacity .3s',
    fontFamily: 'Fredoka One, cursive', fontSize: 21, color: tokens.ink,
    lineHeight: 1.45, textAlign: 'center',
  })

  const eqPiece = (visible: boolean, el: React.ReactNode) => (
    <span style={{ opacity: visible ? 1 : 0, transition: 'opacity .3s', display: 'inline-block' }}>{el}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>

      {/* The story */}
      <div style={{
        background: tokens.cream, border: `2px solid ${tokens.ink}`, borderRadius: 18,
        padding: '10px 22px 12px', boxShadow: '2px 4px 0 rgba(61,47,30,.12)', maxWidth: 320,
      }}>
        <div style={lineStyle(0)}>{lines[0]}</div>
        <div style={lineStyle(1)}>{lines[1]}</div>
        <div style={{ ...lineStyle(2), fontSize: 23 }}>{lines[2]}</div>
      </div>

      {/* The acted story + replay */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showAnim && anim()}
        <button onClick={replay} disabled={disabled}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: `2px solid ${tokens.ink}`,
            background: tokens.paper, fontSize: 20, cursor: disabled ? 'default' : 'pointer',
            boxShadow: '2px 3px 0 rgba(61,47,30,.12)',
          }}
          aria-label="speel het verhaal opnieuw">▶</button>
      </div>

      {/* Answer area. On the first attempt only the answer box shows — the
          story has to be read to know what to type. On the re-scaffolded retry
          (question.isRetry) the equation is revealed as a scaffold. This is a
          deliberate exception to the "equation always visible" invariant: the
          capstone's whole job is to force reading the words. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38 }}>
        {question.isRetry && <>
          {eqPiece(textStep >= 1, <span style={{ color: tokens.accentText }}>{operandA}</span>)}
          {eqPiece(textStep >= 2, <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>)}
          {eqPiece(textStep >= 2, <span style={{ color: tokens.pop }}>{operandB}</span>)}
          {eqPiece(textStep >= 3, <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 32 }}>=</span>)}
        </>}
        <span style={{
          minWidth: 48, height: 48, padding: '0 6px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: input ? tokens.accent : tokens.paper,
          color: input ? 'white' : `${tokens.ink}55`,
          border: `2px solid ${input ? tokens.accent : tokens.paperMid}`,
          borderRadius: 12, fontSize: 30,
          transition: 'background .18s, border-color .18s',
        }}>{input || '?'}</span>
      </div>

      <NumPad onKey={handleKey} disabled={disabled || !complete} tokens={scene?.tokens} />
    </div>
  )
}

const Rekenverhaal: ExerciseDefinition<RekenverhaalMeta> = {
  id: 'rekenverhaal',
  label: 'Rekenverhaal',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Read the operation out of WORDS: the canonical cue phrases of erbij / samenvoegen / wegnemen, now as a story instead of a label. The semantic-width probe — by here the child has met every phrase bound to its animation; the story asks them to run that binding in reverse.',
    pitfalls: [
      'Picking the operation from a single word ("bij" → always plus) without reading the situation.',
      'Reading failure masquerading as math failure — mitigated by the replay tap (re-acts the story) and by weight-only exposure (never a gate).',
    ],
    progression: 'tekst-film (60): sentences appear one by one, acted by the creatures, the equation building along. tekst (80): the words stand alone; the animation only exists behind the replay tap.',
  },
  generateMeta(_operandA, _operandB, score, problem?: Problem) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    const variant: Variant =
      op === '-' ? 'wegnemen' : (Math.random() < 0.55 ? 'erbij' : 'samenvoegen')
    return { variant, sceneIndex: Math.floor(Math.random() * 24), tierId: tier.id }
  },
  Component: RekenverhaalComponent,
}

registerExercise(Rekenverhaal)
