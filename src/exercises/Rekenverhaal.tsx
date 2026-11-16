import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { Problem } from '../curriculum/types'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { NumPad } from '../ui/components/NumPad'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { opGlyph, opColor, equationText } from './opDisplay'
import { useClosure } from '../presentation/useClosure'
import { AnswerSlot } from '../presentation/components/AnswerSlot'
import { FiveRow } from '../presentation/components/FiveRow'

// ─── rekenverhaal ─────────────────────────────────────────────────────────────
// The mini story problem: short sentences whose WORDS carry the semantics
// (erbij / samenvoegen / wegnemen). This is the post-60 semantic-width probe of
// the language gradient: sub-60 exercises pair a cue phrase with an animation;
// here the sentence comes first.
//
// A child this age may not read fluently and there is no audio, so the story
// has three levels of help — two tiers and the retry:
//   tekst      (80): the sentences only. The operation has to come out of the
//                    words; nothing else on screen gives it away.
//   tekst-som  (60): the sentences, and the sum forms alongside them
//                    ("3" with the first sentence, "+ 2" with the second,
//                    "= ?" with the question) — the fallback rung in between.
//   retry          : the film plays by itself, the creatures STAY, and the sum
//                    is shown — the fully pictured version.
// On a first attempt the film never plays by itself: the ▶ button acts the
// story out on request (each tap is recorded as a replay), and the creatures
// leave again when the question comes — a picture that stayed would turn the
// story into "count what you see".
// Weight-controlled, never a gate.

