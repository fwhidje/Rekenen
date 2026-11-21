import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import type { CounterProps } from '../presentation/nature/Counters'
import type { ComponentType } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'
import { useEffect, useState } from 'react'
import { ExerciseTitle, ExerciseStage, heldStyle } from '../presentation/components/ExerciseFrame'
import { FiveRow } from '../presentation/components/FiveRow'
import { useClosure } from '../presentation/useClosure'
import { skillRange } from '../curriculum/skills'

const TIERS: ExerciseTier[] = [
  { id: 'beeld', minScore: 0,  label: 'met beeld',   description: 'Title "Meer dan 3"; the anchor stands on the stage as a counter group; the four options are counter groups (sizes vary so length is no cue). The relation is judged on visible quantities.' },
  { id: 'getal', minScore: 60, label: 'enkel getal', description: 'No stage: the title names the anchor ("Meer dan 3"), the options are bare numerals — the relation judged symbolically.' },
]

type Relation = 'meer' | 'minder' | 'evenveel'
type Style = 'beeld' | 'getal'

interface ComparePickMeta {
  relation: Relation
  correctB: number
  options: number[]
  optionSizes: number[]   // per-option counter size (beeld) — de-confounds length
  optionGaps: number[]
  style: Style
  variant: string         // = relation, lifted into the answer record
  tierId: string
}

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

const satisfies = (relation: Relation, b: number, a: number): boolean =>
  relation === 'meer' ? b > a : relation === 'minder' ? b < a : b === a

// ─── Counter group (rows of 5) ───────────────────────────────────────────────

// A 5-row (convention Q). Size and gap vary per group on purpose: row length
// must not give the answer away.
function CounterGroup({ n, Counter, size, gap }: { n: number; Counter: ComponentType<CounterProps>; size: number; gap: number }) {
  return <FiveRow n={n} item={size} gap={gap} renderItem={() => <Counter size={size} />} />
}

// ─── Component ────────────────────────────────────────────────────────────────

function ComparePickComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ComparePickMeta>) {
  const { operandA, meta } = question
  const { relation, correctB, options, optionSizes, optionGaps, style } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, cream, accentText } = tokens
  const Counter = scene?.Counter

  // Closure: the chosen option is held (confirm frame / confirm button).
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const locked = disabled || answered

  const pick = (v: number) => {
    if (locked) return
    setPicked(v)
    resolve(v === correctB, { givenAnswer: v })
  }

  const relationWord = relation === 'evenveel' ? 'Evenveel als' : relation === 'meer' ? 'Meer dan' : 'Minder dan'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      <ExerciseTitle tokens={scene?.tokens}>
        <span style={{ color: accentText }}>{relationWord}</span> {operandA}
      </ExerciseTitle>

      {/* Anchor. met beeld: the anchor's group on the stage — its number is in
          the title, so the stage shows the quantity only. enkel getal: no stage
          at all; title and number buttons (playtest, Nov 2026: the stage
          repeated the title's number). */}
      {style === 'beeld' && (
        <ExerciseStage tokens={tokens} style={{ flexDirection: 'row', gap: 14, padding: '12px 20px' }}>
          {Counter
            ? <CounterGroup n={operandA} Counter={Counter} size={30} gap={5} />
            : <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: ink, lineHeight: 1 }}>{operandA}</div>}
        </ExerciseStage>
      )}

      {/* Options */}
      {style === 'getal' || !Counter ? (
        <ChoiceButtons options={options} onPick={pick} disabled={locked} picked={picked} solved={solved} tokens={tokens} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 380 }}>
          {options.map((val, i) => (
            <div key={i} onClick={() => pick(val)} style={{
              minHeight: 86,
              background: cream, border: `2px solid ${ink}`, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px 6px',
              cursor: locked ? 'default' : 'pointer',
              boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: locked ? 0.45 : 1, userSelect: 'none', transition: 'box-shadow .15s, border-color .15s',
              ...(solved && val === picked ? heldStyle(tokens) : {}),
            }}>
              <CounterGroup n={val} Counter={Counter} size={optionSizes[i]} gap={optionGaps[i]} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const ComparePick: ExerciseDefinition<ComparePickMeta> = {
  id: 'compare-pick',
  label: 'Meer, minder of evenveel?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Relation-to-anchor selection: given A and a relation (meer dan / minder dan / evenveel als), pick the B that satisfies it. The only exercise where evenveel is an answerable claim, and the complement to compare-more-less (which compares what is shown; this constructs what is asked).',
    pitfalls: [
      'Relation confusion — picks a B that is meer when minder was asked (variant is recorded per answer, so per-relation accuracy is visible in the data).',
      'Evenveel avoidance — treats every round as "find the bigger/smaller one" and never picks the equal option.',
      'At beeld tier, judges by visual bulk instead of count — option sizes vary, so bulk misleads.',
    ],
    progression: 'beeld (anchor and options as visible quantities) → getal (bare numerals). The relation vocabulary stays constant; the representation abstracts.',
  },
  // Retry: the same relation, the same answer, the same options — now as
  // pictures (getal → beeld).
  retryStable: ['relation', 'correctB', 'options', 'variant'],
  correctStatement: q => `${q.meta.correctB} is ${q.meta.relation === 'evenveel' ? 'evenveel als' : q.meta.relation === 'meer' ? 'meer dan' : 'minder dan'} ${q.operandA}`,
  generateMeta(operandA, _b, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    const max = skillRange(ctx?.skillId ?? '', operandA)
    const prev = ctx?.retryOf
    if (prev) {
      return {
        ...prev,
        optionSizes: prev.optionSizes ?? prev.options.map(() => rnd(16, 24)),
        optionGaps: prev.optionGaps ?? prev.options.map(() => rnd(2, 7)),
        style: tier.id as Style,
        tierId: tier.id,
      }
    }

    // A relation is offered only when a correct B exists AND three violating
    // distractors exist within range — "exactly one satisfying option" must hold.
    const feasible: Relation[] = ['evenveel']
    if (operandA < max && operandA >= 3) feasible.push('meer')      // violators: B ≤ A
    if (operandA > 1 && operandA <= max - 2) feasible.push('minder') // violators: B ≥ A
    const relation = feasible[Math.floor(Math.random() * feasible.length)]

    const correctB = relation === 'meer' ? rnd(operandA + 1, max)
                   : relation === 'minder' ? rnd(1, operandA - 1)
                   : operandA

    const violators = shuffle(
      Array.from({ length: max }, (_, i) => i + 1)
        .filter(v => !satisfies(relation, v, operandA) && v !== correctB),
    ).slice(0, 3)

    const options = shuffle([correctB, ...violators])
    return {
      relation,
      correctB,
      options,
      // A 5-row does not shrink, so a full row must fit half a phone width
      // (≤ 150px): sizes 16–24, gaps 2–7. Still varied per card — length is no cue.
      optionSizes: options.map(() => rnd(16, 24)),
      optionGaps: options.map(() => rnd(2, 7)),
      style: tier.id as Style,
      variant: relation,
      tierId: tier.id,
    }
  },
  Component: ComparePickComponent,
}

registerExercise(ComparePick)
