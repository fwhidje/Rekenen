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
    'The entry belongs to the erbij action: erbij-tap (30, gone by 55; one tier) has the child tap ' +
    'the waiting arrivals into the start group\'s 5-row while the chip counts on — counting on ' +
    'physically enacted, with the row covered at the question so a recount can\'t answer it. ' +
    'fill-vis (30→15) carries the two semantic variants (erbij arrival / samenvoegen), each bound ' +
    'to its canonical cue phrase, and owns the introduction of the + sign: picture and sum form ' +
    'together, each number appearing with its group. From 40 it is the bare sum (a wrong answer ' +
    'brings the picture back). The middle of the curve shifts to seeing and strategy: ' +
    'numberline-jump ramps to 20 at 40 (sprongetjes: +1/+2 as spatial moves, tiers watch → ' +
    'tap-the-landing → sparse line), and doosje (12 → 18 at 40 → 8) makes counting on NECESSARY — ' +
    'the start group sits in a closed box, so only the number on the lid plus the visible ' +
    'arrivals give the answer. choice fades its dots at 50. Post-60 is width and automation: tf ' +
    'phases in from 25 and adds operand-echo traps at 60, fill-plain ramps from 40 to dominance ' +
    'at 100, and the generator starts serving flipped forms (1 + 4) — shown as written, with no ' +
    'animation. splits-som-match joins early (from ~40) via a full-som scaffold tier — the whole ' +
    'som with its uitkomst (2 + 3 = 5) shown so all three numbers match the split — before the ' +
    'relation tiers at 60/80 (bare som for the dice pictures, full som with the mini-huisje). ' +
    'rekenverhaal joins from 60: the sentences with the sum forming alongside, then (80) the ' +
    'sentences alone; the film plays only on the ▶ tap, and a wrong answer brings the fully ' +
    'pictured version. Weights are initial guesses pending playtesting.',

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
    'variety round (anti one-split bias: a repeat, even order-flipped, is refused with a warning), and ' +
    'splits-alle (65+), the full descending table incl. 0-rows — systematicity as the capstone. ' +
    'The generator brings 0-splits into the fact space from score 30. Weights are initial ' +
    'guesses pending playtesting.',

  // Later branches — fill as exercises are built.
  // ── Designed, not built (Nov 2026) ───────────────────────────────────────────
  // All seven skills below are built and still gated (not yet played by a child). The design, with a
  // first-guess weight per exercise, is in the skill map → "Exercise design for
  // the next set". Rewrite each plan when its skill is built and tuned.
  'splitsen-6-7':
    'Built, gated (Nov 2026). The picture first, the notations from the middle, the neighbour ' +
    'step and speed at the top — the herken → noteren arc of tot 5 inside one skill, in the ' +
    '5-structure throughout. splits-beeld owns the entry (45 → 6): the whole on 5-rows in two ' +
    'colours, then one part under a cover, then the picture only for a moment. splitshuisje ' +
    'joins at 10 and carries the middle; splits-ontbreken-rechts and splitsbenen follow from ' +
    '25–30. splits-buren (from 20, peak 20 at 50) is the new idea: a split derived from its ' +
    'neighbour, one part down and the other up — the way back that is not counting. Post-60: ' +
    'ontbreken-links, splits-vrij, and snel-weten (one tap, time-aware) ramping to the largest ' +
    'share. Not here: the dice exercises of tot 5 (dice stop at 6) and splits-alle (the table ' +
    'of 8 or 9 does not fit the screen). Weights are initial guesses pending playtesting.',
  'splitsen-8-9':
    'Built, gated (Nov 2026). Same curve as splitsen-6-7 — the two bands unlock together and ' +
    'differ only in their totals.',
  'tienvrienden':
    'Built, gated (Nov 2026). The picture first, then every form, then mostly speed. maak-tien ' +
    'owns the entry (45 → 8): a full ten with some places taken — on a tienveld the empty ' +
    'places ARE the partner, on two hands the fingers that are down; it flashes from 30 and is ' +
    'only a confirmation from 55. tien-paren (from 10) asks for the pair from either side, ' +
    'with two cards that belong to nobody from 60. The forms come in through the middle: the ' +
    'house of 10, "10 is 7 en ?" (splits-ontbreken-rechts) and "7 + ? = 10" (puntoefening). ' +
    'From 60 snel-weten takes over and reaches half of all questions — speed is this skill\'s ' +
    'goal, and it is the only exercise that can see it. Weights are initial guesses.',
  'optellen-tot-5':
    'Built, gated (Nov 2026). The skill adds no new sums over +1-2-tot-5; it changes the method, from counting on ' +
    'to reading the sum off the split. So the counting exercises of the previous skill ' +
    '(erbij-tap, doosje, numberline-jump) are absent on purpose. Entry: flits-som (30, gone by ' +
    '65) — the picture of the sum flashes, too briefly to count — and huisje-som (30 → 8), the ' +
    'main exercise: a filled splitshuisje beside the sum, later flashed, later only shown as ' +
    'confirmation; its twee-sommen tier (2 + 3 and 3 + 2 from one house) is where van plaats ' +
    'wisselen is taught. fill-vis keeps a small fading share for continuity. Middle: ' +
    'splits-som-match from 20, tf and fill-plain from 30. Post-60: rekenverhaal and snel-weten ' +
    '(one tap, time-aware — a slow correct answer does not move the score), which ramps to the ' +
    'largest share. Zero ' +
    'terms (a + 0, 0 + a) run through the whole curve at about 15% of the draws; fill-vis, ' +
    'splits-som-match and rekenverhaal skip them (no picture or story for "nothing arrives"). ' +
    'Weights are initial guesses pending playtesting.',
  '+1-2-tot-10':
    'PLAN (Nov 2026) — wired with first-guess weights, never played; the skill is not open. ' +
    'A number-row skill: +1 is the next number, +2 one jump of two, now across the 5 and up to ' +
    '10. The meaning of + is known from tot 5, so the erbij action exercises are absent. Entry: ' +
    'numberline-jump (30 → 5) — the row itself, watched, then tapped, then with sparse labels — ' +
    'and doosje (25 → 5), where the start group of 6, 7 or 8 sits in a closed box and cannot be ' +
    'recounted; flits-som (20, gone by 70) shows the start group in the 5-structure for a ' +
    'moment. Middle: choice, tf and fill-plain from 30, and huisje-som from 30 — "9 is 7 en 2" ' +
    'ties these sums to the split bands that run alongside. Post-60: rekenverhaal, snel-weten, ' +
    'and the generator serves small-first sums (1 + 8) to be turned around. About 30% of the ' +
    'draws refresh the sums within 5. On the tot-10 line the jump is one move under one bow ' +
    '(+2 as a unit) and the landing is answered on the number strip — the cells are too small ' +
    'to tap. Turned-around sums are not served to the number line or the doosje.',
  '+3-4-tot-10':
    'PLAN (Nov 2026) — wired with first-guess weights, never played; the skill is not open. ' +
    'Three or four is too far to count on safely, so this is the skill where the sum has to ' +
    'come from structure. huisje-som leads (35 → 10): the house of the family stands beside ' +
    'the sum, so "7 is 4 en 3" is read, not required — the split bands run alongside and are ' +
    'not a prerequisite; its twee-sommen tier gives 3 + 4 and 4 + 3 from one house. flits-som ' +
    '(30, gone by 70) shows the sum in the 5-structure for a moment: 4 + 3 is seen to fill the ' +
    'row and leave two. doosje keeps a small share that is gone by 50 — counting on as the ' +
    'fallback the child still has. No number line: hopping three or four cells is the counting ' +
    'this skill leaves behind. choice throughout, tf and fill-plain from 30–35, post-60 ' +
    'rekenverhaal and snel-weten; the generator then serves small-first sums (3 + 6). The ' +
    'derived-fact route has its own exercise: buur-som from 20 ("3 + 3 = 6, dus 3 + 4" — ' +
    'from a dubbel, a sum of 10, a sum with five). Going through the five in two steps ' +
    '(som-in-stappen) is not used here: not in the Flemish sources read.',
  'optellen-tot-10': TODO,
  'dubbels-tot-10':
    'PLAN (Nov 2026) — wired with first-guess weights, never played; the skill is not open. ' +
    'Five facts, a picture and a word. Unlocks from +1-2-tot-10, next to +3-4-tot-10, because ' +
    'the dubbels are the anchors the neighbouring sums are derived from. dubbel-spiegel owns ' +
    'the entry (45 → 8): a row and the same row again under a mirror line, with the sum ' +
    'n + n; from 30 the mirror row is left to the child, from 60 only "het dubbel van 4" is ' +
    'asked. flits-som (gone by 50) and huisje-som (from 15) show the same facts in other ' +
    'clothes; choice, tf and fill-plain; from 60 snel-weten reaches half of all questions — ' +
    'this is a recall skill. 1 + 1 and 2 + 2 are known from tot 5 and come up half as often.',
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
    'backward-counting practice), and doosje (12 → 18 at 40 → 8) makes counting back ' +
    'necessary — the whole sits in a closed box, some come out, how many are still inside? Post-60 is width and automation: tf adds reversal traps ("2 − 5 = 3") and ' +
    'operand-echo at 60 — the only place order-sensitivity gets tested, since the generator ' +
    'never produces smaller-first — and fill-plain ramps from 40 to dominance. splits-som-match ' +
    'joins early (from ~40) via a full-som scaffold tier — 5 − 1 = 4 shown whole so all three ' +
    'numbers match the split. For − the som stays in full at every tier and the picture always ' +
    'shows the whole (a two-colour die or the huisje, never two separate dice). rekenverhaal ' +
    'joins from 60 (wegnemen sentences; sum alongside at 60, text alone at 80, film on the ▶ tap). The generator serves the two "alles weg" → 0 facts damped below score 30. ' +
    'Weights are initial guesses pending playtesting.',
  'aftrekken-wegnemen-5':
    'Built, gated (Nov 2026). Mirror of optellen-tot-5 with support for longer: the six new facts (−3, −4, more ' +
    '"alles weg") are exactly where counting back breaks, so wegneem-tap, doosje and ' +
    'numberline-jump-back are absent. Entry: flits-som (the crossed-out picture, flashed; gone ' +
    'by 70) and huisje-som (30 → 8; "5 is 3 en 2, dus 5 − 3 = 2"). wegnemen-crossed-out keeps ' +
    'its low flat share as the werkboek picture. Two things are new and get their own ' +
    'exercise: omkeer-som from 25 (a finished + sum gives its − reverse; its top tier tests ' +
    'the "one more gives one more" error on neighbouring − sums) and teken-kiezen from 20 ' +
    '(the sign is chosen, now that + and − rotate together). Middle and top as for +: ' +
    'splits-som-match, tf (reversal and zero traps), fill-plain, rekenverhaal, and snel-weten ' +
    'from 65. a − 0 and a − a together run at about 15% of the draws; omkeer-som and ' +
    'teken-kiezen skip them. Weights are initial guesses pending playtesting.',
  'aftrekken-verschil-5':
    'Built (Nov 2026). A meaning skill: the facts are those of wegnemen, the question is new. So there is ' +
    'no bare sum here at all — "5 − 2" says nothing about verschil — and the meaning-carrying ' +
    'exercise stays the largest to the top. verschil-paren (60 → 25): two owners, two 5-rows ' +
    'under each other (each owner is a colour, shown as a chip in the question); the pairs dim ' +
    'one by one, the ones without a partner are the difference, and the − sum forms meanwhile; from 55 the rows are no longer aligned, from 75 only numbers. ' +
    'teken-kiezen from 15 (nothing leaves and it is still −), numberline-gap from 35 (the ' +
    'difference as a distance), rekenverhaal from 60 (the question in words alone). A ' +
    'difference of 0 is kept but made rarer: everyone has a partner. Weights are initial guesses.',
  'getalfamilie-5':
    'Built except the third tier of familie-sommen; gated (Nov 2026). One family, every view. puntoefening owns the entry (40 → 15): "2 + . = 5" with the ' +
    'target drawn (5 places, 2 filled), then flashed, then bare, then the open place first, ' +
    'then in a − sum. familie-sommen (25 → 30 → 20) is the core: a huisje, three number tiles ' +
    'and the four sums to complete, later (40) to lay with both numbers before the = open. ' +
    'splits-ontbreken-rechts keeps a small share as the same question in split notation. ' +
    'numberline-gap from 20 (going up to find the difference), teken-kiezen low, rekenverhaal ' +
    'from 60 with the deel-geheel and aanvullen stories; snel-weten from 65, asking ' +
    'any view. Weights are initial guesses pending playtesting.',
  '-1-2-tot-10':
    'PLAN (Nov 2026) — wired with first-guess weights, never played; the skill is not open. ' +
    'Mirror of +1-2-tot-10, leaning harder on the number line: the backward row above 5 is the ' +
    'weak spot, and numberline-jump-back (30 → 6) is where it gets practised. doosje (25 → 5) ' +
    'hides the whole, so stepping back from the number on the lid is the only route; flits-som ' +
    'shows the crossed-out picture for a moment; wegnemen-crossed-out keeps a small share as ' +
    'the standing picture. Middle: omkeer-som from 30 (7 + 2 = 9, dus 9 − 2) and huisje-som ' +
    'from 35 tie the differences to sums and splits; choice, tf, fill-plain. Post-60: ' +
    'rekenverhaal and snel-weten. About 30% of the draws refresh the differences within 5. ' +
    'The tot-10 line works as for +: one bow, the landing answered on the number strip.',
  '-3-4-tot-10':
    'PLAN (Nov 2026) — wired with first-guess weights, never played; the skill is not open. ' +
    'Counting back three or four is the weakest counting there is, so the difference comes ' +
    'from the family. huisje-som leads (35 → 10): "9 is 4 en 5, dus 9 − 4 = 5", the house given. ' +
    'omkeer-som comes early (from 15, 20 at 40): 5 + 4 = 9, dus 9 − 4 — the sum the child knows ' +
    'answers the difference; its buur tier asks 9 − 3 after 9 − 4. flits-som shows the ' +
    'crossed-out picture in the 5-structure for a moment; wegnemen-crossed-out keeps a small ' +
    'share as the standing picture. teken-kiezen low, choice throughout, tf and fill-plain ' +
    'from 40, post-60 rekenverhaal and snel-weten. No number line and no doosje: both are ' +
    'counting back. No two steps through the five (som-in-stappen): not in the sources read.',
  'aftrekken-wegnemen-10': TODO,
  'aftrekken-verschil-10': TODO,
  'getalfamilie-10': TODO,
}

export function getExercisePlan(skillId: string): string {
  return EXERCISE_PLAN[skillId] ?? TODO
}

// Skill ids that have no entry at all (a stricter check than "is it still TODO").
// Reported through validate.ts alongside the other curriculum checks.
export function missingExercisePlanIds(): string[] {
  return SKILLS.filter(s => !(s.id in EXERCISE_PLAN)).map(s => s.id)
}
