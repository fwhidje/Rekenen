import type { SkillDefinition } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo
const pickFrom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ─── Exercise type ids ────────────────────────────────────────────────────────
// Centralised so a typo in `applicableExercises` is a compile error, not a
// silent runtime "no exercises available". Includes types stubbed in round 2.

const EX = {
  // Generic arithmetic presentations
  fillVis:        'fill-vis',
  fillPlain:      'fill-plain',
  choice:         'choice',
  tf:             'tf',
  collectTap:     'collect-tap',
  collectCounter: 'collect-counter',
  numberlineJump: 'numberline-jump',

  // Number sense / pre-arithmetic
  countAndTap:           'count-and-tap',
  dotPatternRecognise:   'dot-pattern-recognise',
  fingerPatternRecognise:'finger-pattern-recognise',
  numberlinePlace:       'numberline-place',
  compareMoreLess:       'compare-more-less',
  rekenrekShow:          'rekenrek-show',
  tenFrameShow:          'ten-frame-show',

  // Splitsen-specific
  splitsVrij:             'splits-vrij',
  splitsOntbrekenRechts:  'splits-ontbreken-rechts',
  splitsOntbrekenLinks:   'splits-ontbreken-links',
  splitsAlle:             'splits-alle',
  splitshuisje:           'splitshuisje',
  splitsbenen:            'splitsbenen',
  splitsHelft:            'splits-helft',
  dotPatternDecompose:    'dot-pattern-decompose',
  splitsFrame:            'splits-frame',
  splitsHerkenHuisje:     'splits-herken-huisje',
  rekenrekDecompose:      'rekenrek-decompose',

  // Tienvrienden-specific
  tienveldFill:    'tienveld-fill',
  rekenrekMakeTen: 'rekenrek-make-ten',

  // Optellen extras
  rekenrekAdd:      'rekenrek-add',
  dubbelRecognise:  'dubbel-recognise',

  // Aftrekken-specific presentations
  wegnemenCrossedOut:    'wegnemen-crossed-out',
  verschilTwoGroups:     'verschil-two-groups',
  verschilRekenrek:      'verschil-rekenrek',
  aanvullenTarget:       'aanvullen-target',
  numberlineJumpBack:    'numberline-jump-back',
  numberlineJumpUpFromB: 'numberline-jump-up-from-b',
  collectCounterDown:    'collect-counter-down',
} as const

// ─── Skills ───────────────────────────────────────────────────────────────────

