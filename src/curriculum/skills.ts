import type { SkillDefinition } from './types'
import { sampleFact, reweight, enumerateSplits, enumeratePlus, enumerateMinus } from './factSampling'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo
const pickFrom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Weighted value pick: [[value, weight], ...]
const pickWeighted = (pairs: [number, number][]): number => {
  const sum = pairs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * sum
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v }
  return pairs[pairs.length - 1][0]
}

// ─── Exercise type ids ────────────────────────────────────────────────────────
// Centralised so a typo in `applicableExercises` is a compile error, not a
// silent runtime "no exercises available". Includes types stubbed in round 2.

const EX = {
  // Generic arithmetic presentations
  fillVis:        'fill-vis',
  fillPlain:      'fill-plain',
  choice:         'choice',
  tf:             'tf',
  erbijTap:       'erbij-tap',
  collectCounter: 'collect-counter',
  numberlineJump: 'numberline-jump',

  // Number sense / pre-arithmetic
  countAndTap:           'count-and-tap',
  dotPatternRecognise:   'dot-pattern-recognise',
  fingerPatternRecognise:'finger-pattern-recognise',
  numberlinePlace:       'numberline-place',
  compareMoreLess:       'compare-more-less',
  comparePick:           'compare-pick',
  rekenrekShow:          'rekenrek-show',
  tenFrameShow:          'ten-frame-show',
  numberSequenceOrder:   'number-sequence-order',
  showMeOnTenFrame:      'show-me-on-ten-frame',
  numberlineRead:        'numberline-read',
  quantityMatch:         'quantity-match',
  subitiseFlash:         'subitise-flash',

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
  sameSplitOrDifferent:   'same-split-or-different',
  splitsMatch:            'splits-match',
  splitsShuffle:          'splits-shuffle',
  splitsBuildIt:          'splits-build-it',

  // Post-60 width set (op-generic: + and − skills)
  splitsSomMatch:  'splits-som-match',
  rekenverhaal:    'rekenverhaal',

  // Tienvrienden-specific
  tienveldFill:    'tienveld-fill',
  rekenrekMakeTen: 'rekenrek-make-ten',

  // Optellen extras
  rekenrekAdd:      'rekenrek-add',
  dubbelRecognise:  'dubbel-recognise',

  // Aftrekken-specific presentations
  wegneemTap:            'wegneem-tap',
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
      EX.numberlinePlace, EX.compareMoreLess, EX.comparePick, EX.tenFrameShow, EX.rekenrekShow,
      EX.numberSequenceOrder, EX.showMeOnTenFrame, EX.numberlineRead,
      EX.quantityMatch, EX.subitiseFlash,
    ],
    generate: () => ({ op: 'count', n: rnd(1, 5) }),
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
      EX.numberlinePlace, EX.compareMoreLess, EX.comparePick, EX.rekenrekShow, EX.tenFrameShow,
      EX.numberSequenceOrder, EX.showMeOnTenFrame, EX.numberlineRead,
      EX.quantityMatch, EX.subitiseFlash,
    ],
    // 70% in the 6–10 band — the skill's identity is the 5-anchor extension;
    // 1–5 keeps a 30% refresh share (and rotates via getalbegrip-5 until that caps).
    generate: () => ({ op: 'count', n: Math.random() < 0.7 ? rnd(6, 10) : rnd(1, 5) }),
  },

  // ── Splitsen ────────────────────────────────────────────────────────────────

  {
    id: 'splitsen-herken-5',
    name: 'Splitsen herkennen tot 5',
    intent: 'First half of the part-whole spine: perceptually identifies the two parts of a structured total 2–5. The recognition foundation under all upcoming +/− work; production (notation) runs in parallel.',
    didactics: {
      startingPoint: 'Secure getalbegrip tot 5 — subitises 1–5 from structured patterns, reads the written numerals, and treats a quantity like 5 as a single whole rather than five separate items. That whole-perception is what makes a split visible as a part-of-something.',
      goal: 'Given a structured total 2–5 arranged visually as two parts (two dot groups, two ten-frame chunks, splitshuisje rooms), reads both parts without counting from 1, and recognises that 2 + 3 and 3 + 2 are the same split of the same whole. Perceptual only; written notation belongs to splitsen-noteren-5.',
      pitfalls: [
        'Counts the whole instead of seeing the parts — registers "five dots" as one undifferentiated count, never decomposes. The subitising-the-split move hasn\'t happened.',
        'Names one part and stops — fixates on whichever chunk pops out first (often the larger or the more familiar pattern) and doesn\'t return for the second.',
        'Order-dependence — treats 2 + 3 and 3 + 2 as different splits. The part-whole structure isn\'t yet symmetric in the kid\'s head.',
      ],
    },
    op: 'split',
    unlockedBy: ['getalbegrip-5'],
    unlocks: ['splitsen-noteren-5', '+1-2-tot-5', '-1-2-tot-5', 'splitsen-tot-10'],
    subsumedBy: 'splitsen-tot-10',
    applicableExercises: [
      EX.dotPatternDecompose, EX.splitsFrame, EX.splitsHerkenHuisje,
      EX.sameSplitOrDifferent, EX.splitsMatch, EX.splitsShuffle, EX.splitsBuildIt,
    ],
    generate: () => {
      // Totals weighted 1:2:3:4 — linger on 5 (the structural anchor); total 2
      // has only the trivial 1+1 and drops to a 10% share.
      const total = pickWeighted([[2, 1], [3, 2], [4, 3], [5, 4]])
      const partA = rnd(1, total - 1)
      return { op: 'split', partA, partB: total - partA }
    },
  },

  {
    id: 'splitsen-noteren-5',
    name: 'Splitsen noteren tot 5',
    intent: 'Second half of the part-whole spine: produces splits of totals 2–5 in the canonical Flemish notations (splitshuisje, splitsbenen, missing-part equations). Where herken reads a split that\'s shown, noteren generates one or completes it — the production complement to recognition. Runs parallel to the +/− track, not a prereq for it.',
    didactics: {
      startingPoint: 'Secure with splitsen-herken-5 — sees both parts of a structured total 2–5, treats a + b and b + a as the same split, and reads the written numerals 1–5. Ready to externalise the part-whole structure in writing rather than only see it.',
      goal: 'Given any total 2–5: produces a valid splitsing on demand, fills a splitshuisje (one configuration or — at higher score — systematically all of them), completes missing-part equations in either position (5 = 3 + ?, 5 = ? + 3) without confusing them, and writes the canonical Flemish notations cleanly.',
      pitfalls: [
        'Position confusion — 5 = ? + 3 is harder than 5 = 3 + ? because the missing slot reads left-to-right after the total, and the kid wants to count up from 5 instead of subtracting.',
        'One-split bias — asked "geef een splitsing van 5", defaults to halves (2 + 3) or "1 + rest" every time instead of varying which part-pair to produce.',
        'Incomplete enumeration — asked for all splits, lists two or three obvious ones and stops, or accidentally produces duplicates by treating 2 + 3 and 3 + 2 as different splits.',
      ],
    },
    op: 'split',
    unlockedBy: ['splitsen-herken-5'],
    unlocks: [],
    subsumedBy: 'splitsen-tot-10',
    applicableExercises: [
      EX.splitsVrij, EX.splitsOntbrekenRechts, EX.splitsOntbrekenLinks,
      EX.splitsAlle, EX.splitshuisje, EX.splitsbenen,
    ],
    generate: (ctx) => {
      // Fact-proportional over totals 2–5 (5 naturally lingers: most splits).
      // 0-splits join the space from score 30 — visually odd at entry,
      // normalised mid-skill, required in splits-alle's table.
      const includeZero = (ctx?.score ?? 0) >= 30
      return sampleFact(enumerateSplits(2, 5, { includeZero }))
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
      const partA = rnd(1, total - 1)
      return { op: 'split', partA, partB: total - partA }
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
      const partA = rnd(1, 9)
      return { op: 'split', partA, partB: 10 - partA }
    },
    disabled: true,  // WIP gate
  },

  // ── Optellen ────────────────────────────────────────────────────────────────

  {
    id: '+1-2-tot-5',
    name: '+1 / +2 tot 5',
    intent: 'Add 1 or add 2 within 5 — counting on, no structural reasoning required. Introduces the + sign and the equation form, with the erbij action as its meaning.',
    didactics: {
      startingPoint: 'Secure with splitsen-herken-5 — sees a quantity 1–5 as a whole that can contain parts, subitises structured patterns, and reads the numerals. Has not yet met the + sign or the equation form.',
      goal: 'Given any a + 1 or a + 2 within 5, in equation form or acted out (erbij / samenvoegen), answers reliably without recounting the start group from 1: +1 is the buurgetal, +2 is one move of two. Post-60: the bare equation is fast, and a flipped form (1 + 4) is recognised as the same sum, started from the larger number.',
      pitfalls: [
        'Counting all — rebuilds the start group from 1 instead of counting on from it (the dead-end strategy; erbij-tap and the counter expose it via tap counts).',
        '+2 as two separate +1 steps — the 2 hasn\'t become a unit (visible as slow, serial answers on +2 while +1 is instant).',
        'Off-by-one at the step over the start group — says the start number again for the first arrival.',
      ],
    },
    op: '+',
    unlockedBy: ['splitsen-herken-5'],
    unlocks: ['optellen-tot-5'],
    subsumedBy: 'optellen-tot-5',
    applicableExercises: [
      EX.erbijTap, EX.fillVis, EX.numberlineJump, EX.collectCounter,
      EX.choice, EX.tf, EX.fillPlain,
      EX.splitsSomMatch, EX.rekenverhaal,
    ],
    generate: (ctx) => {
      // Uniform over the 7 facts (a+1 for a=1..4, a+2 for a=1..3). Post-60 a
      // share arrives small-addend-first ("1 + 4") — the commutativity /
      // start-from-the-larger material; the symbolic exercises display it as
      // written and the action exercises enact it from the larger operand.
      const fact = sampleFact(enumeratePlus(5, [1, 2]))
      if ((ctx?.score ?? 0) >= 60 && fact.terms[0] > fact.terms[1] && Math.random() < 0.3) {
        return { op: '+', terms: [fact.terms[1], fact.terms[0]] }
      }
      return fact
    },
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
      EX.erbijTap, EX.collectCounter, EX.numberlineJump,
    ],
    generate: () => {
      const a = rnd(1, 4)
      const b = rnd(1, 5 - a)
      return { op: '+', terms: [a, b] }
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
      EX.erbijTap, EX.collectCounter, EX.numberlineJump,
    ],
    generate: () => {
      const b = pickFrom([1, 2])
      const a = rnd(1, 10 - b)
      return { op: '+', terms: [a, b] }
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
      return { op: '+', terms: [a, b] }
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
      return { op: '+', terms: [a, b] }
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
      return { op: '+', terms: [a, a] }
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
      return { op: 'half', total }
    },
  },

  // ── Aftrekken ───────────────────────────────────────────────────────────────

  {
    id: '-1-2-tot-5',
    name: '−1 / −2 tot 5',
    intent: 'Take away 1 or 2 within 5 — counting back. Introduces the − sign, with the wegnemen action (things leave) as its meaning.',
    didactics: {
      startingPoint: 'Secure with splitsen-herken-5 — sees a quantity 1–5 as a whole containing parts, subitises structured patterns, reads the numerals. Has met + via the parallel +1-2 track; has not yet met the − sign. Backward counting is genuinely weaker than forward — entry stays more concrete, longer, than the + mirror.',
      goal: 'Given any a − 1 or a − 2 within 5, in equation form or acted out as wegnemen, answers reliably by counting back (or knowing): −1 is the buurgetal ervoor, −2 is one move of two back. Post-60: the bare equation is fast, and a reversed statement ("2 − 5 = 3") is rejected as niet waar.',
      pitfalls: [
        'Counting back off-by-one — says the whole again for the first leaver (the boundary error).',
        'Reading − as + — answers the sum; the leave-action visual is kept long to anchor the sign\'s meaning.',
        'Order-insensitivity — treats a − b and b − a as the same; only the tf reversal traps surface this, since the generator never produces smaller-first.',
      ],
    },
    semanticForm: 'wegnemen',
    op: '-',
    unlockedBy: ['splitsen-herken-5'],
    unlocks: ['aftrekken-wegnemen-5'],
    subsumedBy: 'aftrekken-wegnemen-5',
    applicableExercises: [
      EX.wegneemTap, EX.wegnemenCrossedOut, EX.fillVis,
      EX.numberlineJumpBack, EX.collectCounterDown,
      EX.choice, EX.tf, EX.fillPlain,
      EX.splitsSomMatch, EX.rekenverhaal,
    ],
    generate: (ctx) => {
      // Uniform over the 9 facts (a−1 for a=1..5, a−2 for a=2..5), including
      // the two "alles weg" → 0 facts (1−1, 2−2) — damped below score 30 so 0
      // doesn't show up before the action-meaning is anchored.
      const facts = enumerateMinus(5, [1, 2])
      const score = ctx?.score ?? 0
      return sampleFact(score < 30 ? reweight(facts, f => (f.whole === f.part ? 0.25 : 1)) : facts)
    },
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
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
      return { op: '-', whole: a, part: b }
    },
  },
]

export const SKILLS_BY_ID: Record<string, SkillDefinition> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
)
