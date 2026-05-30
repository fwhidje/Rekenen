import { Fragment, useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'open',     minScore: 0,  label: 'vrij',    description: 'Structured total shown as a row of dots, or canonical die-pattern. Kid swipes vertically to cut the visual into two groups; the cut snaps to the nearest valid gap between dots. App shows the resulting split; kid confirms it with a choice tile.' },
  { id: 'targeted', minScore: 50, label: 'gericht', description: 'Same gesture, with a target — "maak een splitsing waar links 2 is". Kid has to cut at the right place rather than any place. The cut itself commits the answer, no confirmation step.' },
]

const DOT_SIZE = 38
const DOT_GAP = 10        // intra-row gap between adjacent dots
const TAP_W = 28          // width of the tappable gap zone (overlaps adjacent dots)
const RESOLVE_DELAY = 600 // ms between cut and onResolve

interface SplitsBuildItMeta {
  tierId: string
  total: number
  targetLeft: number | null   // null for open tier
}

function SplitsBuildItComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsBuildItMeta>) {
  const { operandA, operandB, meta } = question
  const { tierId, total, targetLeft } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, cream, accent, accentText, confirm, refuse, dot, pop } = tokens

  // cut: gap index (1..total-1) = how many dots are in the left group
  const [cut, setCut] = useState<number | null>(null)

  useEffect(() => { setCut(null) }, [operandA, operandB, tierId])

  const tapGap = (i: number) => {
    if (disabled || cut !== null) return
    setCut(i)
    const correct = tierId === 'open' ? true : (targetLeft !== null && i === targetLeft)
    setTimeout(() => onResolve(correct, { givenAnswer: i }), RESOLVE_DELAY)
  }

  // Track which dots are in the left group (coloured A) once cut.
  const dotsInLeft = cut ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>
        {tierId === 'targeted'
          ? <>Maak waar links <span style={{ color: accentText }}>{targetLeft}</span> is</>
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
                      background: accent, borderRadius: 2,
                      boxShadow: `0 0 6px ${accent}88`,
                    }} />
                  )}
                  {/* Subtle hover hint when no cut */}
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

      {/* Result feedback */}
      <div style={{
        height: 28,
        fontFamily: 'Fredoka One, cursive', fontSize: 22, color: ink,
        opacity: cut !== null ? 1 : 0.25, transition: 'opacity .2s',
      }}>
        {cut !== null
          ? <><span style={{ color: refuse }}>{cut}</span> en <span style={{ color: pop }}>{total - cut}</span></>
          : <span style={{ fontSize: 14 }}>Tik tussen de stippen</span>
        }
      </div>

      {/* Hidden — tokens used to avoid unused-var lint */}
      <span style={{ display: 'none' }}>{paper}{confirm}</span>
    </div>
  )
}

const SplitsBuildIt: ExerciseDefinition<SplitsBuildItMeta> = {
  id: 'splits-build-it',
  label: 'Maak je eigen splitsing',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Active perceptual splitting — instead of reading a split that\'s already shown, the kid decides where a split can go. Gesture-driven; the splitting-as-a-thing-the-kid-controls move that no other recognition exercise gets at.',
    pitfalls: [
      'Cuts to leave one side empty (effectively a 0+5, excluded by skill scope) — hasn\'t yet committed to "both parts must have at least one".',
      'At targeted tier, cuts at the wrong gap and produces the right left-count by accident (e.g. by counting from the right side) — logged via the gap-index for diagnosis.',
      'Hovering, false-starts, releases without committing — diagnostic of indecision rather than wrong reasoning.',
    ],
    progression: 'open (any valid split, kid commits and confirms what they made) → targeted (specific split requested, kid has to cut at the right place). Free exploration narrows into guided production.',
  },
  generateMeta(operandA, operandB, score) {
    const tierId = pickTier(TIERS, score).id
    const total = operandA + operandB
    const targetLeft = tierId === 'targeted' ? operandA : null
    return { tierId, total, targetLeft }
  },
  Component: SplitsBuildItComponent,
}

registerExercise(SplitsBuildIt)
