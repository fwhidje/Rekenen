import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage, Reserve } from '../presentation/components/ExerciseFrame'
import { useClosure } from '../presentation/useClosure'
import { FEEDBACK } from '../presentation/feedback'
import { DOT_POS } from '../presentation/diePatterns'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'

const TIERS: ExerciseTier[] = [
  { id: 'choice', minScore: 0,  label: 'kiezen',   description: 'Kid taps "Klaar?" to start. Pattern flashes for ~1 second then hides. Kid picks the numeral from 4 options. One retry button available — replays the same pattern, never a fresh one; retry-used is logged.' },
  { id: 'typed',  minScore: 75, label: 'intikken', description: 'Same flash mechanic, but kid types on the numpad. Retry still available.' },
]

const FLASH_MS = 900

interface SubitiseFlashMeta {
  options: number[]
  tierId: string
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

// The stage's picture area: as tall as the tallest thing it shows (a pattern
// with its die face), so the ready button, the flash and the "?" all sit in the
// same box (convention L).
const AREA_H = 136

function SubitiseFlashComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SubitiseFlashMeta>) {
  const { operandA, meta } = question
  const { options, tierId } = meta
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, accent, confirm, dot, refuse } = tokens

  const [phase, setPhase] = useState<Phase>('ready')
  const [retries, setRetries] = useState(0)
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Closure: the "?" becomes the number (and a chosen button is held).
  const { solved, answered, resolve: close } = useClosure(question, onResolve)

  useEffect(() => {
    setPhase('ready'); setRetries(0); setInput(''); setPicked(null)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [question])

  const startFlash = () => {
    setPhase('flash')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPhase('answer'), FLASH_MS)
  }

  const resolve = (given: number) => {
    if (disabled || answered) return
    close(given === operandA, { givenAnswer: given, replayCount: retries })
  }

  const handleKey = (key: string) => {
    if (disabled || answered) return
    if (key === '⌫') { setInput(v => v.slice(0, -1)); return }
    if (key === '✓') { if (input) resolve(parseInt(input, 10)); return }
    if (input.length < 2) setInput(v => v + key)
  }

  const typed = tierId === 'typed'
  // The "?" box doubles as the typed answer's slot (typed tier).
  const boxText = solved ? String(operandA) : typed && input ? input : '?'
  const boxFill = solved ? confirm : typed && input ? accent : `${accent}18`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: typed ? 14 : 20, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{phase === 'answer' ? 'Hoeveel zag je?' : 'Vlug kijken!'}</ExerciseTitle>

      {/* One stage across all phases, its picture area of fixed height */}
      <ExerciseStage tokens={tokens} style={{ padding: typed ? '12px 24px' : undefined }}>
        <div style={{ height: AREA_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              width: 130, height: 130, boxSizing: 'border-box', borderRadius: 16,
              border: `2px ${solved || (typed && input) ? 'solid' : 'dashed'} ${solved ? confirm : typed && input ? accent : `${ink}55`}`,
              background: boxFill, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 48,
              color: solved || (typed && input) ? 'white' : `${ink}40`,
              transition: 'background .15s',
            }}>{boxText}</div>
          )}
        </div>
      </ExerciseStage>

      {/* The answer input's space is held from the start (convention L). */}
      <Reserve show={phase === 'answer'} style={{ gap: typed ? 10 : 14 }}>
        {typed
          ? <NumPad compact onKey={handleKey} disabled={disabled || answered || phase !== 'answer'} tokens={tokens} />
          : <ChoiceButtons options={options}
              onPick={v => { setPicked(v); resolve(v) }}
              disabled={disabled || answered || phase !== 'answer'}
              picked={picked} solved={solved} tokens={tokens} />}
        <button onClick={() => { setRetries(r => r + 1); startFlash() }} disabled={disabled || answered}
          style={{
            padding: '8px 22px', fontFamily: 'Patrick Hand, cursive', fontSize: 16,
            background: paper, color: ink, border: `2px solid ${ink}`, borderRadius: 14,
            cursor: disabled ? 'default' : 'pointer', opacity: disabled || answered ? 0.45 : 1, userSelect: 'none',
          }}>↻ Nog eens</button>
      </Reserve>
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
  // Replays ("↻ Nog eens") are reported as replayCount.
  // Retry: the same pattern with the same options.
  retryStable: ['options'],
  correctStatement: q => FEEDBACK.wrongMessage(q.answer),
  generateMeta(operandA, _b, score, _problem, ctx) {
    return { options: ctx?.retryOf?.options ?? makeNumeralOptions(operandA, numeralRangeMax(operandA)), tierId: pickTier(TIERS, score).id }
  },
  Component: SubitiseFlashComponent,
}

registerExercise(SubitiseFlash)