const TIERS: ExerciseTier[] = [
  { id: 'tekst-som', minScore: 60, label: 'tekst + som', description: 'The sentences appear one by one and the sum forms alongside them. The film plays only on the ▶ tap and the creatures leave when the question comes.' },
  { id: 'tekst',     minScore: 80, label: 'enkel tekst', description: 'The story stands alone — no sum. The film exists only behind the ▶ tap. The words have to carry the operation.' },
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

  const isRetry = !!question.isRetry
  // The sum is hidden only at the top tier's first attempt (the sanctioned
  // exception to "the equation is always visible").
  const showSum = isRetry || meta.tierId !== 'tekst'

  // textStep: how many sentences are on screen (0..3); input unlocks at 3.
  const [textStep, setTextStep] = useState(0)
  // film: the acted story's step (0..3), or null when no film is on screen.
  // Retry: runs with the text and stays. First attempt: only after a ▶ tap,
  // and it leaves again at the question.
  const [film, setFilm] = useState<number | null>(isRetry ? 0 : null)
  const [replays, setReplays] = useState(0)
  const [input, setInput] = useState('')
  const { solved, answered, resolve } = useClosure(question, onResolve)

  useEffect(() => {
    setTextStep(0)
    setFilm(isRetry ? 0 : null)
    setReplays(0)
    setInput('')
  }, [question, isRetry])

  useEffect(() => {
    if (textStep >= 3) return
    const t = setTimeout(() => setTextStep(s => s + 1), STEP_DELAYS[textStep])
    return () => clearTimeout(t)
  }, [textStep])

  useEffect(() => {
    if (film === null) return
    if (film < 3) {
      const t = setTimeout(() => setFilm(f => (f === null ? null : f + 1)), STEP_DELAYS[film])
      return () => clearTimeout(t)
    }
    // the question has come: on a first attempt the creatures leave
    if (!isRetry) setFilm(null)
  }, [film, isRetry])

  const complete = textStep >= 3
  const step = film ?? 0

  const replay = () => {
    if (disabled || answered || !complete) return
    setReplays(r => r + 1)
    setFilm(0)
  }

  const handleKey = (key: string) => {
    if (disabled || answered || !complete) return
    if (key === '⌫') { setInput(s => s.slice(0, -1)); return }
    if (key === '✓') {
      if (input) {
        const given = parseInt(input, 10)
        resolve(given === answer, { givenAnswer: given, replayCount: replays })
      }
      return
    }
    if (input.length < 2) setInput(s => s + key)
  }

  const lines = sentences(meta.variant, operandA, operandB)

  const creature = (ghost: boolean, shown = true) => (
    <div style={{
      position: 'relative', display: 'inline-block',
      opacity: !shown ? 0 : ghost ? 0.35 : 1, transition: 'opacity .35s',
    }}>
      {Counter ? <Counter size={32} /> : <span style={{ fontSize: 28 }}>{legacyScene.e}</span>}
      {ghost && (
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 26, color: 'rgba(40,30,20,.8)',
        }}>✕</span>
      )}
    </div>
  )

  // The acted story, driven by `step`. Groups are 5-rows (convention Q) laid
  // out for their final size, so nothing moves while the film runs.
  const anim = () => {
    const actionDone = step >= 2
    const group = (n: number, total: number, render: (i: number) => React.ReactNode) =>
      <FiveRow n={n} total={total} item={32} gap={6} renderItem={render} />
    if (meta.variant === 'samenvoegen') {
      return (
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>{group(operandA, operandA, () => creature(false))}</div>
          <div style={{ opacity: actionDone ? 1 : 0, transition: 'opacity .3s' }}>{group(operandB, operandB, () => creature(false))}</div>
        </div>
      )
    }
    if (meta.variant === 'wegnemen') {
      return (
        <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
          {group(operandA, operandA, i => creature(actionDone && i >= operandA - operandB))}
        </div>
      )
    }
    // erbij: one row; the arrivals fade in at their places
    return (
      <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
        {group(operandA + operandB, operandA + operandB, i => creature(false, i < operandA || actionDone))}
      </div>
    )
  }

  const lineStyle = (i: number): React.CSSProperties => ({
    opacity: textStep >= i + 1 ? 1 : 0.06,
    transition: 'opacity .3s',
    fontFamily: 'Fredoka One, cursive', fontSize: 21, color: tokens.ink,
    lineHeight: 1.3, textAlign: 'center',
  })

  const eqPiece = (visible: boolean, el: React.ReactNode) => (
    <span style={{ opacity: visible ? 1 : 0, transition: 'opacity .3s', display: 'inline-block' }}>{el}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>

      {/* The story — the title band for this exercise */}
      <ExerciseTitle tokens={tokens} style={{ padding: '10px 22px 12px', maxWidth: 320 }}>
        <div style={lineStyle(0)}>{lines[0]}</div>
        <div style={lineStyle(1)}>{lines[1]}</div>
        <div style={{ ...lineStyle(2), fontSize: 23 }}>{lines[2]}</div>
      </ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ padding: '14px 24px', gap: 12 }}>
        {/* The acted story + its ▶ button. The film's place is reserved even
            when no film is on screen, so the stage keeps its size. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ visibility: film !== null ? 'visible' : 'hidden' }}>{anim()}</div>
          <button onClick={replay} disabled={disabled || !complete}
            style={{
              width: 46, height: 46, borderRadius: '50%', border: `2px solid ${tokens.ink}`,
              background: tokens.paper, fontSize: 20, cursor: disabled || !complete ? 'default' : 'pointer',
              boxShadow: '2px 3px 0 rgba(61,47,30,.12)', opacity: complete ? 1 : 0.45,
            }}
            aria-label="speel het verhaal">▶</button>
        </div>

        {/* Answer area. With showSum the sum forms alongside the sentences; at
            the top tier's first attempt only the answer box shows — the story
            has to be read to know what to type (the one sanctioned exception to
            "the equation is always visible"). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38 }}>
          {showSum && <>
            {eqPiece(textStep >= 1, <span style={{ color: tokens.accentText }}>{operandA}</span>)}
            {eqPiece(textStep >= 2, <span style={{ color: opColor(op, tokens) }}>{opGlyph(op)}</span>)}
            {eqPiece(textStep >= 2, <span style={{ color: tokens.pop }}>{operandB}</span>)}
            {eqPiece(textStep >= 3, <span style={{ color: tokens.ink, opacity: 0.4, fontSize: 32 }}>=</span>)}
          </>}
          <AnswerSlot value={input} solved={solved} size={48} tokens={tokens} />
        </div>
      </ExerciseStage>

      <NumPad onKey={handleKey} disabled={disabled || answered || !complete} tokens={scene?.tokens} />
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
      'Reading failure masquerading as math failure — mitigated by the ▶ tap (acts the story out; taps are recorded), the sum-showing tier, the pictured retry, and by weight-only exposure (never a gate).',
    ],
    progression: 'tekst-som (60): the sentences, with the sum forming alongside — the rung in between. tekst (80): the words stand alone. In both, the film plays only on the ▶ tap and the creatures leave at the question. Retry: the film plays by itself, the creatures stay, the sum is shown.',
  },
  // Retry: the SAME story (variant decides the sentences), now with the equation.
  retryStable: ['variant', 'sceneIndex'],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  // No zero term (a + 0, 0 + a, a − 0): a story in which nothing happens is not a story.
  isCompatible: (a, b) => a !== 0 && b !== 0,
  generateMeta(_operandA, _operandB, score, problem?: Problem, ctx?) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op ?? '+'
    const variant: Variant = ctx?.retryOf?.variant ??
      (op === '-' ? 'wegnemen' : (Math.random() < 0.55 ? 'erbij' : 'samenvoegen'))
    return { variant, sceneIndex: ctx?.retryOf?.sceneIndex ?? Math.floor(Math.random() * 24), tierId: tier.id }
  },
  Component: RekenverhaalComponent,
}

registerExercise(Rekenverhaal)
