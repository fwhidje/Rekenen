import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { useEffect, useState } from 'react'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { skillRange } from '../curriculum/skills'

const TIERS: ExerciseTier[] = [
  { id: 'labelled', minScore: 0,  label: 'met getallen', description: 'Every cell is labelled — the child matches the numeral to its position.' },
  { id: 'sparse',   minScore: 50, label: 'enkel ankers', description: 'Only 0, the max and multiples of 5 are labelled — the child reasons about position from the anchors.' },
]

interface NumberlinePlaceMeta {
  showLabels: boolean
  max: number
  tierId: string
}

function NumberlinePlaceComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberlinePlaceMeta>) {
  const { operandA, answer, meta } = question
  const { showLabels, max } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream, accentText, confirm } = tokens
  // Closure: the tapped cell turns to the confirm colour and shows its number.
  const { solved, answered, resolve } = useClosure(question, onResolve)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { setPicked(null) }, [question])
  const locked = disabled || answered

  const numbers = Array.from({ length: max + 1 }, (_, i) => i)
  const cellW = Math.max(26, Math.min(42, Math.floor(300 / (max + 1))))

  const labelFor = (n: number) => {
    if (showLabels || (solved && n === picked)) return String(n)
    if (n === 0 || n === max) return String(n)
    if (n % 5 === 0) return String(n)
    return ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <ExerciseTitle tokens={tokens}>
        Waar staat <span style={{ color: accentText }}>{operandA}</span>?
      </ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex' }}>
        {numbers.map((n, idx) => {
          const isFirst = idx === 0
          const isLast  = idx === numbers.length - 1
          const held = solved && n === picked
          return (
            <div
              key={n}
              onClick={() => { if (!locked) { setPicked(n); resolve(n === answer, { givenAnswer: n }) } }}
              onPointerDown={e => { if (!locked) (e.currentTarget as HTMLDivElement).style.background = cream }}
              onPointerUp={e =>   { if (!held) (e.currentTarget as HTMLDivElement).style.background = paper }}
              onPointerLeave={e =>{ if (!held) (e.currentTarget as HTMLDivElement).style.background = paper }}
              style={{
                width: cellW, height: cellW, background: held ? confirm : paper,
                borderTop:    `2px solid ${ink}`, borderBottom: `2px solid ${ink}`,
                borderLeft:   `2px solid ${ink}`,
                borderRight:  isLast ? `2px solid ${ink}` : 'none',
                borderRadius: isFirst ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka One, cursive', fontSize: Math.floor(cellW * 0.42), color: held ? 'white' : ink,
                cursor: locked ? 'default' : 'pointer',
                boxSizing: 'border-box', transition: 'background .12s', userSelect: 'none',
              }}
            >{labelFor(n)}</div>
          )
        })}
      </div>
      </ExerciseStage>
    </div>
  )
}

const NumberlinePlace: ExerciseDefinition<NumberlinePlaceMeta> = {
  id: 'numberline-place',
  label: 'Zet het getal op de lijn',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Locate a numeral on the number line — the position is the quantity, expressed ordinally. Number sense in its positional form.',
    pitfalls: [
      'Off-by-one — counts cells starting at 1 instead of from 0.',
      'Loses the position when labels go sparse; no longer reasons from the visible anchors (0, 5, 10).',
    ],
    progression: 'labelled (all cells numbered) → sparse (only anchor labels), forcing positional reasoning as score rises.',
  },
  retryStable: ['max'],
  // The answer is a place, not a number to read back — neutral message; the
  // retry (all cells labelled) is the help.
  correctStatement: () => null,
  generateMeta(_a, _b, score, _problem, ctx) {
    const tier = pickTier(TIERS, score)
    // The line is as long as the skill's numbers, not the number asked: in a
    // tot-10 skill a 3 is placed on 0–10 too (playtest, Nov 2026).
    const max = ctx?.retryOf?.max ?? skillRange(ctx?.skillId ?? '', _a)
    return { showLabels: tier.id === 'labelled', max, tierId: tier.id }
  },
  Component: NumberlinePlaceComponent,
}

registerExercise(NumberlinePlace)
