import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickColors } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { FiveRow } from '../presentation/components/FiveRow'
import { Equation, eqText } from '../presentation/components/Equation'
import type { EqSign } from '../presentation/components/Equation'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useClosure } from '../presentation/useClosure'

// ─── teken-kiezen ─────────────────────────────────────────────────────────────
// A sum with its sign missing: "5 ○ 2 = 3". The child chooses + or −.
// From aftrekken-wegnemen-5 on, + and − sums rotate together, and answering
// the sum for a − (or the other way round) becomes the typical slip; here the
// sign is the whole question. It is also "turn a situation into an operation":
// at the entry a short scene plays first — things arrive, things leave, or two
// groups are paired off (verschil: nothing leaves, and it is still a −).

const TIERS: ExerciseTier[] = [
  { id: 'film', minScore: 0,  label: 'met filmpje', description: 'A short scene plays (arrive / leave / pair off), then the sum with its outcome. The sign is read off what happened.' },
  { id: 'som',  minScore: 40, label: 'enkel som',   description: 'The sum only: the sign follows from the numbers — is the outcome more or less than the first number?' },
  { id: 'zin',  minScore: 70, label: 'met zin',     description: 'One cue sentence and the numbers; the outcome is hidden until the sign is chosen, so the words decide.' },
]

type Scene = 'erbij' | 'wegnemen' | 'verschil'

interface TekenKiezenMeta {
  x: number; y: number; res: number
  sign: EqSign
  scene: Scene
  variant: Scene      // recorded on the answer
  colorA: string
  colorB: string
  tierId: string
}

const ITEM = 26
const GAP = 5

const cue = (scene: Scene, y: number) =>
  scene === 'erbij' ? (y === 1 ? 'Er komt er 1 bij.' : `Er komen er ${y} bij.`)
  : scene === 'wegnemen' ? (y === 1 ? 'Er gaat er 1 weg.' : `Er gaan er ${y} weg.`)
  : 'Hoeveel meer?'

function TekenKiezenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<TekenKiezenMeta>) {
  const { meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const { x, y, res, sign } = meta
  const film = meta.tierId === 'film' || !!question.isRetry
  const zin = meta.tierId === 'zin' && !question.isRetry

  const [picked, setPicked] = useState<EqSign | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const { solved, answered, resolve } = useClosure(question, onResolve)

  // film: [first group] → [what happens] → [the sum]; otherwise the sum at once
  const { step, complete } = useReveal(film ? [350, 1100, 900] : [350], question)
  const happened = !film || step >= 2

  const pick = (s: EqSign) => {
    if (disabled || answered || !complete) return
    setPicked(s)
    resolve(s === sign, { tapCount: 1 })
  }

  const dot = (color: string, state: 'on' | 'off' | 'crossed' | 'dim') => (
    <div style={{
      position: 'relative', width: ITEM - 4, height: ITEM - 4, borderRadius: '50%', background: color,
      opacity: state === 'off' ? 0 : state === 'on' ? 1 : 0.35, transition: 'opacity .5s',
    }}>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fredoka One, cursive', fontSize: 20, lineHeight: 1, color: ink,
        opacity: state === 'crossed' ? 1 : 0, transition: 'opacity .5s',
      }}>✕</span>
    </div>
  )

  // The scene. Every group is laid out for its final size from the start.
  const picture = () => {
    if (meta.scene === 'verschil') {
      // two groups under each other; the ones with a partner dim, the rest stands out
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <FiveRow n={x} item={ITEM} gap={GAP} renderItem={i => dot(meta.colorA, happened && i < y ? 'dim' : 'on')} />
          <FiveRow n={y} total={x} item={ITEM} gap={GAP} renderItem={() => dot(meta.colorB, happened ? 'dim' : 'on')} />
        </div>
      )
    }
    if (meta.scene === 'wegnemen') {
      return <FiveRow n={x} item={ITEM} gap={GAP} renderItem={i => dot(meta.colorA, happened && i >= x - y ? 'crossed' : 'on')} />
    }
    return <FiveRow n={x + y} item={ITEM} gap={GAP} renderItem={i => dot(i < x ? meta.colorA : meta.colorB, i < x || happened ? 'on' : 'off')} />
  }

  const signButton = (s: EqSign) => {
    const color = s === '-' ? tokens.refuse : tokens.confirm
    const isPicked = picked === s
    return (
      <button key={s} onClick={() => pick(s)}
        style={{
          width: 108, height: 78, fontFamily: 'Fredoka One, cursive', fontSize: 52, lineHeight: 1,
          background: isPicked ? color : tokens.paper, color: isPicked ? 'white' : color,
          border: `2.5px solid ${isPicked ? color : ink}`, borderRadius: 20,
          cursor: disabled || answered || !complete ? 'default' : 'pointer',
          boxShadow: '0 2px 0 rgba(61,47,30,.18)',
          opacity: (disabled || answered || !complete) && !isPicked ? 0.45 : 1,
          transition: 'background .18s', userSelect: 'none',
        }}>{s === '-' ? '−' : '+'}</button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>Plus of min?</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '14px 20px', gap: 10 }}>
        {film && <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>{picture()}</div>}
        {zin && (
          <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 21, color: ink, lineHeight: 1.2, textAlign: 'center' }}>
            {cue(meta.scene, y)}
          </div>
        )}
        {/* zin: the outcome stays open until the sign is chosen */}
        {zin && !solved
          ? <Equation x={x} sign={sign} y={y} res={res} hole="sign" shown={complete ? 2 : 0} size={40} tokens={tokens} />
          : <Equation x={x} sign={sign} y={y} res={res} hole="sign" solved={solved} shown={complete ? 3 : 0} size={40} tokens={tokens} />}
      </ExerciseStage>

      <div style={{ display: 'flex', gap: 18 }}>
        {signButton('+')}
        {signButton('-')}
      </div>
    </div>
  )
}

