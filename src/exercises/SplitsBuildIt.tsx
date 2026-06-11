import { Fragment, useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeNumeralOptions } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'open',    minScore: 0,  label: 'vrij',    description: 'Row of dots; kid taps a gap to cut it into two groups. One group\'s value is then revealed ("2 en ?") and the kid names the other from numeral options — producing a split AND reading it back.' },
  { id: 'gericht', minScore: 50, label: 'gericht', description: '"Splits 5 in 2 en 3" — kid has to cut so the groups are 2 and 3, in either order (order-independence is in the mechanic). The cut itself commits the answer.' },
]

const DOT_SIZE = 38
const DOT_GAP = 10        // intra-row gap between adjacent dots
const TAP_W = 28          // width of the tappable gap zone (overlaps adjacent dots)
const RESOLVE_DELAY = 600 // ms between gericht cut and onResolve

interface SplitsBuildItMeta {
  tierId: string
  total: number
  parts: [number, number]   // gericht target; unused at open
}

function SplitsBuildItComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsBuildItMeta>) {
  const { operandA, operandB, meta } = question
  const { tierId, total, parts } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, cream, accentText, refuse, dot, pop } = tokens

  // cut: gap index (1..total-1) = how many dots are in the left group
  const [cut, setCut] = useState<number | null>(null)
  // open-tier confirm step: which side is revealed + the numeral options
  const [confirmStep, setConfirmStep] = useState<{ revealLeft: boolean; options: number[] } | null>(null)

  useEffect(() => { setCut(null); setConfirmStep(null) }, [operandA, operandB, tierId])

  const tapGap = (i: number) => {
    if (disabled || cut !== null) return
    setCut(i)
    if (tierId === 'gericht') {
      // Either order of the asked parts is the same split.
      const correct = i === parts[0] || i === parts[1]
      setTimeout(() => onResolve(correct, { givenAnswer: i }), RESOLVE_DELAY)
      return
    }
    // open: reveal one side, ask the other — parts in tot-5 run 1..4.
    const revealLeft = Math.random() < 0.5
    const hidden = revealLeft ? total - i : i
    setConfirmStep({ revealLeft, options: makeNumeralOptions(hidden, 4) })
  }

  const pickHidden = (v: number) => {
    if (disabled || !confirmStep || cut === null) return
    const hidden = confirmStep.revealLeft ? total - cut : cut
    onResolve(v === hidden, { givenAnswer: v })
  }

  const dotsInLeft = cut ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        {tierId === 'gericht'
          ? <>Splits {total} in <span style={{ color: refuse }}>{parts[0]}</span> en <span style={{ color: pop }}>{parts[1]}</span></>
          : <>Maak je eigen splitsing van <span style={{ color: accentText }}>{total}</span></>
        }
      </div>

      {/* Dot row with tappable gaps */}
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center',
        height: DOT_SIZE + 24,
        padding: '0 10px',
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const inLeft = cut !== null && i < dotsInLeft
          const colour = cut === null ? dot : (inLeft ? refuse : pop)
          return (
            <Fragment key={i}>
              <div style={{
                width: DOT_SIZE, height: DOT_SIZE, borderRadius: '50%',
                background: colour, boxShadow: `0 2px 4px rgba(0,0,0,.18)`,
                transition: 'background-color .25s',
                zIndex: 1,
              }} />
              {i < total - 1 && (
                <div
                  onClick={() => tapGap(i + 1)}
                  style={{
                    width: DOT_GAP, height: DOT_SIZE + 16, position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: disabled || cut !== null ? 'default' : 'pointer',
                  }}>
                  {/* Wider invisible hit area */}
                  <div style={{
                    position: 'absolute', left: -((TAP_W - DOT_GAP) / 2),
                    width: TAP_W, height: DOT_SIZE + 24,
                  }} />
                  {/* Cut line */}
                  {cut === i + 1 && (
                    <div style={{
                      width: 3, height: DOT_SIZE + 18,
                      background: ink, borderRadius: 2,
                      boxShadow: `0 0 6px ${ink}55`,
                    }} />
                  )}
                  {/* Subtle gap hint when no cut */}
                  {cut === null && !disabled && (
                    <div style={{
                      width: 2, height: DOT_SIZE - 4,
                      background: `${ink}22`, borderRadius: 1,
                    }} />
                  )}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Result line: gericht shows the made split; open reveals one side and asks the other */}
      <div style={{
        height: 28,
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
        opacity: cut !== null ? 1 : 0.25, transition: 'opacity .2s',
      }}>
        {cut === null
          ? <span style={{ fontSize: 14 }}>Tik tussen de stippen</span>
          : tierId === 'gericht'
            ? <><span style={{ color: refuse }}>{cut}</span> en <span style={{ color: pop }}>{total - cut}</span></>
            : confirmStep?.revealLeft
              ? <><span style={{ color: refuse }}>{cut}</span> en <span style={{ color: pop }}>?</span></>
              : <><span style={{ color: refuse }}>?</span> en <span style={{ color: pop }}>{total - cut}</span></>
        }
      </div>

      {/* Open-tier confirm: name the hidden part */}
      {confirmStep && (
        <ChoiceButtons options={confirmStep.options} onPick={pickHidden} disabled={disabled} tokens={scene?.tokens} />
      )}
    </div>
  )
}

const SplitsBuildIt: ExerciseDefinition<SplitsBuildItMeta> = {
  id: 'splits-build-it',
  label: 'Maak je eigen splitsing',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Active splitting — the kid decides where a split goes instead of reading one that\'s shown, then names what they made. Production plus read-back at open; targeted production at gericht, where either order of the asked parts counts (order-independence in the mechanic).',
    pitfalls: [
      'Echoes the revealed part instead of naming the hidden one — doesn\'t flip to the other group.',
      'Off-by-one when naming the hidden part — misreads the group they just made.',
      'At gericht, cuts a split with the right total but the wrong sizes (e.g. 1|4 when 2 en 3 was asked).',
    ],
    progression: 'open (cut anywhere, then read back the split you made — production and naming in one loop) → gericht (cut a specific split on request, either order accepted). Free production narrows into guided production.',
  },
  generateMeta(operandA, operandB, score) {
    const tierId = pickTier(TIERS, score).id
    return { tierId, total: operandA + operandB, parts: [operandA, operandB] }
  },
  Component: SplitsBuildItComponent,
}

registerExercise(SplitsBuildIt)
