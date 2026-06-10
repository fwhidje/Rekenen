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
    'Leads with count-and-tap (weight 40→5): at low score the child still counts concretely, ' +
    'so tapping items one by one is the right support. As the score climbs the weight shifts to ' +
    'dot-pattern-recognise (5→30) and ten-frame-show (10→25): structured, subitisable arrangements ' +
    'that reward seeing a quantity at a glance rather than counting it. compare-more-less stays a ' +
    'constant 15 throughout as an orthogonal check on quantity comparison. The arc is ' +
    'concrete counting → structured perception.',
  'getalbegrip-10':
    'Same shape as getalbegrip-5 but across 1–10, leaning harder on the 5-structure presentations ' +
    '(ten-frame, rekenrek) as the score rises so 6–10 are perceived via the 5-anchor instead of ' +
    'counted by ones.',
  'splitsen-herken-5':
    'Seven recognition exercises share the rotation. Early: splits-herken-huisje dominates (40, the ' +
    'canonical scaffold) with dot-pattern-decompose (30), splits-build-it (25, enactive swipe-to-cut) ' +
    'and splits-frame (20). As the score rises the width probes phase in and the early scaffolds ' +
    'fade: splits-shuffle (conservation, from 10), same-split-or-different (order-independence, from ' +
    '20), splits-match (representational transfer, from 30, up to 30 by 70). Each exercise also ramps ' +
    'its own internal tiers, so cross-exercise weights shift the *kind* of thinking while ' +
    'within-exercise tiers fade the scaffolding. rekenrek-decompose is listed but not yet built. ' +
    'Weights are initial guesses pending playtesting.',

  // Notation + later branches — fill as exercises are built.
  'splitsen-noteren-5': TODO,
  'splitsen-tot-10': TODO,
  'tienvrienden': TODO,
  '+1-2-tot-5': TODO,
  'optellen-tot-5': TODO,
  '+1-2-tot-10': TODO,
  '+3-4-tot-10': TODO,
  'optellen-tot-10': TODO,
  'dubbels-tot-10': TODO,
  'helften-tot-10': TODO,
  '-1-2-tot-5': TODO,
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
