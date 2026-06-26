import { SKILLS } from './skills'

// ─── Exercise-structure rationale ─────────────────────────────────────────────
// The long-form "which exercise comes where, and why" narrative per skill. Kept
// out of skills.ts for scannability; this is the design-doc layer that explains
// the weight curves in weightMatrix.ts (which exercise dominates at low vs high
// score, and the concrete → abstract logic behind the shift).
//
// Every skill must have an entry. A 'TODO' string is an acceptable placeholder,
// but the key must exist — `missingExercisePlanIds()` flags any gaps and a dev
// warning fires on import. See CLAUDE.md → Blueprint.

const TODO = 'TODO — beschrijf welke oefening waar in de score-curve komt en waarom.'

export const EXERCISE_PLAN: Record<string, string> = {
  'getalbegrip-5':
    'Leads with count-and-tap (weight 40→5): at low score the child still counts concretely, so ' +
    'tapping items one by one — then naming the total (the cardinality probe) — is the right ' +
    'support. As the score climbs the weight shifts to dot-pattern-recognise (5→30) and ' +
    'ten-frame-show (10→25): structured, subitisable arrangements that reward seeing a quantity ' +
    'at a glance rather than counting it. compare-more-less stays a constant 15 as the ' +
    'perceptual comparison check (meer/minder of two → meest/minst of three via its tiers); ' +
    'compare-pick phases in from 25 (relation-to-anchor, the home of evenveel). The arc is ' +
    'concrete counting → structured perception.',
  'getalbegrip-10':
    'Same arc as getalbegrip-5 across 1–10 (the generator serves the 6–10 band 70% of the time), ' +
    'but leaning more on the 5-structure presentations, full stop: ten-frame-show 18→28, ' +
    'finger-pattern-recognise 12→28 and show-me-on-ten-frame 20 carry the 5-anchor so 6–10 are ' +
    'perceived as 5+n instead of counted by ones. number-sequence-order earns 30 here — its ' +
    'sparse tier (ordering non-consecutive numerals) only gets interesting in this range.',
  'splitsen-herken-5':
    'Seven recognition exercises, all fallible from tier 0 (except two deliberate orientation ' +
    'tiers: the huisje die-both drag and shuffle\'s watch tier, both weight-limited early). ' +
    'Early mix: dot-pattern-decompose (30), splits-frame (25, redesigned: part + "?" with a ' +
    'reveal-and-merge that shows composition), splits-herken-huisje (25) and splits-build-it ' +
    '(25, cut-then-name-your-own-split). As the score rises the width probes phase in and the ' +
    'production forms fade: splits-shuffle (whole visibly splits, greyed original as referent — ' +
    'conservation by comparison), same-split-or-different (order-independence, from 20), ' +
    'splits-match (representational transfer: choose → face-up koppelen → memory, from 30). ' +
    'The generator lingers on total 5 (weights 1:2:3:4). Weights are initial guesses pending ' +
    'playtesting.',

  '+1-2-tot-5':
    'The entry belongs to the erbij action: erbij-tap (30, fading out by 70) has the child tap ' +
    'the arrivals into a standing group while the chip counts on — counting on physically ' +
    'enacted, with the cardinality question hidden-group so a recount can\'t answer it. ' +
    'fill-vis (30→15) carries the two semantic variants (erbij arrival / samenvoegen merge), ' +
    'each bound to its canonical cue phrase, and owns the introduction of the + sign via the ' +
    'reveal. The middle of the curve shifts to seeing and strategy: numberline-jump ramps to 20 ' +
    'at 40 (sprongetjes: +1/+2 as spatial moves, tiers watch → tap-the-landing → sparse line), ' +
    'collect-counter stays a low constant as the strategy probe (tap counts expose ' +
    'counting-all), choice fades its dots at 50. Post-60 is width and automation: tf phases in ' +
    'from 25 and adds operand-echo traps at 60, fill-plain ramps from 40 to dominance at 100, ' +
    'and the generator starts serving flipped forms (1 + 4) that the equation tier of fill-vis ' +
    'answers with the explicit commutativity swap while the action exercises enact from the ' +
    'larger operand. splits-som-match joins early (from ~40) via a full-som scaffold tier — the ' +
    'whole som with its uitkomst (2 + 3 = 5) shown so all three numbers match the split — before ' +
    'the bare-som relation tiers at 60/80. rekenverhaal joins from 60 (the words carry the ' +
    'semantics — erbij/samenvoegen sentences, replay tap as reading fallback). Weights are ' +
    'initial guesses pending playtesting.',

  'splitsen-noteren-5':
    'Production complement to splitsen-herken-5; the invariant everywhere is that the parts are ' +
    'never visible on screen (the roof die-aid is always an UNSPLIT pattern — a colour-split ' +
    'roof would collapse production back into recognition). splitshuisje owns the entry (40→15): ' +
    'the house the child knows from herken, now filled with numerals — one room prefilled with a ' +
    'die-aid, then bare numpad at 30, then two-different-splits at 60. splitsbenen joins at 25 ' +
    'as the second canonical notation (same fact, new clothes — notation transfer). ' +
    'splits-ontbreken-rechts carries the middle (ramping to 25 at 55): it starts in the ' +
    'symbol-free "5 is 3 en ?" wording and switches to the "5 = 3 + ?" equation form at 55, by ' +
    'which time + is familiar from the parallel + track — deliberately the second equation shape ' +
    'the child meets, protecting the equals sign as a relation. Post-60 is depth: ' +
    'splits-ontbreken-links (the documented harder position), splits-vrij with the nog-een ' +
    'variety round (anti one-split bias: a repeat, even order-flipped, is wrong), and ' +
    'splits-alle (65+), the full descending table incl. 0-rows — systematicity as the capstone. ' +
    'The generator brings 0-splits into the fact space from score 30. Weights are initial ' +
    'guesses pending playtesting.',

  // Later branches — fill as exercises are built.
  'splitsen-tot-10': TODO,
  'tienvrienden': TODO,
  'optellen-tot-5': TODO,
  '+1-2-tot-10': TODO,
  '+3-4-tot-10': TODO,
  'optellen-tot-10': TODO,
  'dubbels-tot-10': TODO,
  'helften-tot-10': TODO,
  '-1-2-tot-5':
    'Mirror of +1-2-tot-5 with a more concrete-heavy entry, because backward counting is ' +
    'genuinely weaker than forward. The entry belongs to the wegnemen action: wegneem-tap (30, ' +
    'fading by 70) has the child tap the leavers away while the chip counts back — the ghosts ' +
    'keep the remainder readable, so the doen tier stays fully supported. fill-vis (25→12) acts ' +
    'out the leave on the reveal (whole appears → b fade to crossed ghosts → equation builds) — ' +
    'the leave IS the − sign\'s meaning, kept long against +/− confusion. wegnemen-crossed-out ' +
    'holds a low flat share (15→8) through the whole curve: the static werkboek form, worth ' +
    'recognising in its own right. The middle shifts to structure and strategy: ' +
    'numberline-jump-back ramps to 20 at 40 (counting back as spatial moves, doubling as ' +
    'backward-counting practice), collect-counter-down stays a low constant as the strategy ' +
    'probe. Post-60 is width and automation: tf adds reversal traps ("2 − 5 = 3") and ' +
    'operand-echo at 60 — the only place order-sensitivity gets tested, since the generator ' +
    'never produces smaller-first — and fill-plain ramps from 40 to dominance. splits-som-match ' +
    'joins early (from ~40) via a full-som scaffold tier — 5 − 1 = 4 shown whole so all three ' +
    'numbers match the split — before the bare-som via-splitsing tiers at 60/80 (5 − 1 next to ' +
    'the split {1,4}). rekenverhaal joins from 60 (wegnemen sentences, replay tap as reading ' +
    'fallback). The generator serves the two "alles weg" → 0 facts damped below score 30. ' +
    'Weights are initial guesses pending playtesting.',
  'aftrekken-wegnemen-5': TODO,
  'aftrekken-verschil-5': TODO,
  'aftrekken-aanvullen-5': TODO,
  '-1-2-tot-10': TODO,
  '-3-4-tot-10': TODO,
  'aftrekken-wegnemen-10': TODO,
  'aftrekken-verschil-10': TODO,
  'aftrekken-aanvullen-10': TODO,
}

export function getExercisePlan(skillId: string): string {
  return EXERCISE_PLAN[skillId] ?? TODO
}

// Skill ids that have no entry at all (a stricter check than "is it still TODO").
// Reported through validate.ts alongside the other curriculum checks.
export function missingExercisePlanIds(): string[] {
  return SKILLS.filter(s => !(s.id in EXERCISE_PLAN)).map(s => s.id)
}
