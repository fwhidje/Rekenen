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
    'Three recognition exercises share the rotation (currently ~34/33/33): dot-pattern-decompose, ' +
    'splits-frame, and splits-herken-huisje. Each ramps its own internal tiers with score (die-based ' +
    'tap → numbered choice → abstract), so the cross-exercise weights stay roughly even while the ' +
    'within-exercise scaffolding fades. rekenrek-decompose is listed but not yet weighted/built.',

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
export function missingExercisePlanIds(): string[] {
  return SKILLS.filter(s => !(s.id in EXERCISE_PLAN)).map(s => s.id)
}

if (import.meta.env?.DEV) {
  const missing = missingExercisePlanIds()
  if (missing.length > 0) {
    console.warn('[exercisePlan] skills with no EXERCISE_PLAN entry:', missing)
  }
}
