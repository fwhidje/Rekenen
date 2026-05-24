# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition + subtraction + splitsen (v2). React + Vite + TypeScript.

---

## Long-term backlog

- **Skill / exercise introduction flow** — when a new skill unlocks or a new exercise type is encountered for the first time, show a brief intro so the child knows what to do. Could be a short animation, a "Nieuw!" badge, or a guided first attempt.
- **Themed sessions** — lock a visual theme (background + item/emoji set) for a session or N rounds instead of randomising per question. Keeps the visual context consistent and less distracting.

## Parked — needs design review before implementing

- **`rekenrek-show`** — currently listed in `getalbegrip-5` / `getalbegrip-10` applicableExercises but not registered, not weighted, and not implemented. Open question: is "how many beads on the rekenrek?" actually a useful exercise for plain counting, or does the rekenrek only earn its keep in the splitsen-5 / splitsen-10 skills where the 5-structure split is the whole point? Revisit after looking at how Dutch teaching materials use the rekenrek at this age — likely either drop from getalbegrip or redesign as a structure-recognition exercise. Same question applies to any future `rekenrek-*` variants.

- **Five getalbegrip exercise skeletons** — `number-sequence-order`, `show-me-on-ten-frame`, `numberline-read`, `quantity-match`, `subitise-flash`. The files exist under `src/exercises/` with full didactics + tiers declared, and the ids are wired into `getalbegrip-5` / `getalbegrip-10` applicableExercises, but each has a placeholder `Component` and stub `generateMeta` and is **not** imported in `index.ts` — so they don't register and the selector skips them. Implement (real component + generateMeta), add the `index.ts` import, and give each a weight in `weightMatrix.ts` to bring online.

---

## WIP gate — disabled skills

A skill marked `disabled: true` in `skills.ts` is hidden from rotation **and** never satisfies downstream prerequisites. The flag cascades — disabling a subtree's root keeps its entire subtree gated, no need to mark each leaf.

`SkillDefinition.disabled` is honoured in two places:
- `engine/unlockEvaluator.ts` — disabled skills never become unlocked; disabled prereqs are never considered satisfied.
- `engine/exerciseSelector.ts` — disabled skills are filtered out before picking.

### Currently active

- `getalbegrip-5`
- `getalbegrip-10`
- `splitsen-herken-5`

### Currently gated (6 subtree roots)

| Skill id | Gates | Lift when |
|---|---|---|
| `splitsen-noteren-5` | parallel notation track (no downstream gating in v2) | notation exercises (splitshuisje, splitsbenen, splits-vrij/-ontbreken-*/-alle) built |
| `splitsen-tot-10` | `tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10` downstream | splitsen-tot-10 exercises built |
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

Round 1 (done): curriculum data, engine, DebugMode. All 22 skills defined in `skills.ts` (splitsen-tot-5 split into herken/noteren halves).
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
| `splitsen-herken-5` | ✅ `dot-pattern-decompose` + `splits-frame` + `splits-herken-huisje` done; `rekenrek-decompose` listed but not implemented | 🟡 partial (34/33/33 across 3 herken exercises; rekenrek-decompose at 0) |
| `splitsen-noteren-5` *(disabled — no exercises built)* | 🔲 notation family not built (splitshuisje, splitsbenen, splits-vrij, splits-ontbreken-rechts/links, splits-alle) | 🔲 |
| `splitsen-tot-10` *(TBD: split like tot-5?)* | 🔲 | 🔲 |
| `tienvrienden` | 🔲 Pass 6 | 🔲 |
| `+1-2-tot-5` and all optellen | 🔲 **Next stop** — lift WIP gate, fix 7 exercise types for `+` op, tune matrix | 🔲 |
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
| `dot-pattern-decompose` | `DotPatternDecompose.tsx` | ✅ done (4 reveal stages: die-die / die-numchoice / num-num / all-num at score 0/24/50/74) |
| `splits-frame` | `SplitsFrame.tsx` | ✅ done (3 tiers: die-tap / num-tap / num-pad at score 0/30/70; `isCompatible` rejects a=0 or b=0) |
| `splits-herken-huisje` | `SplitsHerkenHuisje.tsx` | ✅ done (4 tiers: die-both drag / die-one choose / die-numaid choose / num-two choose at score 0/24/50/74; drag-and-drop via pointer events) |
| `rekenrek-show` | — | 🅿️ parked (see above) |
| `dot-pattern-decompose-pad` | — | 🅿️ parked — numpad variant of dot-pattern-decompose at score ≥ 24; uncertain whether worth a separate type (see skill map) |
| `fill-vis` | `FillVisual.tsx` | ⚠️ `+` only — needs `-`, `split`, `count`, `half` |
| `fill-plain` | `FillPlain.tsx` | ⚠️ `+` only |
| `choice` | `Choice.tsx` | ⚠️ `+` only |
| `tf` | `TrueFalse.tsx` | ⚠️ `+` only |
| `collect-tap` | `CollectTap.tsx` | ⚠️ `+` only |
| `collect-counter` | `CollectCounter.tsx` | ⚠️ `+` only |
| `numberline-jump` | `NumberLine.tsx` | ⚠️ `+` only |
| splitsen notation family (6 types: splits-vrij, splits-ontbreken-rechts/links, splits-alle, splitshuisje, splitsbenen) | — | 🔲 not built — **Next stop** (skill `splitsen-noteren-5` is split out and disabled; lift WIP gate once any of these are built) |
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

