import { useState, useEffect } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { pickScene } from '../presentation/scenes'
import { NATURE_TOKENS } from '../presentation/tokens'
import { DOT_POS } from '../presentation/diePatterns'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'

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
  const { ink, paper, cream, dot, refuse } = scene?.tokens ?? NATURE_TOKENS

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

  const prompt = (
    <div style={{
      background: cream, border: `2px solid ${ink}`, borderRadius: 18,
      padding: '8px 22px 10px', boxShadow: `2px 4px 0 rgba(61,47,30,.12)`,
      fontFamily: 'Fredoka One, cursive', fontSize: 24, color: ink,
    }}>{phase === 'tap' ? 'Tel maar!' : 'Hoeveel waren er?'}</div>
  )

  // ── Cardinality question — items gone, chip hidden ────────────────────────
  if (phase === 'howmany') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
        {prompt}
        <div style={{
          width: 130, height: 130, borderRadius: 16, border: `2px dashed ${ink}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fredoka One, cursive', fontSize: 48, color: `${ink}40`,
        }}>?</div>
        <ChoiceButtons
          options={meta.options}
          onPick={v => onResolve(v === operandA, { givenAnswer: v, tapCount: operandA })}
          disabled={disabled}
          tokens={scene?.tokens}
        />
      </div>
    )
  }

  // ── Tap phase ──────────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {prompt}
      <CounterChip count={tapped.size} ink={ink} paper={paper} />
    </div>
  )

  if (meta.style === 'emoji') {
    const row1 = Math.min(operandA, 5)
    const row2 = operandA - row1
    const Counter = scene?.Counter
    const containerBg = scene?.containerBg ?? legacyScene.bg

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

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {header}
        <div style={{ background: containerBg, borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {Array.from({ length: row1 }, (_, i) => renderItem(i))}
          </div>
          {row2 > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {Array.from({ length: row2 }, (_, j) => renderItem(5 + j))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Dots style — subitising patterns ─────────────────────────────────────
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

  if (operandA <= 5) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {header}
        <div style={{ position: 'relative', width: 130, height: 130, background: paper, borderRadius: 16, border: `2px solid ${ink}` }}>
          {renderDieSquare(operandA, dot, 0, 130)}
        </div>
      </div>
    )
  }

  // 6–10: one shared box with two die-pattern groups side by side
  const right = operandA - 5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {header}
      <div style={{
        background: paper, borderRadius: 16, border: `2px solid ${ink}`,
        padding: '10px 14px',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        {renderDieSquare(5, refuse, 0, 110)}
        <div style={{ width: 2, alignSelf: 'stretch', background: ink, opacity: 0.15, borderRadius: 1 }} />
        {renderDieSquare(right, dot, 5, 110)}
      </div>
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
