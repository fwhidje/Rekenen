import { useEffect, useState } from 'react'
import { registerExercise } from './registry'
import type { ExerciseDefinition, ExerciseComponentProps, ExerciseTier } from './types'
import { pickTier } from './tiers'
import type { Problem } from '../curriculum/types'
import { NATURE_TOKENS } from '../presentation/tokens'
import { ExerciseTitle, ExerciseStage } from '../presentation/components/ExerciseFrame'
import { makeNumeralOptions } from './choiceOptions'
import { ChoiceButtons } from '../ui/components/ChoiceButtons'
import { NumPad } from '../ui/components/NumPad'
import { useClosure } from '../presentation/useClosure'
import { AnswerSlot } from '../presentation/components/AnswerSlot'
import type { ExerciseQuestion } from './types'

// ─── splits-ontbreken-rechts / -links ────────────────────────────────────────
// Missing-part statements with the total FIRST (splits notation, not the
// aanvulsom): "5 is 3 en ?" → "5 = 3 + ?" (rechts), "5 = ? + 3" (links).
// rechts starts in the symbol-free "is … en" wording and switches to the
// equation form at 55, by which time + has landed via the parallel + track.
// links is the documented harder position and is post-60 only.
// Also serves the aanvullen skills (op '-'): whole = total, part = given.

const RECHTS_TIERS: ExerciseTier[] = [
  { id: 'is-en-keuze',  minScore: 20, label: 'is … en, kiezen',   description: 'Symbol-free wording "5 is 3 en ?"; the missing part picked from four numerals.' },
  { id: 'is-en-pad',    minScore: 40, label: 'is … en, intikken', description: 'Same wording, typed answer.' },
  { id: 'vergelijking', minScore: 55, label: '5 = 3 + ?',         description: 'The equation form — total first, + sign now familiar from the + track.' },
]

const LINKS_TIERS: ExerciseTier[] = [
  { id: 'links-keuze', minScore: 60, label: '5 = ? + 3, kiezen', description: 'Missing part in FIRST position — harder, because the slot reads before the given part; choice entry.' },
  { id: 'links-pad',   minScore: 80, label: '5 = ? + 3, intikken', description: 'Same, typed answer.' },
]

interface SplitsOntbrekenMeta {
  total: number
  given: number
  missing: number
  options: number[]
  tierId: string
}

function makeMeta(tiers: ExerciseTier[]) {
  return (operandA: number, operandB: number, score: number, problem?: Problem, ctx?: { retryOf?: SplitsOntbrekenMeta }): SplitsOntbrekenMeta => {
    const tier = pickTier(tiers, score)
    let total: number, given: number
    if (problem?.op === '-') {
      // aanvullen reading: whole is the total, the part is given
      total = operandA
      given = operandB
    } else {
      total = operandA + operandB
      // retry: the same part stays given — the missing number must not change
      given = ctx?.retryOf?.given ?? (Math.random() < 0.5 ? operandA : operandB)
    }
    const missing = total - given
    return {
      total, given, missing,
      options: makeNumeralOptions(missing, total, 0),
      tierId: tier.id,
    }
  }
}

// The completed statement in the wording of the tier that was shown.
function statementText(side: 'rechts' | 'links') {
  return (q: ExerciseQuestion<SplitsOntbrekenMeta>): string => {
    const { total, given, missing, tierId } = q.meta
    if (side === 'links') return `${total} = ${missing} + ${given}`
    return tierId.startsWith('is-en') ? `${total} is ${given} en ${missing}` : `${total} = ${given} + ${missing}`
  }
}

