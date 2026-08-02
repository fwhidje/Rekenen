import { useState, useEffect } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { DOT_POS } from '../presentation/diePatterns'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'

const TIERS: ExerciseTier[] = [
  { id: 'emoji', minScore: 0,  label: 'voorwerpen', description: 'Tap themed counters one by one (running count shown), then name the total from 4 numerals — the cardinality probe.' },
  { id: 'dots',  minScore: 40, label: 'stippen',    description: 'Same flow over subitising die-patterns — structured dots that nudge toward seeing rather than counting.' },
]

interface CountAndTapMeta {
  style: 'emoji' | 'dots'
  sceneIndex: number
  options: number[]
  tierId: string
}

// ─── Counter chip ─────────────────────────────────────────────────────────────

function CounterChip({ count, ink, paper }: { count: number; ink: string; paper: string }) {
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (count === 0) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 180)
    return () => clearTimeout(t)
  }, [count])

  return (
    <div style={{
      fontFamily: 'Fredoka One, cursive', fontSize: 22,
      color: ink, background: paper,
      border: `2px solid ${ink}`, borderRadius: 50,
      padding: '3px 16px', minWidth: 22, textAlign: 'center',
      opacity: count === 0 ? 0.35 : 1,
      transform: bump ? 'scale(1.18)' : 'scale(1)',
      transition: 'transform .15s ease, opacity .2s',
    }}>{count}</div>
  )
}

// ─── Tap dot (subitising style) ───────────────────────────────────────────────

function TapDot({ tapped, onClick, color }: { tapped: boolean; onClick: () => void; color: string }) {
  return (
    <div onClick={onClick} style={{
      width: 30, height: 30, borderRadius: '50%',
      background: color, boxShadow: `0 3px 8px ${color}88`,
      cursor: 'pointer',
      opacity: tapped ? 0 : 1,
      transform: tapped ? 'scale(0) rotate(15deg)' : 'scale(1)',
      transition: 'opacity .2s, transform .25s',
    }} />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
// Two phases: tap every item while the chip counts along (one-to-one
// correspondence), then — the total was never shown — name how many there were
// from 4 numerals. The choice is the cardinality probe: the count has to have
// become a quantity, not just a tapping rhythm.

function CountAndTapComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<CountAndTapMeta>) {
  const { operandA, meta } = question
  const [tapped, setTapped] = useState(new Set<number>())
  const [phase, setPhase] = useState<'tap' | 'howmany'>('tap')
  const legacyScene = pickScene(meta.sceneIndex)
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink, paper, dot, refuse } = tokens

  const done = tapped.size === operandA

  useEffect(() => { setTapped(new Set()); setPhase('tap') }, [operandA, meta])

  useEffect(() => {
    if (done && phase === 'tap') {
      const t = setTimeout(() => setPhase('howmany'), 500)
      return () => clearTimeout(t)
    }
  }, [done, phase])

  const tap = (i: number) => {
    if (done || tapped.has(i)) return
    setTapped(s => new Set([...s, i]))
  }

  const Counter = scene?.Counter

  // Themed counters (emoji tier) — one gentle fade-out per tap.
  const renderItem = (i: number) => {
    const isTapped = tapped.has(i)
    const itemStyle: React.CSSProperties = {
      cursor: 'pointer',
      opacity: isTapped ? 0 : 1,
      transform: isTapped ? 'scale(0) rotate(15deg)' : 'scale(1)',
      transition: 'opacity .2s, transform .25s',
    }
    return Counter ? (
      <div key={i} onClick={() => tap(i)} style={itemStyle}>
        <Counter size={42} />
      </div>
    ) : (
      <span key={i} onClick={() => tap(i)} style={{ fontSize: 38, display: 'inline-block', ...itemStyle }}>
        {legacyScene.e}
      </span>
    )
  }

  // Die-pattern group (dots tier) — dots sit directly on the stage.
  const renderDieSquare = (count: number, color: string, indexOffset: number, size: number) => {
    const positions = DOT_POS[count] ?? []
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        {positions.map(([x, y], k) => {
          const i = indexOffset + k
          return (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
              <TapDot tapped={tapped.has(i)} onClick={() => tap(i)} color={color} />
            </div>
          )
        })}
      </div>
    )
  }

  const row1 = Math.min(operandA, 5)
  const row2 = operandA - row1
  const right = operandA - 5

  // One stage across both phases and both tiers; inner tap groups are
  // transparent so the single stage colour shows throughout.
  const stageBody = phase === 'howmany' ? (
    // Cardinality question — items gone, chip hidden.
    <div style={{
      width: 130, height: 130, borderRadius: 16, border: `2px dashed ${ink}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka One, cursive', fontSize: 48, color: `${ink}40`,
    }}>?</div>
  ) : meta.style === 'emoji' ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: row1 }, (_, i) => renderItem(i))}
      </div>
      {row2 > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {Array.from({ length: row2 }, (_, j) => renderItem(5 + j))}
        </div>
      )}
    </div>
  ) : operandA <= 5 ? (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      {renderDieSquare(operandA, dot, 0, 130)}
    </div>
  ) : (
    // 6–10: two die-pattern groups side by side
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '4px 6px' }}>
      {renderDieSquare(5, refuse, 0, 110)}
      <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
      {renderDieSquare(right, dot, 5, 110)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{phase === 'tap' ? 'Tel maar!' : 'Hoeveel waren er?'}</ExerciseTitle>

      <ExerciseStage tokens={tokens}>
        {/* Running count chip — only while tapping; reserve height so the
            visual never shifts */}
        <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'tap' && <CounterChip count={tapped.size} ink={ink} paper={paper} />}
        </div>
        {stageBody}
      </ExerciseStage>

      {phase === 'howmany' && (
        <ChoiceButtons
          options={meta.options}
          onPick={v => onResolve(v === operandA, { givenAnswer: v, tapCount: operandA })}
          disabled={disabled}
          tokens={scene?.tokens}
        />
      )}
    </div>
  )
}

// ─── Definition ───────────────────────────────────────────────────────────────

const CountAndTap: ExerciseDefinition<CountAndTapMeta> = {
  id: 'count-and-tap',
  label: 'Tel en tik',
  supportsReveal: false,
  tiers: TIERS,
  didactics: {
    goal: 'Operationalises one-to-one correspondence AND cardinality (the telprincipes): every item gets exactly one tap, and afterwards — the total was never shown — the child names how many there were. The final choice is the cardinality probe: the count has to have become a quantity.',
    pitfalls: [
      'Cardinality gap — taps every item, watches the chip rise, but can\'t answer "hoeveel waren er?" once the items are gone.',
      'Reads the chip mid-count instead of counting along — the reconfirm then tests chip memory, not cardinality (mitigated by hiding the chip during the question).',
      'Off-by-one on the reconfirm — lost the count near the end of the tapping.',
    ],
    progression: 'Themed counters at low score (concrete, recognisable items to count) shift to die-pattern dots at higher score — the same count, but the pattern starts doing the seeing for the child. First step out of counting toward subitising.',
  },
  generateMeta(operandA, _b, score) {
    const tier = pickTier(TIERS, score)
    return {
      style: tier.id as CountAndTapMeta['style'],
      sceneIndex: Math.floor(Math.random() * 24),
      options: makeNumeralOptions(operandA, numeralRangeMax(operandA)),
      tierId: tier.id,
    }
  },
  Component: CountAndTapComponent,
}

registerExercise(CountAndTap)
