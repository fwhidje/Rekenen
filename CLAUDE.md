# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition + subtraction + splitsen (v2). React + Vite + TypeScript.

---

## Long-term backlog

- **Skill / exercise introduction flow** — when a new skill unlocks or a new exercise type is encountered for the first time, show a brief intro so the child knows what to do. Could be a short animation, a "Nieuw!" badge, or a guided first attempt.
- **Themed sessions** — lock a visual theme (background + item/emoji set) for a session or N rounds instead of randomising per question. Keeps the visual context consistent and less distracting.

---

## ★ NEXT SESSION TASK — Round 2: implement all exercise types

**Branch**: `claude/general-session-N7TgS`

Round 1 (done): curriculum data, engine, DebugMode. All 21 skills defined in `skills.ts`. Seven exercise types exist as stubs or partial implementations. **Round 2 goal: implement every exercise type so each is fully playable in DebugMode.**

### What exists already (7 types)

| ID | File | Status |
|---|---|---|
| `fill-vis` | `src/exercises/FillVisual.tsx` | Works for `+` only — needs `-`, `split`, `count`, `half` |
| `fill-plain` | `src/exercises/FillPlain.tsx` | Works for `+` only — same |
| `choice` | `src/exercises/Choice.tsx` | Works for `+` only — same |
| `tf` | `src/exercises/TrueFalse.tsx` | Works for `+` only — same |
| `collect-tap` | `src/exercises/CollectTap.tsx` | Works for `+` only — same |
| `collect-counter` | `src/exercises/CollectCounter.tsx` | Works for `+` only — same |
| `numberline-jump` | `src/exercises/NumberLine.tsx` | Works for `+` only — same |

The `op` field on `ExerciseQuestion` tells each exercise what operation it's showing. All exercises must branch on `op` to render correctly for subtraction (`-`), splitsen (`split`), count (`count`), and half (`half`) skills.

### What needs building (new files, 23 types)

Build in this order — each group reuses primitives introduced by the previous:

**Pass 1 — number-sense primitives** (new presentation components, no arithmetic):
1. `count-and-tap` → `src/exercises/CountAndTap.tsx`
2. `dot-pattern-recognise` → `src/exercises/DotPatternRecognise.tsx`
3. `finger-pattern-recognise` → `src/exercises/FingerPatternRecognise.tsx`
4. `numberline-place` → `src/exercises/NumberlinePlace.tsx`
5. `compare-more-less` → `src/exercises/CompareMoreLess.tsx`
6. `ten-frame-show` → `src/exercises/TenFrameShow.tsx`
7. `rekenrek-show` → `src/exercises/RekenrekShow.tsx`

**Pass 2 — splitsen family** (shared splitshuisje / splitsbenen shapes go in `src/presentation/components/`):
8. `splitshuisje` → `src/exercises/Splitshuisje.tsx`
9. `splitsbenen` → `src/exercises/Splitsbenen.tsx`
10. `splits-ontbreken-rechts` → `src/exercises/SplitsOntbrekenRechts.tsx`
11. `splits-ontbreken-links` → `src/exercises/SplitsOntbrekenLinks.tsx`
12. `splits-vrij` → `src/exercises/SplitsVrij.tsx`
13. `splits-alle` → `src/exercises/SplitsAlle.tsx`
14. `dot-pattern-decompose` → `src/exercises/DotPatternDecompose.tsx`
15. `rekenrek-decompose` → `src/exercises/RekenrekDecompose.tsx`

**Pass 3 — fix existing 7 for non-`+` ops** (FillVisual, FillPlain, Choice, TF, CollectTap, CollectCounter, NumberLine):
- Branch on `question.op` to show correct equation format per operation
- `-`: show `a − b = ?`; `split`: show `a + b = ?` or `total = ? + ?`; `count`: show `Hoeveel?`; `half`: show `helft van a = ?`

**Pass 4 — optellen extras**:
16. `rekenrek-add` → `src/exercises/RekenrekAdd.tsx`
17. `dubbel-recognise` → `src/exercises/DubbelRecognise.tsx`

**Pass 5 — aftrekken-specific**:
18. `wegnemen-crossed-out` → `src/exercises/WegnemenCrossedOut.tsx`
19. `verschil-two-groups` → `src/exercises/VerschilTwoGroups.tsx`
20. `verschil-rekenrek` → `src/exercises/VerschilRekenrek.tsx`
21. `aanvullen-target` → `src/exercises/AanvullenTarget.tsx`
22. `numberline-jump-back` → `src/exercises/NumberlineJumpBack.tsx`
23. `numberline-jump-up-from-b` → `src/exercises/NumberlineJumpUpFromB.tsx`
24. `collect-counter-down` → `src/exercises/CollectCounterDown.tsx`

**Pass 6 — tienvrienden & helften**:
25. `tienveld-fill` → `src/exercises/TienveldFill.tsx`
26. `rekenrek-make-ten` → `src/exercises/RekenrekMakeTen.tsx`
27. `splits-helft` → `src/exercises/SplitsHelft.tsx`

### Per-exercise ritual

1. Create the file, implement, register via `registerExercise()`
2. Add its id to `src/exercises/index.ts`
3. Add a weight entry in `src/curriculum/weightMatrix.ts` (so it actually gets picked)
4. Run `npm run typecheck` — fix any errors
5. Test in DebugMode at scores 0, 25, 50 — check reveal/input/feedback all work
6. Commit: `feat: add <exercise-id> exercise`

### Adding weights

When adding new exercise types, add them to `src/curriculum/weightMatrix.ts`. The current file only has weights for the 7 existing types — new types default to 0 and won't be picked until you add them. For number-sense exercises a simple flat weight of ~20 across all scores is fine for now; Round 3 will tune per-skill.

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
