# Rekenen v2 — Core Logic Model

> **⚠ FROZEN — historical decision record.** This note captures the core-logic
> model as originally designed and is no longer maintained. Current truth lives
> in `CLAUDE.md` (engine model + implementation status) and
> `rekenen_v2_skill_exercise_map.md` (curriculum design). Known deltas since
> the engine-foundations rework (June 2026):
>
> 1. Unlocking is **no longer score-threshold-based** — a skill unlocks when all
>    prerequisites reach the `par` mastery milestone (per-exercise-family
>    accuracy over the persisted answer stream, `src/engine/mastery.ts`). The
>    0–100 score remains as the scaffolding dial only.
> 2. Per-question answer records are persisted per profile (localStorage).
> 3. A wrong answer triggers a re-scaffolded retry of the same problem.
> 4. Generators return a typed `Problem` (named roles per operation), not `{a, b, op}`.

Reference for all subsequent discussion of curriculum / skill / scoring logic.
The previous 4-level model is **abandoned** and should not be used as a framework.

## The model

- **Skills are atomic and narrow**, defined as data with an unlock graph between them.
  Example: `"+1/+2 within 5"` is one skill. `"+3/+4 within 5"` is another. `"+1/+2 within 10"` is another.

- **Each skill carries its own 0–100 score.** Score goes up on correct answer, down on wrong answer.

- **Unlocks are one-way.** A dropping score only changes presentation *within* that skill — it never re-locks downstream skills that have already been unlocked.

- **Score-to-exercise-type weighting is where difficulty lives.**
  - Low score → scaffolded types (visual representation, collect mechanic, sequential reveal, etc.)
  - High score → ~80% plain sums, no frills
  - Capped skills (score = 100) stay in rotation, pinned at the top of that distribution.

- **The skill's math definition never moves with the score.**
  `"+1/+2 within 5"` stays `"+1/+2 within 5"` forever. Only the presentation around it shifts as score changes.

## What this means for data shape

The curriculum is two pieces of data:

1. **The skill graph** — which skill unlocks which.
2. **The score → exercise-type-weight mapping** — how presentation shifts with mastery.

Everything else (question generator, scheduler, eventual repetition tracker, debug view) is engine code that operates on those two tables.

## Decided

- **Initial score on unlock**: 0. Every newly unlocked skill starts at maximum scaffolding.
- **Unlock threshold**: earlier than 100 — provisional value ~50, exposed as a global tweakable. Real value depends on how the skill/exercise matrix ends up designed. Skills overlap: when a skill hits the threshold its successors become available while it continues scoring up to 100.

## Open / parked

- **Scheduler** (how to pick between active unlocked skills) — parked, not core for now.
- **Repetition / spaced revisit tracker** — separate concern, not part of the score system.
