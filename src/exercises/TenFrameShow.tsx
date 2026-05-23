import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'recognise', minScore: 0, label: 'herkennen', description: 'Read a quantity from a ten-frame and pick its numeral. Single tier; the frame structures around 5 and 10.' },
]

interface TenFrameShowMeta {
  options: number[]
  tierId: string
}

function makeOptions(correct: number): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3]) {
    const v = correct + delta
    if (v >= 1 && v <= 10) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
}

// ─── Ten-frame visual ─────────────────────────────────────────────────────────

function TenFrame({ n, ink, paper }: { n: number; ink: string; paper: string }) {
  const cellSize = 44
  const cells = Array.from({ length: 10 }, (_, i) => i < n)
  return (
    <div style={{
      background: paper, border: `2px solid ${ink}`, borderRadius: 12,
      padding: 6, display: 'grid',
      gridTemplateColumns: `repeat(5, ${cellSize}px)`,
      gridTemplateRows: `repeat(2, ${cellSize}px)`,
      gap: 4,
    }}>
      {cells.map((filled, i) => (
        <div key={i} style={{
          width: cellSize, height: cellSize,
          border: `2px solid ${ink}`, borderRadius: 8,
          background: paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {filled && (
            <div style={{
              width: cellSize - 14, height: cellSize - 14,
              borderRadius: '50%', background: ink,
              boxShadow: `0 2px 4px rgba(0,0,0,.2)`,
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function TenFrameShowComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<TenFrameShowMeta>) {
  const { operandA, answer, meta } = question
  const { ink, paper, cream } = scene?.tokens ?? NATURE_TOKENS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Hoeveel?</div>
      <TenFrame n={operandA} ink={ink} paper={paper} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer, { givenAnswer: v })} disabled={disabled} tokens={scene?.tokens} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const TenFrameShow: ExerciseDefinition<TenFrameShowMeta> = {
  id: 'ten-frame-show',
  label: 'Tienveld — hoeveel?',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Read a quantity from a ten-frame, building the 5- and 10-anchored structure of numbers.',
    pitfalls: ['Counting filled cells one by one', 'Ignoring the empty cells when reasoning toward 10'],
    progression: 'Single tier; the ten-frame itself is the structural scaffold.',
  },
  generateMeta(operandA) { return { options: makeOptions(operandA), tierId: 'recognise' } },
  Component: TenFrameShowComponent,
}

registerExercise(TenFrameShow)