Skills are narrow and atomic. Each carries a 0–100 score (unlock at 60, archive at 100). The score controls which *exercise type* is chosen (via the weight matrix), not the math the skill covers.

Three independent skill relationships:
- **`unlockedBy`** — list of prereq skill ids; ALL must be ≥ UNLOCK_THRESHOLD before this skill becomes available.
- **`unlocks`** — inverse, kept for readability; the engine derives behaviour from `unlockedBy` only.
- **`subsumedBy`** — single parent skill; when this skill caps at 100 AND the parent is unlocked, this skill is archived (removed from rotation, score preserved). `null` means never archive (typically fact-recall: tienvrienden, dubbels, helften).

A skill's `op` is one of `'+' | '-' | 'split' | 'count' | 'half'`. Each skill has a `generate()` function returning `{ a, b, op }`. Archived skills still count as unlocked for downstream prerequisite checks.

## Module map

| Path | Responsibility |
|---|---|
| `src/curriculum/types.ts` | `SkillDefinition` (incl. `didactics`, `semanticForm`), `SkillDidactics`, `SemanticForm`, `Operation`, `WeightFunction` types |
| `src/curriculum/skills.ts` | All skill definitions (data — add new skills here) |
| `src/curriculum/weightMatrix.ts` | Per-skill weight tables (`SKILL_TABLES`); falls back to default global curve for untuned skills |
| `src/curriculum/exercisePlan.ts` | Per-skill exercise-progression narrative (`EXERCISE_PLAN`) — the "why this order" doc layer over the weight curves; coverage-checked |
| `src/engine/scoring.ts` | applyCorrect / applyWrong / SCORE_MAX / UNLOCK_THRESHOLD |
| `src/engine/diagnostics.ts` | `AnswerRecord`, `ErrorType`, `classifyError`, `DiagnosticsSink` (+ in-memory singleton `diagnostics`). Per-question capture; persistence deferred |
| `src/engine/unlockEvaluator.ts` | Multi-prereq AND unlock evaluator |
| `src/engine/subsumeEvaluator.ts` | Archive evaluator (capped child + unlocked parent) |
| `src/engine/exerciseSelector.ts` | Picks skill + exercise, generates question |
| `src/exercises/types.ts` | **ExerciseDefinition** interface — the OO contract. Carries `tiers` (declared scaffolding levels) and `didactics`; optional `isCompatible(a, b)` guard. Also `ExerciseTier`, `ExerciseDidactics`, `AnswerDetail` (the optional `onResolve` payload). |
| `src/exercises/tiers.ts` | Shared `pickTier(tiers, score)` — picks the active scaffolding tier (highest `minScore <= score`) |
| `src/exercises/registry.ts` | Global exercise registry (Map) |
| `src/exercises/index.ts` | Imports all exercise files to trigger registration |
| `src/exercises/DotPatternDecompose.tsx` | `dot-pattern-decompose` — perceptual splits exercise (4 stages, choice buttons, reveal animation) |
| `src/exercises/SplitsFrame.tsx` | `splits-frame` — joined-square frame, 3 tiers (die-tap / num-tap / num-pad) |
| `src/exercises/SplitsHerkenHuisje.tsx` | `splits-herken-huisje` — splitshuisje intro, house shape, drag-and-drop, 4 tiers |
| `src/exercises/FillVisual.tsx` | `fill-vis` — visual fill (dots / scene groups) |
| `src/exercises/FillPlain.tsx` | `fill-plain` — plain numpad |
| `src/exercises/Choice.tsx` | `choice` — 4-option multiple choice |
| `src/exercises/TrueFalse.tsx` | `tf` — Waar / niet waar? |
| `src/exercises/CollectTap.tsx` | `collect-tap` — tap items into a basket (low score) |
| `src/exercises/CollectCounter.tsx` | `collect-counter` — +/− counter (mid score) |
| `src/exercises/NumberLine.tsx` | `numberline-jump` — number line + choice buttons |
| `src/presentation/scenes.ts` | SCENES array + pickScene / pickColors helpers |
| `src/presentation/feedback.ts` | `FEEDBACK` config — process-praise copy + tone/timing (locked feedback constraints) |
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
2. Declare `const TIERS: ExerciseTier[]` (even a single `minScore: 0` tier). In `generateMeta`, derive the active tier with `pickTier(TIERS, score)` and stamp `meta.tierId = tier.id` — don't reintroduce an inline `pickStage`/threshold function. The component switches on the tier.
3. Fill `tiers` and `didactics` on the definition (see Blueprint). When the child answers, pass what you cheaply know via the optional `onResolve(correct, { givenAnswer, tapCount })` so diagnostics can classify.
4. Import it in `src/exercises/index.ts`.
5. Reference its id in any skill's `applicableExercises` in `skills.ts`.
6. Add a weight in `src/curriculum/weightMatrix.ts` (or skip — defaults to 0 = never picked).

