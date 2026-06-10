import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { CounterProps } from '../presentation/nature/Counters'
import type { ComponentType } from 'react'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'twee',     minScore: 0,  label: 'twee groepen',  description: 'Two counter groups, "Welke is meer/minder?" — the comparative between two quantities, no numerals. Counter size and spacing vary per group so row length is not a valid cue.' },
  { id: 'drie',     minScore: 30, label: 'drie groepen',  description: 'Three counter groups labelled with numerals, "Welke is meest/minst?" — the superlative across three, quantity linked to symbol.' },
  { id: 'getallen', minScore: 70, label: 'enkel getal',   description: 'Three bare numerals, meest/minst — purely symbolic magnitude judgement.' },
]

type Style = 'twee' | 'drie' | 'getallen'

interface CompareMoreLessMeta {
  values: number[]      // 2 (twee) or 3 (drie/getallen) distinct counts
  askMost: boolean      // meer/meest vs minder/minst
  sizes: number[]       // per-group counter size — de-confounds row length
  gaps: number[]        // per-group counter gap
  style: Style
  variant: string       // 'meer' | 'minder' | 'meest' | 'minst'
  tierId: string
}

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

// ─── Counter group ────────────────────────────────────────────────────────────

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

function CompareMoreLessComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<CompareMoreLessMeta>) {
  const { meta } = question
  const { values, askMost, sizes, gaps, style } = meta
  const { ink, cream } = scene?.tokens ?? NATURE_TOKENS
  const Counter = scene?.Counter

  const winnerVal = askMost ? Math.max(...values) : Math.min(...values)

  const prompt = values.length === 2
    ? (askMost ? 'Welke is meer?' : 'Welke is minder?')
    : (askMost ? 'Welke is meest?' : 'Welke is minst?')

  const GroupPanel = ({ val, size, gap }: { val: number; size: number; gap: number }) => (
    <div onClick={() => { if (!disabled) onResolve(val === winnerVal) }} style={{
      minHeight: style === 'getallen' ? 80 : values.length === 2 ? 104 : 88,
      background: cream, border: `2px solid ${ink}`, borderRadius: 18,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 6, padding: '8px 10px',
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      userSelect: 'none',
    }}>
      {style === 'getallen' ? (
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 56, color: ink, lineHeight: 1 }}>
          {val}
        </div>
      ) : (
        <>
          {style === 'drie' && (
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink, lineHeight: 1 }}>
              {val}
            </div>
          )}
          {Counter ? (
            <CounterGroup n={val} Counter={Counter} size={size} gap={gap} />
          ) : (
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 48, color: ink }}>{val}</div>
          )}
        </>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        {prompt}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380 }}>
        {values.map((val, i) => (
          <GroupPanel key={i} val={val} size={sizes[i]} gap={gaps[i]} />
        ))}
      </div>
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const CompareMoreLess: ExerciseDefinition<CompareMoreLessMeta> = {
  id: 'compare-more-less',
  label: 'Meer of minder?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Compares quantities and names the relation: meer/minder between two groups, meest/minst across three. Comparison vocabulary as a core component of number sense; evenveel lives in compare-pick.',
    pitfalls: [
      'Picks the longer or bigger-looking row regardless of count — detectable here because counter size and spacing vary per group, so length and number can disagree.',
      'Confuses meer/minder (or meest/minst) — answers the opposite question.',
      'At drie, compares only two of the three groups and stops at a local winner.',
    ],
    progression: 'twee (two groups, comparative, image only) → drie (three groups, superlative, image + numeral) → getallen (three bare numerals). Two ladders at once: comparative → superlative, and image → symbol.',
  },
  generateMeta(operandA, _b, score) {
    const tier = pickTier(TIERS, score)
    const style = tier.id as Style
    const max = operandA <= 5 ? 5 : 10
    const groupCount = style === 'twee' ? 2 : 3

    const pool = shuffle(Array.from({ length: max }, (_, i) => i + 1).filter(n => n !== operandA))
    const values = shuffle([operandA, ...pool.slice(0, groupCount - 1)])

    // Per-group random size/gap so visual length is decoupled from count.
    const big = groupCount === 2
    const sizes = values.map(() => big ? rnd(32, 48) : rnd(26, 40))
    const gaps  = values.map(() => rnd(2, 12))

    const askMost = Math.random() < 0.6
    const variant = groupCount === 2 ? (askMost ? 'meer' : 'minder') : (askMost ? 'meest' : 'minst')
    return { values, askMost, sizes, gaps, style, variant, tierId: tier.id }
  },
  Component: CompareMoreLessComponent,
}

registerExercise(CompareMoreLess)