function makeComponent(side: 'rechts' | 'links') {
  return function SplitsOntbrekenComponent({ question, onResolve, disabled, scene }: ExerciseComponentProps<SplitsOntbrekenMeta>) {
    const { meta } = question
    const tokens = scene?.tokens ?? NATURE_TOKENS
    const [input, setInput] = useState('')
    useEffect(() => { setInput('') }, [question])
    // Closure: the slot fills with the missing part and is held before the overlay.
    const { solved, answered, resolve: close } = useClosure(question, onResolve)

    const isEn = meta.tierId.startsWith('is-en')
    const typed = meta.tierId === 'is-en-pad' || meta.tierId === 'vergelijking' || meta.tierId === 'links-pad'

    const resolve = (v: number) => close(v === meta.missing, { givenAnswer: v })
    const handleKey = (key: string) => {
      if (disabled || answered) return
      if (key === '⌫') { setInput(''); return }
      if (key === '✓') { if (input) resolve(parseInt(input, 10)); return }
      if (input.length < 1) setInput(key)
    }

    const fs = 44
    const slot = (
      <AnswerSlot value={solved ? meta.missing : typed ? input : ''} solved={solved} size={54} tokens={tokens} />
    )
    const num = (v: number, color: string) => (
      <span style={{ color, fontSize: fs }}>{v}</span>
    )
    const word = (w: string) => (
      <span style={{ color: tokens.ink, opacity: isEn ? 1 : 0.55, fontSize: isEn ? 32 : 38 }}>{w}</span>
    )

    // rechts: total (is/=) given (en/+) ?    links: total = ? + given
    const statement = side === 'rechts'
      ? <>{num(meta.total, tokens.accentText)}{word(isEn ? 'is' : '=')}{num(meta.given, tokens.pop)}{word(isEn ? 'en' : '+')}{slot}</>
      : <>{num(meta.total, tokens.accentText)}{word('=')}{slot}{word('+')}{num(meta.given, tokens.pop)}</>

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
        <ExerciseTitle tokens={tokens}>Vul aan!</ExerciseTitle>
        <ExerciseStage tokens={tokens}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Fredoka One, cursive' }}>{statement}</div>
        </ExerciseStage>

        {typed
          ? <NumPad onKey={handleKey} disabled={disabled || answered} tokens={scene?.tokens} />
          : <ChoiceButtons options={meta.options} onPick={resolve} disabled={disabled || answered} tokens={scene?.tokens} />}
      </div>
    )
  }
}

const SplitsOntbrekenRechts: ExerciseDefinition<SplitsOntbrekenMeta> = {
  id: 'splits-ontbreken-rechts',
  label: 'Splitsing aanvullen',
  supportsReveal: false,
  tiers: RECHTS_TIERS,
  didactics: {
    goal: 'Complete a missing-part statement with the total first — the written form of "the whole contains this part and which other?". The bridge from huisje notation to the equation form.',
    pitfalls: [
      'Echoing the total or the given part.',
      'Adding total and part instead of finding the complement (reads the statement as a sum of the two visible numbers).',
    ],
    progression: 'is-en-keuze (20): symbol-free wording, choice. is-en-pad (40): typed. vergelijking (55): the "5 = 3 + ?" equation form, once + is familiar from the parallel + track — deliberately the SECOND equation shape the child meets (total-first), protecting the equals sign as a relation.',
  },
  retryStable: ['total', 'given', 'missing'],
  correctStatement: statementText('rechts'),
  generateMeta: makeMeta(RECHTS_TIERS),
  Component: makeComponent('rechts'),
}

const SplitsOntbrekenLinks: ExerciseDefinition<SplitsOntbrekenMeta> = {
  id: 'splits-ontbreken-links',
  label: 'Splitsing aanvullen (vooraan)',
  supportsReveal: false,
  tiers: LINKS_TIERS,
  didactics: {
    goal: 'The harder missing-part position: "5 = ? + 3". The slot reads before the given part, so the child must hold the total, skip the gap, take the given part and come back — genuine part-whole work, not left-to-right completion.',
    pitfalls: [
      'Treating it as "5 + 3" and answering 8.',
      'Echoing the given part into the slot.',
    ],
    progression: 'Post-60 only (the documented harder position is post-unlock depth): links-keuze (60) by choice, links-pad (80) typed.',
  },
  retryStable: ['total', 'given', 'missing'],
  correctStatement: statementText('links'),
  generateMeta: makeMeta(LINKS_TIERS),
  Component: makeComponent('links'),
}

registerExercise(SplitsOntbrekenRechts)
registerExercise(SplitsOntbrekenLinks)
