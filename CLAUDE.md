# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition + subtraction + splitsen (v2). React + Vite + TypeScript.

---

## Long-term backlog

- **Skill / exercise introduction flow** — when a new skill unlocks or a new exercise type is encountered for the first time, show a brief intro so the child knows what to do. Could be a short animation, a "Nieuw!" badge, or a guided first attempt.
- **Themed sessions** — lock a visual theme (background + item/emoji set) for a session or N rounds instead of randomising per question. Keeps the visual context consistent and less distracting.

## Parked — needs design review before implementing

- **`rekenrek-show`** — currently listed in `getalbegrip-5` / `getalbegrip-10` applicableExercises but not registered, not weighted, and not implemented. Open question: is "how many beads on the rekenrek?" actually a useful exercise for plain counting, or does the rekenrek only earn its keep in the splitsen-5 / splitsen-10 skills where the 5-structure split is the whole point? Revisit after looking at how Dutch teaching materials use the rekenrek at this age — likely either drop from getalbegrip or redesign as a structure-recognition exercise. Same question applies to any future `rekenrek-*` variants.

---

## WIP gate — disabled skills

A skill marked `disabled: true` in `skills.ts` is hidden from rotation **and** never satisfies downstream prerequisites. The flag cascades — disabling a subtree's root keeps its entire subtree gated, no need to mark each leaf.

`SkillDefinition.disabled` is honoured in two places:
- `engine/unlockEvaluator.ts` — disabled skills never become unlocked; disabled prereqs are never considered satisfied.
- `engine/exerciseSelector.ts` — disabled skills are filtered out before picking.

### Currently active

- `getalbegrip-5`
- `getalbegrip-10`
- `splitsen-tot-5`
- `splitsen-tot-10`

### Currently gated (5 subtree roots)

| Skill id | Gates | Lift when |
|---|---|---|
| `+1-2-tot-5` | the whole `optellen` family (tot-5 and tot-10) | optellen exercises reworked and tested for `+` |
| `-1-2-tot-5` | the whole `aftrekken` family (tot-5 and tot-10) | aftrekken-specific exercises built |
| `tienvrienden` | tienvrienden drill | `tienveld-fill` / `rekenrek-make-ten` built |
| `optellen-tot-10` | `dubbels-tot-10`, `helften-tot-10` (also unlocked from this) | optellen-tot-10 verified end-to-end |
| `aftrekken-wegnemen-10` | `aftrekken-verschil-10`, `aftrekken-aanvullen-10` | aftrekken-10 verified |

To open up the next branch: remove `disabled: true` from one of the rows above. Downstream stays gated until *its* root is also lifted (the cascade is automatic).

---

## Design principle — exercises are theme-agnostic

Exercise components must never hardcode palette values. All colours come from
`scene.tokens` (type `SceneTokens`, defined in `src/presentation/tokens.ts`).
Use `NATURE_TOKENS` as the fallback when no scene is provided.

```ts
const { ink, paper, cream, accent, confirm, ... } = scene?.tokens ?? NATURE_TOKENS
```

Shared UI components (`NumPad`, `ChoiceButtons`, `TFButtons`) accept an optional
`tokens` prop and default to `NATURE_TOKENS`. Exercises pass `scene?.tokens` through.

The `scene` prop on every exercise component carries:
- `Counter` — the current theme's creature component
- `containerBg` — background tint for counter areas
- `tokens` — full `SceneTokens` colour set

A new theme only requires: new `SceneTokens`, new counter SVGs, new background
components. No exercise file needs to change.

---

## ★ Round 2 progress — implement all exercise types

**Branch**: `claude/review-repo-setup-aokOj`

Round 1 (done): curriculum data, engine, DebugMode. All 21 skills defined in `skills.ts`.
Round 2 goal: every exercise type fully playable in DebugMode, weight matrix tuned per skill.

### Procedure (per skill)

1. For each exercise in the skill's `applicableExercises`: implement if missing, or test if already scripted.
2. Discuss any layout/design questions before building.
3. Tune the skill's weight table in `weightMatrix.ts` (add a named entry to `SKILL_TABLES`).
4. Commit and push. Then move to the next skill.

### Skill status

| Skill | Exercises | Matrix |
|---|---|---|
| `getalbegrip-5` | ✅ all tested | ✅ tuned |
| `getalbegrip-10` | ✅ all tested (same exercises as -5, handles 1–10) | ✅ tuned |
| `splitsen-tot-5` | 🔲 Pass 2 exercises not yet built | 🔲 |
| `splitsen-tot-10` | 🔲 | 🔲 |
| `tienvrienden` | 🔲 Pass 6 | 🔲 |
| `+1-2-tot-5` and all optellen | 🔲 Pass 3 (fix existing 7 for non-`+` ops) | 🔲 |
| all aftrekken skills | 🔲 Pass 5 | 🔲 |
| `dubbels-tot-10`, `helften-tot-10` | 🔲 Pass 4 / Pass 6 | 🔲 |

### Exercise file status

| ID | File | Status |
|---|---|---|
| `count-and-tap` | `CountAndTap.tsx` | ✅ done |
| `dot-pattern-recognise` | `DotPatternRecognise.tsx` | ✅ done |
| `finger-pattern-recognise` | `FingerPatternRecognise.tsx` | ✅ done |
| `numberline-place` | `NumberlinePlace.tsx` | ✅ done |
| `compare-more-less` | `CompareMoreLess.tsx` | ✅ done |
| `ten-frame-show` | `TenFrameShow.tsx` | ✅ done |
| `rekenrek-show` | — | 🅿️ parked (see above) |
| `fill-vis` | `FillVisual.tsx` | ⚠️ `+` only — needs `-`, `split`, `count`, `half` |
| `fill-plain` | `FillPlain.tsx` | ⚠️ `+` only |
| `choice` | `Choice.tsx` | ⚠️ `+` only |
| `tf` | `TrueFalse.tsx` | ⚠️ `+` only |
| `collect-tap` | `CollectTap.tsx` | ⚠️ `+` only |
| `collect-counter` | `CollectCounter.tsx` | ⚠️ `+` only |
| `numberline-jump` | `NumberLine.tsx` | ⚠️ `+` only |
| splitsen family (8 types) | — | 🔲 not built |
| optellen extras (2 types) | — | 🔲 not built |
| aftrekken-specific (7 types) | — | 🔲 not built |
| tienveld / rekenrek-make-ten / splits-helft | — | 🔲 not built |

### Per-exercise ritual

1. Create the file, implement, register via `registerExercise()`
2. Add its id to `src/exercises/index.ts`
3. Add or update the skill's weight table in `src/curriculum/weightMatrix.ts`
4. Run `npm run typecheck` — fix any errors
5. Test in DebugMode
6. Commit: `feat: add <exercise-id> exercise`

### Adding weights

`weightMatrix.ts` uses per-skill `SKILL_TABLES`. Add a named entry with `[low, high]` lerp pairs or a flat number. Skills without a table fall back to the default global curve.

---

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
| `src/curriculum/weightMatrix.ts` | Per-skill weight tables (`SKILL_TABLES`); falls back to default global curve for untuned skills |
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
