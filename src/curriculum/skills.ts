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
    intent: 'Recognises quantity, cijfersymbool, position on number line, dot-pattern, and finger-pattern for 1–5.',
    op: 'count',
    unlockedBy: [],
    unlocks: ['splitsen-tot-5', 'getalbegrip-10'],
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
    intent: 'Same as getalbegrip-5 for 1–10, with explicit awareness of the 5-structure (6=5+1, 7=5+2, …) — entry point for the rekenrek.',
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
    id: 'splitsen-tot-5',
    name: 'Splitsen tot 5',
    intent: 'Knows the splits of 2, 3, 4, 5 in both orders (5 = 1+4 and 4+1, 5 = 2+3 and 3+2).',
    op: 'split',
    unlockedBy: ['getalbegrip-5'],
    unlocks: ['+1-2-tot-5', '-1-2-tot-5', 'splitsen-tot-10'],
    subsumedBy: 'splitsen-tot-10',
    applicableExercises: [
      EX.splitsVrij, EX.splitsOntbrekenRechts, EX.splitsOntbrekenLinks,
      EX.splitsAlle, EX.splitshuisje, EX.splitsbenen,
      EX.dotPatternDecompose, EX.rekenrekDecompose,
    ],
    generate: () => {
      const total = rnd(2, 5)
      const a = rnd(0, total)
      return { a, b: total - a, op: 'split' }
    },
  },

  {
    id: 'splitsen-tot-10',
    name: 'Splitsen tot 10',
    intent: 'Same as splitsen-tot-5 for 6, 7, 8, 9, 10. The "boss splitgetal" is 10 — its 11 splits get drilled to recall.',
    op: 'split',
    unlockedBy: ['splitsen-tot-5', 'getalbegrip-10'],
    unlocks: ['tienvrienden', 'optellen-tot-10', 'aftrekken-wegnemen-10'],
    subsumedBy: null,
    applicableExercises: [
      EX.splitsVrij, EX.splitsOntbrekenRechts, EX.splitsOntbrekenLinks,
      EX.splitsAlle, EX.splitshuisje, EX.splitsbenen,
      EX.dotPatternDecompose, EX.rekenrekDecompose,
    ],
    generate: () => {
      const total = rnd(6, 10)
      const a = rnd(0, total)
      return { a, b: total - a, op: 'split' }
    },
  },

  {
    id: 'tienvrienden',
    name: 'Tienvrienden',
    intent: 'Instant recall of the 5 pairs that make 10 (1+9, 2+8, 3+7, 4+6, 5+5) in both orders. Fact-recall drill, never archived.',
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
  },

  // ── Optellen ────────────────────────────────────────────────────────────────

  {
    id: '+1-2-tot-5',
    name: '+1 / +2 tot 5',
    intent: 'Add 1 or add 2 within 5 — counting on, no structural reasoning required.',
    op: '+',
    unlockedBy: ['splitsen-tot-5'],
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
  },

  {
    id: 'optellen-tot-5',
    name: 'Optellen tot 5',
    intent: 'Any optelling within 5 (a + b ≤ 5).',
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
  },

  {
    id: 'dubbels-tot-10',
    name: 'Dubbels tot 10',
    intent: 'Knows 1+1, 2+2, 3+3, 4+4, 5+5. Fact-recall drill.',
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
    op: '-',
    unlockedBy: ['splitsen-tot-5'],
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
  },

  {
    id: 'aftrekken-wegnemen-5',
    name: 'Aftrekken (wegnemen) tot 5',
    intent: 'Take-away meaning within 5 — "ik had 5, ik geef 3 weg, hoeveel blijft over?"',
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
  },

  {
    id: 'aftrekken-verschil-10',
    name: 'Aftrekken (verschil) tot 10',
    intent: 'Difference meaning within 10.',
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