## Adding a new skill

1. Add a `SkillDefinition` entry in `src/curriculum/skills.ts`. All fields required, including `intent` (one-line tagline), `didactics` (see Blueprint), `unlockedBy`, `unlocks`, `subsumedBy`, `applicableExercises`, and `generate()`. Set `semanticForm` for subtraction skills (`wegnemen` / `verschil` / `aanvullen`).
2. Add an `EXERCISE_PLAN[id]` entry in `src/curriculum/exercisePlan.ts` (a `TODO` stub is fine, but the key must exist — a dev warning fires if it's missing).
3. No other code changes needed.

## Blueprint — clean design for skills & exercises

The didactic + diagnostic fields are *required* and exist to make the curriculum legible and the data capturable. A `'TODO'` stub is an acceptable placeholder, but the field must be present and, once the skill/exercise is "done", actually filled.

**Where each piece lives (hybrid rule):** short structured facts that must stay honest with the code go *inline* on the definitions (`skills.ts`, the exercise file). The long-form cross-cutting narrative (the exercise-progression story) goes in the companion `exercisePlan.ts`. Don't move the inline facts out — they rot when separated from the code.

**Field dictionary:**
- Skill `didactics.startingPoint` — what the child can already do *entering* this skill (the assumed prerequisite ability, not the prereq skill id).
- Skill `didactics.goal` — what mastery looks like, concretely.
- Skill `didactics.pitfalls` — the top 1–3 errors/misconceptions to watch (these inform error tags).
- Skill `semanticForm` — subtraction flavour; drives the `semantic-narrow` classifier. Omit for non-subtraction.
- Exercise `didactics.goal` — what this presentation teaches/trains.
- Exercise `didactics.pitfalls` — misreads this *specific* presentation risks.
- Exercise `didactics.progression` — how the tiers scaffold concrete → abstract, and why that order.
- Exercise `tiers[].description` — what scaffolding *this* tier provides (one line per tier).
- `EXERCISE_PLAN[skillId]` — prose: which exercise dominates at low vs high score and why (documents the `weightMatrix.ts` curve). `intent` is a tagline; this is the paragraph.

**Clean design requires:**
- A skill states its starting point, its goal, and its top pitfalls — no empty `goal`/`startingPoint` once done.
- An exercise documents every tier's scaffolding intent and the concrete→abstract logic of their order.
- Scaffolding thresholds live in `TIERS`, never in an inline `if (score < n)` — and `generateMeta` stamps `tierId`.
- An exercise reports `givenAnswer` (and `tapCount` for multi-step) via `onResolve` wherever it cheaply can, so answers are classifiable.
- Every skill has an `EXERCISE_PLAN` entry.

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