const TekenKiezen: ExerciseDefinition<TekenKiezenMeta> = {
  id: 'teken-kiezen',
  label: 'Plus of min?',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Read and choose the sign instead of assuming it: a situation (things arrive, things leave, two groups are compared) or a finished sum is turned into + or −. For verschil it carries the point that a comparison is a − although nothing leaves.',
    pitfalls: [
      'Two options: a guess is right half the time. The −3 on a wrong answer makes guessing lose, and the weight stays low.',
      'Always the sign of the skill at hand (always − in a − skill). In the getalfamilie skill the sign varies per question; in the − skills it does not — there the scene and the outcome, not the sign, are what is read.',
    ],
    progression: 'film: a scene plays, then the sum with its outcome. som (40): the sum only — the sign follows from whether the outcome is more or less. zin (70): a cue sentence and the two numbers; the outcome appears only with the answer. A retry brings the scene back.',
  },
  // Retry: the same sum (for a family: the same view) and the same picture.
  retryStable: ['x', 'y', 'res', 'sign', 'scene', 'colorA', 'colorB'],
  correctStatement: q => eqText(q.meta.x, q.meta.sign, q.meta.y, q.meta.res),
  // "5 ○ 0 = 5" has two right answers.
  isCompatible: (a, b) => a > 0 && b > 0,
  generateMeta(operandA, operandB, score, problem, ctx) {
    const tier = pickTier(TIERS, score)
    const prev = ctx?.retryOf
    const [colorA, colorB] = prev ? [prev.colorA, prev.colorB] : pickColors()
    let view: { x: number; y: number; res: number; sign: EqSign; scene: Scene }
    if (prev) {
      view = { x: prev.x, y: prev.y, res: prev.res, sign: prev.sign, scene: prev.scene }
    } else if (problem?.op === '-') {
      view = { x: operandA, y: operandB, res: operandA - operandB, sign: '-', scene: problem.form === 'verschil' ? 'verschil' : 'wegnemen' }
    } else if (problem?.op === 'split') {
      // a family: either of its two operations
      const total = operandA + operandB
      view = Math.random() < 0.5
        ? { x: operandA, y: operandB, res: total, sign: '+', scene: 'erbij' }
        : { x: total, y: operandA, res: operandB, sign: '-', scene: 'wegnemen' }
    } else {
      view = { x: operandA, y: operandB, res: operandA + operandB, sign: '+', scene: 'erbij' }
    }
    return { ...view, variant: view.scene, colorA, colorB, tierId: tier.id }
  },
  Component: TekenKiezenComponent,
}

registerExercise(TekenKiezen)
