import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NATURE_TOKENS } from '../presentation/tokens'

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

function DotPattern({ n, ink, paper, dot, refuse }: { n: number; ink: string; paper: string; dot: string; refuse: string }) {
  if (n <= 5) {
    const positions = DOT_POS[n] ?? []
    return (
      <div style={{ position: 'relative', width: 130, height: 130, background: paper, borderRadius: 16, border: `2px solid ${ink}` }}>
        {positions.map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: 30, height: 30, borderRadius: '50%',
            background: dot, boxShadow: `0 3px 8px ${dot}88`,
          }} />
        ))}
      </div>
    )
  }

  // 6–10: two rows, 5-structure — refuse (berry) top, dot (sky) bottom
  const row2 = n - 5
  return (
    <div style={{ background: paper, borderRadius: 16, padding: '14px 16px', border: `2px solid ${ink}`, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: refuse, boxShadow: `0 3px 8px ${refuse}88` }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: row2 }, (_, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: dot, boxShadow: `0 3px 8px ${dot}88` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function DotPatternRecogniseComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<DotPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question
  const { ink, paper, cream, dot, refuse } = scene?.tokens ?? NATURE_TOKENS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>Hoeveel?</div>
      <DotPattern n={operandA} ink={ink} paper={paper} dot={dot} refuse={refuse} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer)} disabled={disabled} tokens={scene?.tokens} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const DotPatternRecognise: ExerciseDefinition<DotPatternRecogniseMeta> = {
  id: 'dot-pattern-recognise',
  label: 'Herken het stippenpatroon',
  supportsReveal: false,
  generateMeta(operandA) { return { options: makeOptions(operandA) } },
  Component: DotPatternRecogniseComponent,
}

registerExercise(DotPatternRecognise)
