import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import type { CounterProps } from '../presentation/nature/Counters'
import type { ComponentType } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'beeld', minScore: 0,  label: 'met beeld',   description: 'Anchor shown as numeral + counter group; the four options are counter groups (sizes vary so length is no cue). The relation is judged on visible quantities.' },
  { id: 'getal', minScore: 60, label: 'enkel getal', description: 'Anchor and options as bare numerals — the relation judged symbolically.' },
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

function CounterGroup({ n, Counter, size, gap }: { n: number; Counter: ComponentType<CounterProps>; size: number; gap: number }) {
  const row1 = Math.min(n, 5)
  const row2 = n - row1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap }}>
        {Array.from({ length: row1 }, (_, i) => <Counter key={i} size={size} />)}
      </div>
      {row2 > 0 && (
        <div style={{ display: 'flex', gap }}>
          {Array.from({ length: row2 }, (_, i) => <Counter key={5 + i} size={size} />)}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function ComparePickComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<ComparePickMeta>) {
  const { operandA, meta } = question
  const { relation, correctB, options, optionSizes, optionGaps, style } = meta
  const { ink, paper, cream, accentText } = scene?.tokens ?? NATURE_TOKENS
  const Counter = scene?.Counter

  const pick = (v: number) => {
    if (disabled) return
    onResolve(v === correctB, { givenAnswer: v })
  }

  const relationWord = relation === 'evenveel' ? 'Evenveel als' : relation === 'meer' ? 'Meer dan' : 'Minder dan'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        <span style={{ color: accentText }}>{relationWord}</span> {operandA}
      </div>

      {/* Anchor */}
      <div style={{
        background: paper, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      }}>
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 44, color: ink, lineHeight: 1 }}>
          {operandA}
        </div>
        {style === 'beeld' && Counter && (
          <CounterGroup n={operandA} Counter={Counter} size={30} gap={5} />
        )}
      </div>

      {/* Options */}
      {style === 'getal' || !Counter ? (
        <ChoiceButtons options={options} onPick={pick} disabled={disabled} tokens={scene?.tokens} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 380 }}>
          {options.map((val, i) => (
            <div key={i} onClick={() => pick(val)} style={{
              minHeight: 86,
              background: cream, border: `2px solid ${ink}`, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px 6px',
              cursor: disabled ? 'default' : 'pointer',
              boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: disabled ? 0.45 : 1, userSelect: 'none',
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
  generateMeta(operandA, _b, score) {
    const tier = pickTier(TIERS, score)
    const max = operandA <= 5 ? 5 : 10

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
      optionSizes: options.map(() => rnd(24, 38)),
      optionGaps: options.map(() => rnd(2, 10)),
      style: tier.id as Style,
      variant: relation,
      tierId: tier.id,
    }
  },
  Component: ComparePickComponent,
}

registerExercise(ComparePick)
