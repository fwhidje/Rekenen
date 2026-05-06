# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition + subtraction + splitsen (v2). React + Vite + TypeScript.

## Reference docs (in repo root)

- **`rekenen_v2_skill_exercise_map.md`** — authoritative skill graph, exercise type catalog, error taxonomy. **Takes precedence over older docs** when there's any conflict.
- `rekenen_v2_app_design.md` — app-level design (deployment, persistence, modes).
- `core_logic.md` — original logic model summary (mostly absorbed into the skill map).

## Core model (read first)

Skills are narrow and atomic. Each carries a 0–50 score. The score controls which *exercise type* is chosen (via the weight matrix), not the math the skill covers.

Three independent skill relationships:
- **`unlockedBy`** — list of prereq skill ids; ALL must be ≥ UNLOCK_THRESHOLD before this skill becomes available.
- **`unlocks`** — inverse, kept for readability; the engine derives behaviour from `unlockedBy` only.
- **`subsumedBy`** — single parent skill; when this skill caps at 50 AND the parent is unlocked, this skill is archived (removed from rotation, score preserved). `null` means never archive (typically fact-recall: tienvrienden, dubbels, helften).

A skill's `op` is one of `'+' | '-' | 'split' | 'count' | 'half'`. Each skill has a `generate()` function returning `{ a, b, op }`. Archived skills still count as unlocked for downstream prerequisite checks.

## Module map

| Path | Responsibility |
|---|---|
| `src/curriculum/types.ts` | `SkillDefinition`, `Operation`, `WeightFunction` types |
| `src/curriculum/skills.ts` | All 21 skill definitions (data — add new skills here) |
| `src/curriculum/weightMatrix.ts` | Score → exercise-type weights (placeholder global curve; round 3 will replace with per-skill tables) |
| `src/engine/scoring.ts` | applyCorrect / applyWrong / SCORE_MAX / UNLOCK_THRESHOLD |
| `src/engine/unlockEvaluator.ts` | Multi-prereq AND unlock evaluator |
| `src/engine/subsumeEvaluator.ts` | Archive evaluator (capped child + unlocked parent) |
| `src/engine/exerciseSelector.ts` | Picks skill + exercise, generates question |
| `src/exercises/types.ts` | **ExerciseDefinition** interface — the OO contract |
| `src/exercises/registry.ts` | Global exercise registry (Map) |
| `src/exercises/index.ts` | Imports all exercise files to trigger registration |
| `src/exercises/FillVisual.tsx` | `fill-vis` — visual fill (dots / scene groups) |
| `src/exercises/FillPlain.tsx` | `fill-plain` — plain numpad |
| `src/exercises/Choice.tsx` | `choice` — 4-option multiple choice |
| `src/exercises/TrueFalse.tsx` | `tf` — Waar / niet waar? |
| `src/exercises/CollectTap.tsx` | `collect-tap` — tap items into a basket (low score) |
| `src/exercises/CollectCounter.tsx` | `collect-counter` — +/− counter (mid score) |
| `src/exercises/NumberLine.tsx` | `numberline-jump` — number line + choice buttons |
| `src/presentation/scenes.ts` | SCENES array + pickScene / pickColors helpers |
| `src/presentation/useReveal.ts` | Hook for timed sequential reveal |
| `src/presentation/components/` | DotGroup, SceneGroup |
| `src/state/types.ts` | Profile, AppState, SkillState (with `archived`) |
| `src/state/storage.ts` | localStorage load/save, `recordAnswer()` with cascade |
| `src/ui/App.tsx` | Root: profile boot, screen routing |
| `src/ui/KidMode.tsx` | Full-screen exercise loop |
| `src/ui/AdminMode.tsx` | Profile management |
| `src/ui/components/` | NumPad, ChoiceButtons, TFButtons |

## Adding a new exercise type

1. Create `src/exercises/MyExercise.tsx` with a typed `Meta` interface, a component, and call `registerExercise(...)`.
2. Import it in `src/exercises/index.ts`.
3. Reference its id in any skill's `applicableExercises` in `skills.ts`.
4. Add a weight in `src/curriculum/weightMatrix.ts` (or skip — defaults to 0 = never picked).

## Adding a new skill

1. Add a `SkillDefinition` entry in `src/curriculum/skills.ts`. All fields required, including `intent` description, `unlockedBy`, `unlocks`, `subsumedBy`, `applicableExercises`, and `generate()`.
2. No code changes needed.

## Dev commands

```
npm run dev       # Vite dev server (hot reload)
npm run typecheck # tsc --noEmit
npm run build     # production build
```

## Exercise invariants (locked)

- **The equation is always visible.** Every exercise shows the operation — no exceptions.
- **Reveal exercises build the equation piece by piece on a timer.** The sequence is: visual group A → `+` → visual group B → number A → `+` → number B → `= ?`. The child watches, input is locked until complete.
- **Reveal detail is each exercise's own concern.** Which steps are included and their timing depends on exercise type and score. High score → no reveal, equation is instant.
- **The visual is an illustration, not a gate.** Dots/scenes appear alongside their number, not instead of it.

## Key decisions (locked)

- Multi-profile from day one, localStorage (storage.ts is the only layer to swap for a backend)
- No audio in v2
- Subtraction is in scope for v2 (curriculum includes both addition and subtraction skills)
- No hidden admin — plain ⚙️ Opties button, kids can see it, no harm done
- Art direction parked — UI separated from logic for easy reskin
- Error tagging deferred to a later round (per-question records aren't captured yet)
