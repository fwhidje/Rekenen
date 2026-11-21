import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { makeNumeralOptions, numeralRangeMax } from './choiceOptions'
import { opGlyph, opColor, equationText } from './opDisplay'
import { useClosure } from '../presentation/useClosure'
import { skillRange } from '../curriculum/skills'

// ─── numberline-jump ──────────────────────────────────────────────────────────
// +1/+2 as sprongetjes: counting on (or back, for '−') made spatial. The line
// always spans the skill's full range (0–5 / 0–10) so the landing is never
// simply "the last cell". Written order: the jump starts at operandA and moves
// operandB (no start-from-larger reordering — that lives only in the fill-vis
// commutativity swap). Direction comes from question.op — the same component
// backs the numberline-jump-back id for the − skills.
//
// On the tot-10 line (the ±1 / ±2 tot 10 skills) two things differ, because the
// line is eleven cells wide and the point is no longer counting on:
//   • the jump is ONE move with one bow over it — +2 as a unit, not as two
//     separate steps (the pitfall of those skills);
//   • the landing is answered on the number strip, not by tapping a cell: the
//     cells are about 24 px on a phone, too small to tap.
// The tot-5 line is unchanged.
//
// The line always spans the SKILL's range (skillRange), not the numbers asked:
// in a tot-10 skill 3 + 1 is shown on the 0–10 line. In the ±3 / ±4 skills the
// jump is 3 or 4 (MAX_JUMP) — the same one bow, "+4 as one move"; 5 and 10
// are drawn as landmarks there and stay labelled on the sparse line.

const TIERS: ExerciseTier[] = [
  { id: 'sprong-zien', minScore: 0,  label: 'sprong zien', description: 'Staged reveal, each number with its picture: the line with the start cell lit and the first number, then "+ b" with the jump chip, then the jump (cell by cell; on the tot-10 line in one move, under one bow) and "= ?" as it lands; the child picks the landing from four numerals.' },
  { id: 'sprong-zelf', minScore: 40, label: 'zelf springen', description: 'No animation: the start and the jump chip are given, the child taps the landing cell on the line — doing the jump instead of watching it. On the tot-10 line the landing is given on the number strip (the cells are too small to tap).' },
  { id: 'kale-sprong', minScore: 70, label: 'kale sprong',  description: 'Sparse line: only 0, 5 and 10 are labelled. The child places the landing from the structure of the line, not by reading labels.' },
]

interface NumberLineMeta {
  options: number[]
  tierId: string
}

// sprong-zien, number and picture together (the fill-vis rule):
//   step 1  the line, the start cell lit, the first number
//   step 2  "+ b" / "− b" with the jump chip
//   then    the jump (after HOP_START_DELAY; tot 5 hop by hop, tot 10 one move)
//   landed  "= ?" — input unlocks
const REVEAL_DELAYS = [350, 750]
const HOP_START_DELAY = 650
const HOP_STEP_MS = 480

// The longest jump served per skill; every other skill: 2. A turned-around
// sum (1 + 4) would otherwise be a jump of four in a ±1 / ±2 skill.
const MAX_JUMP: Record<string, number> = { '+3-4-tot-10': 4, '-3-4-tot-10': 4 }
const maxJump = (skillId?: string) => (skillId ? MAX_JUMP[skillId] ?? 2 : 2)
// The line fills the stage: cells grow to MAX_CELL (a comfortable tap target
// on the tot-5 line) and shrink evenly on the tot-10 line or a narrow screen.
const MAX_CELL = 50
const CELL_GAP = 4

function NumberLineComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<NumberLineMeta>) {
  const { operandA, operandB, answer, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const dir = op === '-' ? -1 : 1
  const start = operandA   // written order: jump departs from the first operand
  const jumpN = operandB   // …and moves the second
  const range = skillRange(question.skillId, Math.max(start, answer))
  const tier = meta.tierId
  const isZien = tier === 'sprong-zien'
  const wide = range > 5   // the tot-10 line: one bow, answer on the strip
  const [picked, setPicked] = useState<number | null>(null)

  // Staged opening reveal for sprong-zien only; other tiers show instantly.
  const { step, complete: revealDone } = useReveal(isZien ? REVEAL_DELAYS : [], question)
  const showA = !isZien || step >= 1
  const showLine = showA
  const showOpB = !isZien || step >= 2

  // sprong-zien: hop = jumps taken so far (0..jumpN), starting after the reveal.
  const [hop, setHop] = useState(0)
  // Closure: on a correct answer the equation fills in and the landing cell is
  // marked, held before the overlay; on wrong it resolves at once.
  const { solved, answered: resolved, resolve: close } = useClosure(question, onResolve)
  const animDone = !isZien || hop >= jumpN
  // "= ?" comes when the jump has landed
  const showTail = !isZien || (revealDone && animDone)

  useEffect(() => { setHop(0); setPicked(null); setTapped(false) }, [question])
  useEffect(() => {
    if (!isZien || !revealDone || hop >= jumpN) return
    // tot 10: the whole jump in one move; tot 5: hop by hop
    const t = setTimeout(() => setHop(h => (wide ? jumpN : h + 1)), hop === 0 ? HOP_START_DELAY : HOP_STEP_MS)
    return () => clearTimeout(t)
  }, [isZien, revealDone, hop, jumpN, question, wide])

  const tappable = !isZien && !wide
  const [tapped, setTapped] = useState(false)   // the "tap me" pulse stops after the first tap
  const useStrip = !isZien && wide
  const sparse = tier === 'kale-sprong'

  const resolve = (v: number) => close(v === answer, { givenAnswer: v })

  const tapCell = (i: number) => {
    if (!tappable || disabled || resolved) return
    setTapped(true)
    resolve(i)
  }

  const cells = range + 1
  const big = range <= 5               // tot-5 line: large cells and labels
  const startCentre = `${((start + 0.5) / cells) * 100}%`

  const glyphColor = opColor(op, tokens)
  // the tap tiers show the completed jump once solved (trail + landing)
  const current = solved ? answer : start + dir * hop
  const tail = solved ? answer : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>

      <ExerciseTitle tokens={tokens}>{op === '-' ? 'Spring terug' : 'Spring naar het antwoord'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
        {/* Equation — built by the reveal, then always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Fredoka One, cursive', fontSize: 38, minHeight: 46 }}>
          <span style={{ color: tokens.accentText, opacity: showA ? 1 : 0, transition: 'opacity .3s' }}>{operandA}</span>
          <span style={{ color: glyphColor, opacity: showOpB ? 1 : 0, transition: 'opacity .3s' }}>{opGlyph(op)}</span>
          <span style={{ color: tokens.pop, opacity: showOpB ? 1 : 0, transition: 'opacity .3s' }}>{operandB}</span>
          <span style={{ color: tokens.ink, opacity: showTail ? 0.4 : 0, fontSize: 32, transition: 'opacity .3s' }}>=</span>
          <span style={{ color: tokens.accentText, opacity: showTail ? 1 : 0, transition: 'opacity .3s' }}>{tail}</span>
        </div>

        <div style={{ width: '100%', maxWidth: cells * MAX_CELL + (cells - 1) * CELL_GAP, opacity: showLine ? 1 : 0, transition: 'opacity .4s' }}>
          {/* Jump chip above the start cell, pointing the direction */}
          <div style={{ height: 34, position: 'relative', marginBottom: 6 }}>
            {/* tot 10: one bow from the start to the landing — the jump as a unit */}
            {wide && jumpN > 0 && (
              <svg viewBox={`0 0 ${cells} 34`} preserveAspectRatio="none" width="100%" height={34}
                style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: (isZien ? hop > 0 : solved) ? 1 : 0, transition: 'opacity .35s' }}>
                <path d={`M ${start + 0.5} 34 Q ${start + 0.5 + (dir * jumpN) / 2} 4 ${answer + 0.5} 34`}
                  fill="none" stroke={solved ? tokens.confirm : glyphColor} strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            <div style={{
              position: 'absolute',
              left: dir === 1 ? startCentre : undefined,
              right: dir === -1 ? `calc(100% - ${startCentre})` : undefined,
              background: tokens.cream, color: glyphColor, border: `2px solid ${glyphColor}`,
              // tot 10: the chip announces the jump and makes way for the bow
              opacity: !showOpB ? 0 : wide && (isZien ? hop > 0 : solved) ? 0 : 1, transition: 'opacity .3s',
              borderRadius: 10, padding: '3px 10px',
              fontFamily: 'Fredoka One, cursive', fontSize: 16, whiteSpace: 'nowrap',
            }}>
              {dir === 1 ? `${opGlyph(op)} ${jumpN} →` : `← ${opGlyph(op)} ${jumpN}`}
            </div>
          </div>

          <style>{`@keyframes nl-tapme { 0%, 100% { box-shadow: 0 0 0 0 ${tokens.accent}00 } 50% { box-shadow: 0 0 0 4px ${tokens.accent}66 } }`}</style>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells}, 1fr)`, gap: CELL_GAP }}>
            {Array.from({ length: cells }, (_, i) => {
              const isStart = i === start
              const moved = isZien ? hop > 0 : solved
              const isLanding = (isZien ? animDone : solved) && i === answer && !isStart
              const isTrail = moved &&
                (dir === 1 ? i > start && i <= current : i < start && i >= current)
              const isCurrent = isZien && hop > 0 && i === current && !animDone
              // 0, 5 and 10 are the landmarks: always labelled, drawn stronger on the long line
              const landmark = i % 5 === 0 || i === range
              const showLabel = !sparse || landmark
              // tappable cells look tappable: an accent frame and a soft pulse until the first tap
              const tapMe = tappable && !isStart && !isLanding && !solved
              const bg = isStart ? tokens.dot
                       : isLanding ? tokens.pop
                       : isTrail ? `${tokens.accent}55`
                       : tokens.paper
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    onClick={() => tapCell(i)}
                    style={{
                      width: '100%', aspectRatio: '1', boxSizing: 'border-box', borderRadius: big ? 10 : 7, background: bg,
                      border: isStart ? `2.5px solid ${tokens.ink}` : isLanding ? `2.5px solid ${tokens.pop}`
                        : tapMe ? `2.5px solid ${tokens.accent}`
                        : wide && landmark ? `2px solid ${tokens.ink}88` : `2px solid ${tokens.paperMid}`,
                      animation: tapMe && !tapped && !disabled ? 'nl-tapme 1.6s ease-in-out infinite' : undefined,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Fredoka One, cursive', fontSize: big ? 22 : 13,
                      color: isStart ? tokens.ink : isLanding ? 'white' : `${tokens.ink}88`,
                      cursor: tappable && !disabled ? 'pointer' : 'default',
                      transform: isCurrent || isTrail && i === current ? 'scale(1.12)' : 'scale(1)',
                      transition: 'transform .2s ease, background .25s',
                    }}>
                    {isStart ? start : isLanding ? (solved ? answer : '?') : ''}
                  </div>
                  <span style={{ fontSize: big ? 15 : 11, color: wide && landmark ? tokens.ink : `${tokens.ink}99`, fontFamily: 'Fredoka One, cursive', minHeight: big ? 18 : 13, lineHeight: 1.1 }}>
                    {showLabel ? i : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </ExerciseStage>

      {useStrip && (
        <NumberStrip max={10} onPick={v => { if (!disabled && !resolved) { setPicked(v); resolve(v) } }}
          picked={picked} solved={solved} disabled={disabled || resolved} tokens={scene?.tokens} />
      )}
      {isZien && (
        <ChoiceButtons
          options={meta.options}
          onPick={resolve}
          disabled={disabled || !animDone || resolved}
          tokens={scene?.tokens}
        />
      )}
    </div>
  )
}

function makeMeta(operandA: number, operandB: number, score: number, op: string): NumberLineMeta {
  const tier = pickTier(TIERS, score)
  const answer = op === '-' ? operandA - operandB : operandA + operandB
  return {
    // option sets near the answer; never beyond what the line shows
    options: makeNumeralOptions(answer, numeralRangeMax(Math.max(operandA, answer)), 0),
    tierId: tier.id,
  }
}

const NumberLine: ExerciseDefinition<NumberLineMeta> = {
  id: 'numberline-jump',
  label: 'Spring op de getallenlijn',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Model +1/+2 as forward jumps on the number line — counting on given spatial structure; the buurgetal relation made visible. In +3-4-tot-10: +3 / +4 as ONE jump under one bow, placed against the landmarks 5 and 10 — a picture of the sum, not a count of cells.',
    pitfalls: ['Off-by-one from counting the start cell as the first jump', 'Tapping the start instead of the landing', 'Reading cell labels instead of using the structure (probed by the sparse tier)'],
    progression: 'sprong-zien: the sum builds, the line appears, and the jump animates from the first operand to the landing the child reads. sprong-zelf: the child makes the jump by tapping the landing. kale-sprong: same, on a line with only the ends labelled — the structure has to carry it. Watching → doing → doing without labels.',
  },
  retryStable: [],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  // A jump of 1 or 2 — 3 or 4 in the ±3 / ±4 skills (MAX_JUMP): a turned-around
  // sum (1 + 4, 1 + 9) would be a jump the line is not for.
  isCompatible: (_a, b, _p, skillId) => b >= 1 && b <= maxJump(skillId),
  generateMeta(operandA, operandB, score, problem) {
    return makeMeta(operandA, operandB, score, problem?.op ?? '+')
  },
  Component: NumberLineComponent,
}

registerExercise(NumberLine)

// The backward twin — same component, direction follows question.op. A
// separate id so the − skills weight it independently and the answer stream
// distinguishes forward from backward jumping (backward counting is the
// documented weak spot).
const NumberLineBack: ExerciseDefinition<NumberLineMeta> = {
  id: 'numberline-jump-back',
  label: 'Spring terug op de getallenlijn',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Model −1/−2 as backward jumps on the number line — counting back given spatial structure. Doubles as backward-counting practice, which is genuinely weaker than forward and needs its own airtime.',
    pitfalls: ['Off-by-one from counting the start cell as the first backward step', 'Jumping forward out of habit', 'Tapping the start instead of the landing'],
    progression: 'Same ladder as the forward twin: watch the backward jump → tap the landing yourself → sparse labels.',
  },
  retryStable: [],
  correctStatement: q => equationText(q.op, q.operandA, q.operandB),
  // A − problem has no turned-around form, so no general limit; the ±3 / ±4
  // skill takes its jumps of 3 and 4 like the forward line.
  isCompatible: (_a, b, _p, skillId) => !(skillId && skillId in MAX_JUMP) || (b >= 1 && b <= MAX_JUMP[skillId]),
  generateMeta(operandA, operandB, score, problem) {
    return makeMeta(operandA, operandB, score, problem?.op ?? '-')
  },
  Component: NumberLineComponent,
}

registerExercise(NumberLineBack)
