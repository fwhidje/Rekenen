import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'

interface DotPatternRecogniseMeta {
  options: number[]
}

// Canonical subitising positions for 1–5 as [x%, y%] in a square container
const DOT_POS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[50, 18], [22, 75], [78, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
}

function makeOptions(correct: number): number[] {
  const pool = new Set([correct])
  for (const delta of [-1, 1, -2, 2, 3, -3]) {
    const v = correct + delta
    if (v >= 1) pool.add(v)
    if (pool.size === 4) break
  }
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
}

// ─── Dot pattern visual ───────────────────────────────────────────────────────

function DotPattern({ n }: { n: number }) {
  if (n <= 5) {
    const positions = DOT_POS[n] ?? []
    return (
      <div style={{ position: 'relative', width: 130, height: 130, background: '#F7F7F7', borderRadius: 16 }}>
        {positions.map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: 30, height: 30, borderRadius: '50%',
            background: '#4CC9F0',
            boxShadow: '0 3px 8px #4CC9F066',
          }} />
        ))}
      </div>
    )
  }

  // 6–10: two rows with 5-structure, two closely spaced dot clusters
  const row2 = n - 5
  return (
    <div style={{ background: '#F7F7F7', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: '#EF233C', boxShadow: '0 3px 8px #EF233C66' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: row2 }, (_, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: '#9B5DE5', boxShadow: '0 3px 8px #9B5DE566' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function DotPatternRecogniseComponent({ question, onResolve, disabled }: ExerciseComponentProps<DotPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: '#888' }}>Hoeveel?</div>
      <DotPattern n={operandA} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer)} disabled={disabled} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const DotPatternRecognise: ExerciseDefinition<DotPatternRecogniseMeta> = {
  id: 'dot-pattern-recognise',
  label: 'Herken het stippenpatroon',
  supportsReveal: false,

  generateMeta(operandA) {
    return { options: makeOptions(operandA) }
  },

  Component: DotPatternRecogniseComponent,
}

registerExercise(DotPatternRecognise)
