import { useEffect, useRef, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier, ExerciseQuestion } from './types'
import { pickTier } from './tiers'
import { NATURE_TOKENS } from '../presentation/tokens'
import { makeSumOptions, numeralRangeMax } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumberStrip } from '../ui/components/NumberStrip'
import { Huisje } from '../presentation/components/Huisje'
import type { HuisjeCell } from '../presentation/components/Huisje'
import { ExerciseTitle, ExerciseStage, Reserve } from '../presentation/components/ExerciseFrame'
import { useReveal } from '../presentation/useReveal'
import { useFlash } from '../presentation/useFlash'
import { useClosure } from '../presentation/useClosure'
import { opGlyph, opColor, equationText, splitText } from './opDisplay'

// ─── huisje-som ───────────────────────────────────────────────────────────────
// A filled splitshuisje next to a sum of the same family: "5 is 2 en 3, dus
// 2 + 3 = 5" — and "dus 5 − 2 = 3". The aid is a FACT the child already knows,
// not a picture: nothing on screen can be counted. This is the exercise that
// installs the method the tot-5 skills after +1/+2 exist for — the sum read
// from the split (the getalfamilie) instead of counted on or back.
//
// As the sum forms, each of its numbers lights up in the house; the number
// that does not light up is the answer. Then the house fades: flashed, then
// only shown as confirmation.
//
// Op-generic: for + the answer is the roof, for − it is the other room.

const HOUSE_FLASH_MS = 1800
const BETWEEN_SUMS_MS = 750

const TIERS: ExerciseTier[] = [
  { id: 'huisje-open',  minScore: 0,  label: 'huisje open',   description: 'The house stays on screen, complete. The sum\'s numbers light up in it; the one that stays dark is the answer. Choice.' },
  { id: 'huisje-flits', minScore: 30, label: 'huisje flitst', description: 'The house is shown, then its numbers are covered: the family has to be held in mind. Number strip.' },
  { id: 'twee-sommen',  minScore: 50, label: 'twee sommen',   description: 'House open again, but two sums of the family in a row — 2 + 3 then 3 + 2; 5 − 2 then 5 − 3. One house answers both: van plaats wisselen for +, the two differences for −.' },
  { id: 'huisje-erna',  minScore: 70, label: 'huisje erna',   description: 'The bare sum next to an empty house; the house fills in only when the answer is in — as confirmation, no longer as aid.' },
]

interface HuisjeSomMeta {
  options: number[]
  stripMax: 5 | 10
  two: boolean       // the family has a second, different sum to ask
  tierId: string
}

// One sum of the family and where its three numbers sit in the house.
interface FamilySum { x: number; y: number; ans: number; ansCell: HuisjeCell; cells: [HuisjeCell, HuisjeCell] }

// The house (roof; left, right) and the family's two sums for this operation.
function family(op: string, a: number, b: number): { total: number; left: number; right: number; sums: [FamilySum, FamilySum] } {
  if (op === '-') {
    const rest = a - b
    return {
      total: a, left: b, right: rest,
      sums: [
        { x: a, y: b,    ans: rest, ansCell: 'right', cells: ['roof', 'left'] },
        { x: a, y: rest, ans: b,    ansCell: 'left',  cells: ['roof', 'right'] },
      ],
    }
  }
  return {
    total: a + b, left: a, right: b,
    sums: [
      { x: a, y: b, ans: a + b, ansCell: 'roof', cells: ['left', 'right'] },
      { x: b, y: a, ans: a + b, ansCell: 'roof', cells: ['right', 'left'] },
    ],
  }
}

function HuisjeSomComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<HuisjeSomMeta>) {
  const { operandA, operandB, op, meta } = question
  const tokens = scene?.tokens ?? NATURE_TOKENS
  const { ink } = tokens
  const glyph = opGlyph(op)
  const glyphColor = opColor(op, tokens)
  const fam = family(op, operandA, operandB)

  // A retry is the same sum with more help: the house is open and stays, and
  // there is one sum to answer.
  const retry = !!question.isRetry
  const flits = meta.tierId === 'huisje-flits' && !retry
  const erna = meta.tierId === 'huisje-erna' && !retry
  const two = meta.tierId === 'twee-sommen' && meta.two && !retry
  const useChoice = retry || meta.tierId === 'huisje-open'

  const [phase, setPhase] = useState<0 | 1>(0)       // which of the two sums is asked
  const [firstDone, setFirstDone] = useState(false)  // twee-sommen: the first sum is answered
  const [picked, setPicked] = useState<number | null>(null)
  const between = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setPhase(0); setFirstDone(false); setPicked(null)
    return () => { if (between.current) clearTimeout(between.current) }
  }, [question])

  const { solved, answered, resolve } = useClosure(question, onResolve)

  // [house] → [first number] → [sign + second number] → ["= ?"]
  const { step, complete } = useReveal([300, 450, 450, 350], question)
  const flash = useFlash(HOUSE_FLASH_MS, question, { start: flits && complete })

  const numbersShown = solved || (!erna && !flits) || (flits && (!complete || flash.showing))
  const canAnswer = complete && (!flits || (flash.seen && !flash.showing))

  const current = fam.sums[phase]
  // The sum's numbers light up in the house as they are written.
  const lit: Partial<Record<HuisjeCell, boolean>> = numbersShown && !solved
    ? { [current.cells[0]]: phase === 1 || step >= 2, [current.cells[1]]: phase === 1 || step >= 3 }
    : {}
  const show = (n: number) => (numbersShown ? String(n) : '')

  const pick = (v: number) => {
    if (disabled || answered || !canAnswer || (two && firstDone && phase === 0)) return
    setPicked(v)
    if (!two) { resolve(v === current.ans, { givenAnswer: v, replayCount: flash.replays }); return }
    if (phase === 0) {
      if (v !== current.ans) { resolve(false, { givenAnswer: v, tapCount: 1 }); return }
      // first sum right: show it, then the second sum of the same house
      setFirstDone(true)
      between.current = setTimeout(() => { setPhase(1); setPicked(null) }, BETWEEN_SUMS_MS)
      return
    }
    resolve(v === current.ans, { givenAnswer: v, tapCount: 2 })
  }

  const sumRow = (s: FamilySum, idx: 0 | 1) => {
    const isCurrent = idx === phase
    // row 0 builds up on the reveal; row 1 appears whole when its turn comes
    const vis = (need: number) => (idx === 0 ? step >= need : phase === 1)
    const done = idx === 0 ? (two ? firstDone || solved : solved) : solved
    const fade = (on: boolean) => ({ opacity: on ? 1 : 0, transition: 'opacity .3s' })
    return (
      <div key={idx} style={{
        display: 'flex', alignItems: 'center', gap: 9, height: 44,
        fontFamily: 'Fredoka One, cursive', fontSize: 34,
        opacity: two && !isCurrent && idx === 0 ? 0.55 : 1, transition: 'opacity .3s',
      }}>
        <span style={{ ...fade(vis(2)), color: tokens.accentText }}>{s.x}</span>
        <span style={{ ...fade(vis(3)), color: glyphColor }}>{glyph}</span>
        <span style={{ ...fade(vis(3)), color: tokens.pop }}>{s.y}</span>
        <span style={{ ...fade(vis(4)), color: ink, fontSize: 29, opacity: vis(4) ? 0.4 : 0 }}>=</span>
        <span style={{ ...fade(vis(4)), color: done ? tokens.confirm : tokens.accentText, minWidth: 22, textAlign: 'center' }}>{done ? s.ans : '?'}</span>
      </div>
    )
  }

  // twee-sommen: after the first sum its answer place is marked until the
  // second sum takes over; solved: the answer place of the last sum.
  const good: HuisjeCell | null = solved ? current.ansCell : (two && firstDone && phase === 0 ? current.ansCell : null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <ExerciseTitle tokens={tokens}>{erna ? 'Hoeveel is het?' : 'Kijk naar het huisje!'}</ExerciseTitle>

      <ExerciseStage tokens={tokens} style={{ minWidth: 300, boxSizing: 'border-box', padding: '12px 20px', gap: 8 }}>
        <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity .3s' }}>
          <Huisje room={62} total={fam.total}
            roof={show(fam.total)} left={show(fam.left)} right={show(fam.right)}
            lit={lit} good={good} tokens={tokens} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {sumRow(fam.sums[0], 0)}
          {two && sumRow(fam.sums[1], 1)}
        </div>

        {/* huisje-flits: look again — space reserved from the start */}
        {flits && (
          <Reserve show={flash.seen && !flash.showing && !answered}>
            <button onClick={() => { if (!disabled && !answered) flash.replay() }}
              style={{
                padding: '6px 18px', fontFamily: 'Patrick Hand, cursive', fontSize: 17,
                background: tokens.paper, color: ink, border: `2px solid ${ink}`, borderRadius: 14,
                cursor: 'pointer', userSelect: 'none',
              }}>↻ Nog eens kijken</button>
          </Reserve>
        )}
      </ExerciseStage>

      {useChoice
        ? <ChoiceButtons options={meta.options} onPick={pick} disabled={disabled || answered || !canAnswer} tokens={scene?.tokens} />
        : <NumberStrip max={meta.stripMax} onPick={pick} picked={picked} solved={solved || (two && firstDone && phase === 0)}
            disabled={disabled || answered || !canAnswer || (two && firstDone && phase === 0)} tokens={scene?.tokens} />}
    </div>
  )
}

