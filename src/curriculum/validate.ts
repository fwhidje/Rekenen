import { SKILLS } from './skills'
import { getWeights, getSkillTableIds } from './weightMatrix'
import { missingExercisePlanIds } from './exercisePlan'
import { getAllExerciseIds } from '../exercises/registry'

// ─── Curriculum validation ────────────────────────────────────────────────────
// The lists that must agree — applicableExercises, the exercise registry, the
// weight tables, EXERCISE_PLAN — are owned by different files and rot apart
// silently (a weighted typo never plays; a built exercise without a weight is
// dead). This module makes the disagreements loud in dev. It must run AFTER
// all registerExercise() calls, so it is imported at the end of
// src/exercises/index.ts.

function everWeighted(skillId: string, exId: string): boolean {
  for (let score = 0; score <= 100; score++) {
    if ((getWeights(skillId, score)[exId] ?? 0) > 0) return true
  }
  return false
}

export function validateCurriculum(): string[] {
  const warnings: string[] = []
  const registered = new Set(getAllExerciseIds())

  for (const skill of SKILLS) {
    const applicable = new Set(skill.applicableExercises)

    // Explicit weight tables must agree with the skill definition and registry.
    const tableIds = getSkillTableIds(skill.id)
    if (tableIds) {
      for (const exId of tableIds) {
        if (!applicable.has(exId)) {
          warnings.push(`${skill.id}: '${exId}' is weighted but not in applicableExercises — it will never be picked`)
        }
        if (!registered.has(exId)) {
          warnings.push(`${skill.id}: '${exId}' is weighted but not registered (typo, or exercise not built?)`)
        }
      }
    }

    // WIP-gated skills are expected to be incomplete; the checks below would
    // only repeat what the disabled flag already says.
    if (skill.disabled) continue

    // Built but dead: registered and applicable, yet zero weight on the whole
    // curve — the exercise exists and will never play for this skill.
    const playable: string[] = []
    for (const exId of skill.applicableExercises) {
      if (!registered.has(exId)) continue // not built (yet) — fine, selector skips it
      if (everWeighted(skill.id, exId)) playable.push(exId)
      else warnings.push(`${skill.id}: '${exId}' is registered but has zero weight across the whole curve (dead exercise)`)
    }

    // No gate families at all: the skill can't be played or pass 'par', so it
    // would silently block everything downstream of it.
    if (playable.length === 0) {
      warnings.push(`${skill.id}: no applicable exercise is both registered and weighted — skill is unplayable and can never reach par`)
    }
  }

  for (const id of missingExercisePlanIds()) {
    warnings.push(`${id}: no EXERCISE_PLAN entry`)
  }

  return warnings
}

if (import.meta.env?.DEV) {
  for (const w of validateCurriculum()) {
    console.warn('[curriculum]', w)
  }
}
