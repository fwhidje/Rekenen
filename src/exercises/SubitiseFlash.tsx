import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { NATURE_TOKENS } from '../presentation/tokens'

const TIERS: ExerciseTier[] = [
  { id: 'choice', minScore: 0,  label: 'kiezen',   description: 'Kid taps "Klaar?" to start. Pattern flashes for ~1 second then hides. Kid picks the numeral from 4 options. One retry button available — replays the same pattern, never a fresh one; retry-used is logged.' },
  { id: 'typed',  minScore: 75, label: 'intikken', description: 'Same flash mechanic, but kid types on the numpad. Retry still available.' },
]

const FLASH_MS = 900

interface SubitiseFlashMeta {
  options: number[]
  tierId: string
}

// Canonical subitising positions for 1–5 as [x%, y%].
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

function DieSquare({ n, color, size }: { n: number; color: string; size: number }) {
  const positions = DOT_POS[n] ?? []
  const dotSize = Math.round(size * 0.23)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {positions.map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: color, boxShadow: `0 3px 8px ${color}88`,
        }} />
      ))}
    </div>
  )
}

function DotPattern({ n, ink, paper, dot, refuse }: { n: number; ink: string; paper: string; dot: string; refuse: string }) {
  if (n <= 5) {
    return (
      <div style={{ position: 'relative', width: 130, height: 130, background: paper, borderRadius: 16, border: `2px solid ${ink}` }}>
        <DieSquare n={n} color={dot} size={130} />
      </div>
    )
  }
  return (
    <div style={{
      background: paper, borderRadius: 16, border: `2px solid ${ink}`, padding: '10px 14px',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <DieSquare n={5} color={refuse} size={110} />
      <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
      <DieSquare n={n - 5} color={dot} size={110} />
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

type Phase = 'ready' | 'flash' | 'answer'

function SubitiseFlashComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SubitiseFlashMeta>) {
  const { operandA, meta } = question
  const { options, tierId } = meta
  const { ink, paper, cream, accent, confirm, dot, refuse } = scene?.tokens ?? NATURE_TOKENS

  const [phase, setPhase] = useState<Phase>('ready')
  const [retries, setRetries] = useState(0)
  const [input, setInput] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setPhase('ready'); setRetries(0); setInput('')
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [operandA, tierId])

  const startFlash = () => {
    setPhase('flash')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPhase('answer'), FLASH_MS)
  }

  const resolve = (given: number) => {
    if (disabled) return
    onResolve(given === operandA, { givenAnswer: given, tapCount: retries })
  }

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) resolve(parseInt(input, 10)); return }
    if (input.length < 2) setInput(v => v + key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <div style={{
        background: cream, border: `2px solid ${ink}`, borderRadius: 18,
        padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
        fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
      }}>{phase === 'answer' ? 'Hoeveel zag je?' : 'Vlug kijken!'}</div>

      {/* Stage area — fixed height so layout doesn't jump between phases */}
      <div style={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'ready' && (
          <button onClick={startFlash} disabled={disabled}
            style={{
              padding: '16px 40px', fontFamily: 'Fredoka One, cursive', fontSize: 26,
              background: confirm, color: 'white', border: `2px solid ${ink}`, borderRadius: 18,
              cursor: disabled ? 'default' : 'pointer', boxShadow: `0 2px 0 rgba(61,47,30,.18)`,
              opacity: disabled ? 0.45 : 1, userSelect: 'none',
            }}>Klaar?</button>
        )}
        {phase === 'flash' && (
          <DotPattern n={operandA} ink={ink} paper={paper} dot={dot} refuse={refuse} />
        )}
        {phase === 'answer' && (
          <div style={{
            width: 130, height: 130, borderRadius: 16, border: `2px dashed ${ink}55`,
            background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka One, cursive', fontSize: 48, color: `${ink}40`,
          }}>?</div>
        )}
      </div>

      {phase === 'answer' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
          {tierId === 'choice' ? (
            <ChoiceButtons options={options} onPick={resolve} disabled={disabled} tokens={scene?.tokens} />
          ) : (
            <>
              <div style={{
                minWidth: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: input ? confirm : accent, color: 'white',
                borderRadius: 12, border: `2px solid ${ink}`,
                fontFamily: 'Fredoka One, cursive', fontSize: 34,
                boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)', transition: 'background .18s',
              }}>{input || '?'}</div>
              <NumPad onKey={handleKey} disabled={disabled} tokens={scene?.tokens} />
            </>
          )}
          <button onClick={() => { setRetries(r => r + 1); startFlash() }} disabled={disabled}
            style={{
              padding: '8px 22px', fontFamily: 'Patrick Hand, cursive', fontSize: 16,
              background: paper, color: ink, border: `2px solid ${ink}`, borderRadius: 14,
              cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, userSelect: 'none',
            }}>↻ Nog eens</button>
        </div>
      )}
    </div>
  )
}

const SubitiseFlash: ExerciseDefinition<SubitiseFlashMeta> = {
  id: 'subitise-flash',
  label: 'Vlug kijken',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Forces conceptual subitising — the pattern is visible too briefly to count, so the kid either sees the structure or guesses. The diagnostic test for whether the recognise exercises are being passed by subitising or by quiet counting.',
    pitfalls: [
      'Uses the retry every time and counts on the second view — works around the diagnostic. Detectable: retry-used is logged on the answer record.',
      'Locks onto a partial read (saw the row-of-5, didn\'t register the +n) and answers with the partial number.',
      'Panics at the flash and taps a random option without trying. Distinguishable by very short time-to-answer.',
    ],
    progression: 'choice (constrained options, retry available) → typed (numpad, retry still available). Scaffolding fade is via answer mode, not via the flash itself — flash duration stays ~1 second throughout. That\'s the whole point of the exercise.',
  },
  // Retries are reported via tapCount (AnswerDetail has no dedicated retry field).
  generateMeta(operandA, _b, score) {
    return { options: makeOptions(operandA), tierId: pickTier(TIERS, score).id }
  },
  Component: SubitiseFlashComponent,
}

registerExercise(SubitiseFlash)