export const SKILLS: SkillDefinition[] = [

  // ── Pre-arithmetic ──────────────────────────────────────────────────────────

  {
    id: 'getalbegrip-5',
    name: 'Getalbegrip tot 5',
    intent: 'Builds the bidirectional links between quantity, cijfersymbool, structured visual (dot / finger / ten-frame), and number-line position for 1–5 — the foundation everything else in the curriculum hangs off.',
    didactics: {
      startingPoint: 'Recites the number sequence to at least 5 and points to items while counting, but cardinality — the awareness that the last word spoken is the count — may not be stable, and the written numerals 1–5 are not yet secure.',
      goal: 'Given any of {structured pattern, numeral, position on the number line, spoken word} for a quantity 1–5, produces the other three at a glance — no counting from 1. Given two quantities 1–5, says which is meer, minder, or evenveel.',
      pitfalls: [
        'Cardinality gap — counts the items correctly but cannot answer "hoeveel?" without recounting; the count hasn\'t become a quantity.',
        'One-to-one correspondence breaks — words and items go out of sync (skips, double-counts, recites past the last item).',
        'Compares by length, not count — picks the longer row or bigger-looking pattern instead of subitising both groups. Often doesn\'t yet have evenveel as a stable third answer.',
      ],
    },
    op: 'count',
    unlockedBy: [],
    unlocks: ['splitsen-herken-5', 'getalbegrip-10'],
    subsumedBy: 'getalbegrip-10',
    applicableExercises: [
      EX.countAndTap, EX.dotPatternRecognise, EX.fingerPatternRecognise,
      EX.numberlinePlace, EX.compareMoreLess, EX.tenFrameShow, EX.rekenrekShow,
    ],
    generate: () => ({ a: rnd(1, 5), b: 0, op: 'count' }),
  },

  {
    id: 'getalbegrip-10',
    name: 'Getalbegrip tot 10',
    intent: 'Extends number sense to 1–10 with the 5-structure made explicit (6 = 5 + 1, 7 = 5 + 2, …) — so 6–10 are seen through the 5-anchor, never counted from 1. Sets up the rekenrek and ten-frame as natural representations.',
    didactics: {
      startingPoint: 'Secure with getalbegrip tot 5 — subitises 1–5 from structured patterns, reads the written numerals 1–5, and can compare and place them on the number line.',
      goal: 'Given any of {5-anchored structured pattern, numeral, number-line position, spoken word} for a quantity 1–10, produces the other three at a glance — 6–10 read directly as 5 + n, not counted up from 1. Given two quantities 1–10, says which is meer, minder, or evenveel.',
      pitfalls: [
        'Losing the 5-anchor — counts 6–10 by ones from 1 instead of reading them as 5 + n.',
        'Half-anchoring — uses 5 for the first hand or die-group but resets to 1 for the second instead of continuing 6, 7, 8 …',
        'Written-but-not-known — recognises the cijfer 6–10 but the quantity behind it isn\'t internalised.',
      ],
    },
    op: 'count',
    unlockedBy: ['getalbegrip-5'],
    unlocks: ['splitsen-tot-10', '+1-2-tot-10', '-1-2-tot-10'],
    subsumedBy: null,
    applicableExercises: [
      EX.countAndTap, EX.dotPatternRecognise, EX.fingerPatternRecognise,
      EX.numberlinePlace, EX.compareMoreLess, EX.rekenrekShow, EX.tenFrameShow,
    ],
    generate: () => ({ a: rnd(1, 10), b: 0, op: 'count' }),
  },

  // ── Splitsen ────────────────────────────────────────────────────────────────

  {
    id: 'splitsen-herken-5',
    name: 'Splitsen herkennen tot 5',
    intent: 'Recognises a split visually — given a structured representation of a total, names the two parts. Perceptual, not yet about producing the notation.',
    didactics: {
      startingPoint: 'Secure getalbegrip tot 5; can subitise small structured quantities.',
      goal: 'Given a structured total ≤ 5, instantly names the two parts — perceptual recognition, no written notation yet.',
      pitfalls: [
        'Counting all the dots instead of seeing the two parts',
        'Naming only one of the two parts',
        'Treating a+b and b+a as different splits',
      ],
    },
    op: 'split',
    unlockedBy: ['getalbegrip-5'],
    unlocks: ['splitsen-noteren-5', '+1-2-tot-5', '-1-2-tot-5', 'splitsen-tot-10'],
    subsumedBy: 'splitsen-tot-10',
    applicableExercises: [
      EX.dotPatternDecompose, EX.splitsFrame, EX.splitsHerkenHuisje, EX.rekenrekDecompose,
    ],
    generate: () => {
      const total = rnd(2, 5)
      const a = rnd(1, total - 1)
      return { a, b: total - a, op: 'split' }
    },
  },

  {
    id: 'splitsen-noteren-5',
    disabled: true,  // WIP gate — notation exercises not yet built
    name: 'Splitsen noteren tot 5',
    intent: 'Produces a split in standard Flemish primary-school notation (splitshuisje / splitsbenen), enumerates splits, fills missing addends. Builds on recognition; expresses the same understanding in writing.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: 'split',
    unlockedBy: ['splitsen-herken-5'],
    unlocks: [],
    subsumedBy: 'splitsen-tot-10',
    applicableExercises: [
      EX.splitsVrij, EX.splitsOntbrekenRechts, EX.splitsOntbrekenLinks,
      EX.splitsAlle, EX.splitshuisje, EX.splitsbenen,
    ],
    generate: () => {
      const total = rnd(2, 5)
      const a = rnd(1, total - 1)
      return { a, b: total - a, op: 'split' }
    },
  },

  {
    id: 'splitsen-tot-10',
    disabled: true,  // WIP gate — exercises not yet built
    name: 'Splitsen tot 10',
    intent: 'Same as splitsen-herken-5 / splitsen-noteren-5 for 6, 7, 8, 9, 10. The "boss splitgetal" is 10 — its 11 splits get drilled to recall.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: 'split',
    unlockedBy: ['splitsen-herken-5', 'getalbegrip-10'],
    unlocks: ['tienvrienden', 'optellen-tot-10', 'aftrekken-wegnemen-10'],
    subsumedBy: null,
    applicableExercises: [
      EX.splitsVrij, EX.splitsOntbrekenRechts, EX.splitsOntbrekenLinks,
      EX.splitsAlle, EX.splitshuisje, EX.splitsbenen,
      EX.dotPatternDecompose, EX.rekenrekDecompose,
    ],
    generate: () => {
      const total = rnd(6, 10)
      const a = rnd(1, total - 1)
      return { a, b: total - a, op: 'split' }
    },
  },

  {
    id: 'tienvrienden',
    name: 'Tienvrienden',
    intent: 'Instant recall of the 5 pairs that make 10 (1+9, 2+8, 3+7, 4+6, 5+5) in both orders. Fact-recall drill, never archived.',
    didactics: {
      startingPoint: 'Knows the splits of 10 with support and can recognise them visually.',
      goal: 'Instant recall of all five tienvrienden pairs in both orders, with no counting.',
      pitfalls: [
        'Counting up to find the partner instead of recalling it',
        'Off-by-one on the partner',
        'Confusing near-pairs (3+7 vs 3+8)',
      ],
    },
    op: 'split',
    unlockedBy: ['splitsen-tot-10'],
    unlocks: [],
    subsumedBy: null,
    applicableExercises: [
      EX.splitsOntbrekenRechts, EX.splitsOntbrekenLinks,
      EX.tienveldFill, EX.rekenrekMakeTen,
    ],
    generate: () => {
      const a = rnd(1, 9)
      return { a, b: 10 - a, op: 'split' }
    },
    disabled: true,  // WIP gate
  },

  // ── Optellen ────────────────────────────────────────────────────────────────

  {
    id: '+1-2-tot-5',
    name: '+1 / +2 tot 5',
    intent: 'Add 1 or add 2 within 5 — counting on, no structural reasoning required.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: '+',
    unlockedBy: ['splitsen-herken-5'],
    unlocks: ['optellen-tot-5'],
    subsumedBy: 'optellen-tot-5',
    applicableExercises: [
      EX.fillVis, EX.fillPlain, EX.choice, EX.tf,
      EX.collectTap, EX.collectCounter, EX.numberlineJump,
    ],
    generate: () => {
      const b = pickFrom([1, 2])
      const a = rnd(1, 5 - b)
      return { a, b, op: '+' }
    },
    disabled: true,  // WIP gate
  },

  {
    id: 'optellen-tot-5',
    name: 'Optellen tot 5',
    intent: 'Any optelling within 5 (a + b ≤ 5).',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: '+',
    unlockedBy: ['+1-2-tot-5'],
    unlocks: ['+1-2-tot-10'],
    subsumedBy: 'optellen-tot-10',
    applicableExercises: [
      EX.fillVis, EX.fillPlain, EX.choice, EX.tf,
      EX.collectTap, EX.collectCounter, EX.numberlineJump,
    ],
    generate: () => {
      const a = rnd(1, 4)
      const b = rnd(1, 5 - a)
      return { a, b, op: '+' }
    },
  },

  {
    id: '+1-2-tot-10',
    name: '+1 / +2 tot 10',
    intent: 'Add 1 or 2 within 10 — still counting on, but a wider range.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: '+',
    unlockedBy: ['optellen-tot-5', 'getalbegrip-10'],
    unlocks: ['+3-4-tot-10'],
    subsumedBy: 'optellen-tot-10',
    applicableExercises: [
      EX.fillVis, EX.fillPlain, EX.choice, EX.tf,
      EX.collectTap, EX.collectCounter, EX.numberlineJump,
    ],
    generate: () => {
      const b = pickFrom([1, 2])
      const a = rnd(1, 10 - b)
      return { a, b, op: '+' }
    },
  },

  {
    id: '+3-4-tot-10',
    name: '+3 / +4 tot 10',
    intent: 'Add 3 or 4 within 10 — derived-fact reasoning (dubbels, near-dubbels) starts mattering.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: '+',
    unlockedBy: ['+1-2-tot-10'],
    unlocks: ['optellen-tot-10'],
    subsumedBy: 'optellen-tot-10',
    applicableExercises: [
      EX.fillVis, EX.fillPlain, EX.choice, EX.tf,
      EX.collectCounter, EX.numberlineJump, EX.rekenrekAdd,
    ],
    generate: () => {
      const b = pickFrom([3, 4])
      const a = rnd(1, 10 - b)
      return { a, b, op: '+' }
    },
  },

  {
    id: 'optellen-tot-10',
    name: 'Optellen tot 10',
    intent: 'Any optelling within 10.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: '+',
    unlockedBy: ['+3-4-tot-10', 'splitsen-tot-10'],
    unlocks: ['dubbels-tot-10', 'helften-tot-10'],
    subsumedBy: null,
    applicableExercises: [
      EX.fillVis, EX.fillPlain, EX.choice, EX.tf,
      EX.collectCounter, EX.numberlineJump, EX.rekenrekAdd,
    ],
    generate: () => {
      const a = rnd(1, 9)
      const b = rnd(1, 10 - a)
      return { a, b, op: '+' }
    },
    disabled: true,  // WIP gate
  },

  {
    id: 'dubbels-tot-10',
    name: 'Dubbels tot 10',
    intent: 'Knows 1+1, 2+2, 3+3, 4+4, 5+5. Fact-recall drill.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: '+',
    unlockedBy: ['optellen-tot-10'],
    unlocks: [],
    subsumedBy: null,
    applicableExercises: [EX.fillPlain, EX.choice, EX.tf, EX.dubbelRecognise],
    generate: () => {
      const a = rnd(1, 5)
      return { a, b: a, op: '+' }
    },
  },

  {
    id: 'helften-tot-10',
    name: 'Helften tot 10',
    intent: 'Knows half of 2, 4, 6, 8, 10. Fact-recall drill.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    op: 'half',
    unlockedBy: ['optellen-tot-10'],
    unlocks: [],
    subsumedBy: null,
    applicableExercises: [EX.fillPlain, EX.choice, EX.splitsHelft],
    generate: () => {
      const total = pickFrom([2, 4, 6, 8, 10])
      return { a: total, b: total / 2, op: 'half' }
    },
  },

  // ── Aftrekken ───────────────────────────────────────────────────────────────

  {
    id: '-1-2-tot-5',
    name: '−1 / −2 tot 5',
    intent: 'Take away 1 or 2 within 5 — counting back.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    semanticForm: 'wegnemen',
    op: '-',
    unlockedBy: ['splitsen-herken-5'],
    unlocks: ['aftrekken-wegnemen-5'],
    subsumedBy: 'aftrekken-wegnemen-5',
    applicableExercises: [
      EX.wegnemenCrossedOut, EX.collectCounterDown,
      EX.numberlineJumpBack, EX.fillPlain, EX.choice, EX.tf,
    ],
    generate: () => {
      const b = pickFrom([1, 2])
      const a = rnd(b, 5)
      return { a, b, op: '-' }
    },
    disabled: true,  // WIP gate
  },

  {
    id: 'aftrekken-wegnemen-5',
    name: 'Aftrekken (wegnemen) tot 5',
    intent: 'Take-away meaning within 5 — "ik had 5, ik geef 3 weg, hoeveel blijft over?"',
    didactics: {
      startingPoint: 'Can count back and knows optellen tot 5; understands "minder".',
      goal: 'Take-away within 5: given a whole and a removed part, finds what remains.',
      pitfalls: [
        'Counting back off-by-one (including or excluding the start)',
        'Reversing to a + b instead of a − b',
        'Returning an operand unchanged',
      ],
    },
    semanticForm: 'wegnemen',
    op: '-',
    unlockedBy: ['-1-2-tot-5', 'optellen-tot-5'],
    unlocks: ['aftrekken-verschil-5', 'aftrekken-aanvullen-5', '-1-2-tot-10'],
    subsumedBy: 'aftrekken-wegnemen-10',
    applicableExercises: [
      EX.wegnemenCrossedOut, EX.collectCounterDown,
      EX.numberlineJumpBack, EX.fillPlain, EX.choice, EX.tf,
    ],
    generate: () => {
      const a = rnd(2, 5)
      const b = rnd(1, a)
      return { a, b, op: '-' }
    },
  },

  {
    id: 'aftrekken-verschil-5',
    name: 'Aftrekken (verschil) tot 5',
    intent: 'Difference meaning — "Anna heeft 5, Tom heeft 2, hoeveel meer Anna?" Both groups still exist; nothing is removed.',
    didactics: {
      startingPoint: 'Secure with wegnemen tot 5; can compare two quantities side by side.',
      goal: 'Difference meaning: both groups remain, find how many more one has than the other.',
      pitfalls: [
        'Treating verschil as wegnemen or as addition (semantic narrowing)',
        'Counting only one of the two groups',
        'Off-by-one when matching the groups pairwise',
      ],
    },
    semanticForm: 'verschil',
    op: '-',
    unlockedBy: ['aftrekken-wegnemen-5'],
    unlocks: ['aftrekken-verschil-10'],
    subsumedBy: 'aftrekken-verschil-10',
    applicableExercises: [
      EX.verschilTwoGroups, EX.verschilRekenrek,
      EX.fillPlain, EX.choice,
    ],
    generate: () => {
      const a = rnd(2, 5)
      const b = rnd(1, a)
      return { a, b, op: '-' }
    },
  },

  {
    id: 'aftrekken-aanvullen-5',
    name: 'Aftrekken (aanvullen) tot 5',
    intent: 'Missing-part meaning — "Tom heeft 2 en wil 5. Hoeveel erbij?"',
    didactics: {
      startingPoint: 'Secure with wegnemen tot 5; knows the splits of numbers ≤ 5.',
      goal: 'Missing-part meaning: given a start and a target, finds how many to add.',
      pitfalls: [
        'Treating aanvullen as wegnemen (semantic narrowing)',
        'Adding start and target instead of finding the gap',
        'Off-by-one on the count up to the target',
      ],
    },
    semanticForm: 'aanvullen',
    op: '-',
    unlockedBy: ['aftrekken-wegnemen-5'],
    unlocks: ['aftrekken-aanvullen-10'],
    subsumedBy: 'aftrekken-aanvullen-10',
    applicableExercises: [
      EX.aanvullenTarget, EX.splitsOntbrekenRechts,
      EX.numberlineJumpUpFromB, EX.fillPlain, EX.choice,
    ],
    generate: () => {
      const a = rnd(2, 5)
      const b = rnd(1, a)
      return { a, b, op: '-' }
    },
  },

  {
    id: '-1-2-tot-10',
    name: '−1 / −2 tot 10',
    intent: 'Take away 1 or 2 within 10.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    semanticForm: 'wegnemen',
    op: '-',
    unlockedBy: ['aftrekken-wegnemen-5', 'getalbegrip-10'],
    unlocks: ['-3-4-tot-10'],
    subsumedBy: 'aftrekken-wegnemen-10',
    applicableExercises: [
      EX.wegnemenCrossedOut, EX.collectCounterDown,
      EX.numberlineJumpBack, EX.fillPlain, EX.choice, EX.tf,
    ],
    generate: () => {
      const b = pickFrom([1, 2])
      const a = rnd(b, 10)
      return { a, b, op: '-' }
    },
  },

  {
    id: '-3-4-tot-10',
    name: '−3 / −4 tot 10',
    intent: 'Take away 3 or 4 within 10 — derived-fact reasoning starts mattering.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    semanticForm: 'wegnemen',
    op: '-',
    unlockedBy: ['-1-2-tot-10'],
    unlocks: ['aftrekken-wegnemen-10'],
    subsumedBy: 'aftrekken-wegnemen-10',
    applicableExercises: [
      EX.wegnemenCrossedOut, EX.collectCounterDown,
      EX.numberlineJumpBack, EX.fillPlain, EX.choice, EX.tf,
    ],
    generate: () => {
      const b = pickFrom([3, 4])
      const a = rnd(b, 10)
      return { a, b, op: '-' }
    },
  },

  {
    id: 'aftrekken-wegnemen-10',
    name: 'Aftrekken (wegnemen) tot 10',
    intent: 'Take-away meaning within 10.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    semanticForm: 'wegnemen',
    op: '-',
    unlockedBy: ['-3-4-tot-10', 'splitsen-tot-10'],
    unlocks: ['aftrekken-verschil-10', 'aftrekken-aanvullen-10'],
    subsumedBy: null,
    applicableExercises: [
      EX.wegnemenCrossedOut, EX.collectCounterDown,
      EX.numberlineJumpBack, EX.fillPlain, EX.choice, EX.tf,
    ],
    generate: () => {
      const a = rnd(2, 10)
      const b = rnd(1, a)
      return { a, b, op: '-' }
    },
    disabled: true,  // WIP gate
  },

  {
    id: 'aftrekken-verschil-10',
    name: 'Aftrekken (verschil) tot 10',
    intent: 'Difference meaning within 10.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    semanticForm: 'verschil',
    op: '-',
    unlockedBy: ['aftrekken-wegnemen-10', 'aftrekken-verschil-5'],
    unlocks: [],
    subsumedBy: null,
    applicableExercises: [
      EX.verschilTwoGroups, EX.verschilRekenrek,
      EX.fillPlain, EX.choice,
    ],
    generate: () => {
      const a = rnd(2, 10)
      const b = rnd(1, a)
      return { a, b, op: '-' }
    },
  },

  {
    id: 'aftrekken-aanvullen-10',
    name: 'Aftrekken (aanvullen) tot 10',
    intent: 'Missing-part meaning within 10.',
    didactics: {
      startingPoint: 'TODO',
      goal: 'TODO',
      pitfalls: [],
    },
    semanticForm: 'aanvullen',
    op: '-',
    unlockedBy: ['aftrekken-wegnemen-10', 'aftrekken-aanvullen-5'],
    unlocks: [],
    subsumedBy: null,
    applicableExercises: [
      EX.aanvullenTarget, EX.splitsOntbrekenRechts,
      EX.numberlineJumpUpFromB, EX.fillPlain, EX.choice,
    ],
    generate: () => {
      const a = rnd(2, 10)
      const b = rnd(1, a)
      return { a, b, op: '-' }
    },
  },
]

export const SKILLS_BY_ID: Record<string, SkillDefinition> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
)
