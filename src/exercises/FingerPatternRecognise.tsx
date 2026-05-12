import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps } from './types'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'

interface FingerPatternRecogniseMeta {
  options: number[]
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

// Which fingers are raised for n (1–5)
// Fingers: [pinky, ring, middle, index, thumb] — thumb raised first
const FINGER_ORDER = [4, 3, 2, 1, 0] // indices raised in order (thumb first)

function Hand({ raised, flip = false }: { raised: number; flip?: boolean }) {
  // raised = how many fingers up on this hand (0–5)
  const raisedSet = new Set(FINGER_ORDER.slice(0, raised))
  const fingers = [0, 1, 2, 3, 4] // pinky to thumb

  return (
    <div style={{
      display: 'flex',
      flexDirection: flip ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 5,
      padding: '0 4px',
    }}>
      {fingers.map(i => {
        const up = raisedSet.has(i)
        const isThumb = i === 4
        return (
          <div key={i} style={{
            width: isThumb ? 14 : 16,
            height: up ? (isThumb ? 38 : 52) : (isThumb ? 22 : 28),
            borderRadius: isThumb ? '8px 8px 6px 6px' : '10px 10px 4px 4px',
            background: up ? '#FFD166' : '#F0E0C0',
            border: `2px solid ${up ? '#F4A400' : '#D4B890'}`,
            transition: 'height .15s, background .15s',
          }} />
        )
      })}
    </div>
  )
}

function FingerPattern({ n }: { n: number }) {
  const palmStyle: React.CSSProperties = {
    background: '#FFD166',
    border: '2px solid #F4A400',
    borderRadius: 10,
    padding: '6px 8px 10px',
    display: 'inline-flex',
    alignItems: 'flex-end',
  }

  if (n <= 5) {
    return (
      <div style={palmStyle}>
        <Hand raised={n} />
      </div>
    )
  }

  // 6–10: left hand full (5), right hand shows remainder
  const right = n - 5
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={palmStyle}>
        <Hand raised={5} />
      </div>
      <div style={palmStyle}>
        <Hand raised={right} flip />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function FingerPatternRecogniseComponent({ question, onResolve, disabled }: ExerciseComponentProps<FingerPatternRecogniseMeta>) {
  const { operandA, answer, meta } = question

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: '#888' }}>Hoeveel?</div>
      <FingerPattern n={operandA} />
      <ChoiceButtons options={meta.options} onPick={v => onResolve(v === answer)} disabled={disabled} />
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const FingerPatternRecognise: ExerciseDefinition<FingerPatternRecogniseMeta> = {
  id: 'finger-pattern-recognise',
  label: 'Herken het vingerpatroon',
  supportsReveal: false,

  generateMeta(operandA) {
    return { options: makeOptions(operandA) }
  },

  Component: FingerPatternRecogniseComponent,
}

registerExercise(FingerPatternRecognise)