const statement = (q: ExerciseQuestion<HuisjeSomMeta>) => {
  // twee-sommen asks two sums of one house — the house is the fact to show.
  if (q.meta.tierId === 'twee-sommen' && q.meta.two && !q.isRetry) {
    const f = family(q.op, q.operandA, q.operandB)
    return splitText(f.total, f.left, f.right)
  }
  return equationText(q.op, q.operandA, q.operandB)
}

const HuisjeSom: ExerciseDefinition<HuisjeSomMeta> = {
  id: 'huisje-som',
  label: 'De som in het huisje',
  supportsReveal: true,
  tiers: TIERS,
  didactics: {
    goal: 'Use the split as the tool: a sum or a difference is read from the splitshuisje of its family ("5 is 2 en 3, dus 2 + 3 = 5 en 5 − 2 = 3"). Nothing on screen can be counted — the answer is a known fact, found by seeing which member of the family the sum does not name.',
    pitfalls: [
      'Echo: picks a number that is already in the sum (a lit room) instead of the third member of the family.',
      'At huisje-open "take the number that is not lit" works without thinking. It is the rule being taught, but it is why the tier is short and the house is covered from 30.',
      'For −: takes the roof (the whole) as the answer, as it is for +.',
    ],
    progression: 'huisje-open: the complete house stays; choice. huisje-flits (30): the house is shown, then covered — the family is held in mind; number strip. twee-sommen (50): house open, two sums of one family in a row — one house answers 2 + 3 and 3 + 2 (van plaats wisselen), 5 − 2 and 5 − 3. huisje-erna (70): the bare sum; the house fills in only as confirmation. A retry always has the house open and one sum.',
  },
  // Nothing random defines the question: the house and the sum follow from the problem.
  retryStable: [],
  correctStatement: statement,
  generateMeta(operandA, operandB, score, problem) {
    const tier = pickTier(TIERS, score)
    const op = problem?.op === '-' ? '-' : '+'
    const fam = family(op, operandA, operandB)
    const first = fam.sums[0]
    const second = fam.sums[1]
    return {
      // the other two members of the family are the natural wrong answers
      options: makeSumOptions(first.ans, [first.x, first.y], numeralRangeMax(fam.total), 0),
      stripMax: numeralRangeMax(fam.total) as 5 | 10,
      two: second.x !== first.x || second.y !== first.y,
      tierId: tier.id,
    }
  },
  Component: HuisjeSomComponent,
}

registerExercise(HuisjeSom)
