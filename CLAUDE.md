# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition + subtraction + splitsen (v2). React + Vite + TypeScript.

---

## Long-term backlog

- **Skill / exercise introduction flow** — when a new skill unlocks or a new exercise type is encountered for the first time, show a brief intro so the child knows what to do. Could be a short animation, a "Nieuw!" badge, or a guided first attempt.
- **Themed sessions** — lock a visual theme (background + item/emoji set) for a session or N rounds instead of randomising per question. Keeps the visual context consistent and less distracting.

## Parked — needs design review before implementing

- **`rekenrek-show`** — currently listed in `getalbegrip-5` / `getalbegrip-10` applicableExercises but not registered, not weighted, and not implemented. Open question: is "how many beads on the rekenrek?" actually a useful exercise for plain counting, or does the rekenrek only earn its keep in the splitsen-5 / splitsen-10 skills where the 5-structure split is the whole point? Revisit after looking at how Dutch teaching materials use the rekenrek at this age — likely either drop from getalbegrip or redesign as a structure-recognition exercise. Same question applies to any future `rekenrek-*` variants — `rekenrek-decompose` was removed from `splitsen-herken-5` for the same reason and stays listed only under `splitsen-tot-10`, where the 5-structure earns it.

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
- `+1-2-tot-5` (lifted June 2026 — its downstream `optellen-tot-5` chain is re-gated below until each gets its own tuning round, so the playtest stays scoped)
- `-1-2-tot-5` (lifted June 2026 — its downstream `aftrekken-wegnemen-5` chain is re-gated below until each gets its own tuning round)
- `splitsen-noteren-5` (lifted June 2026 — parallel notation track, gates nothing downstream in v2)

### Currently gated (6 subtree roots)

| Skill id | Gates | Lift when |
|---|---|---|
| `optellen-tot-5` | `+1-2-tot-10`, `+3-4-tot-10` downstream | optellen-tot-5 tuning round done |
| `aftrekken-wegnemen-5` | `aftrekken-verschil-5`, `aftrekken-aanvullen-5`, `-1-2-tot-10`, `-3-4-tot-10` downstream | aftrekken-wegnemen-5 tuning round done + verschil/aanvullen exercise types built |
| `splitsen-tot-10` | `tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10` downstream | splitsen-tot-10 exercises built |
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

Round 1 (done): curriculum data, engine, DebugMode. All 22 skills defined in `skills.ts` (splitsen-tot-5 split into herken/noteren halves).
Engine foundations (done, June 2026): persisted answer stream, retry-one-tier-down, typed `Problem`, dynamic per-exercise weight factors, curriculum validation, vitest suite — see Core model.
Round 2 goal: every exercise type fully playable in DebugMode, weight matrix tuned per skill.

### Procedure (per skill)

1. For each exercise in the skill's `applicableExercises`: implement if missing, or test if already scripted.
2. Discuss any layout/design questions before building.
3. Tune the skill's weight table in `weightMatrix.ts` (add a named entry to `SKILL_TABLES`).
4. Commit and push. Then move to the next skill.

### Skill status

| Skill | Exercises | Matrix |
|---|---|---|
| `getalbegrip-5` | ✅ all 12 live (incl. `compare-pick`); `rekenrek-show` parked | ✅ tuned |
| `getalbegrip-10` | ✅ all 12 live (same set; 6–10 via the 5-anchor, generator serves 6–10 at 70%) | ✅ tuned — diverged from -5 with a flat 5-structure lean |
| `splitsen-herken-5` | ✅ all 7 live and fallible (playtest round done: frame redesigned, build-it confirm step, shuffle rebuilt, match koppelen tier); `rekenrek-decompose` parked for tot-10 | 🟡 rebalanced after playtest — still initial guesses |
| `splitsen-noteren-5` | ✅ all 6 live, gate lifted (splitshuisje production, splitsbenen, ontbreken-rechts is-en→vergelijking, ontbreken-links post-60, vrij + nog-een variety round, alle table; unsplit-roof invariant everywhere) | 🟡 initial guesses |
| `splitsen-tot-10` *(TBD: split like tot-5?)* | 🔲 | 🔲 |
| `tienvrienden` | 🔲 Pass 6 | 🔲 |
| `+1-2-tot-5` | ✅ all 9 live, gate lifted (erbij-tap rework, fill-vis semantic variants + commutativity swap, numberline 3 tiers, tf strikt traps, op-generic symbolic trio, post-60 width pair splits-som-match + rekenverhaal) | 🟡 initial guesses |
| `optellen-tot-5` and later optellen | 🔲 reachable on the default curve; own tuning round pending | 🔲 |
| `-1-2-tot-5` | ✅ all 10 live, gate lifted (wegneem-tap, wegnemen-crossed-out, jump-back + counter-down twins, fill-vis − grammar live, tf reversal traps, post-60 width pair splits-som-match + rekenverhaal) | 🟡 initial guesses |
| `aftrekken-wegnemen-5` and later aftrekken | 🔲 reachable on the default curve (needs `optellen-tot-5` ≥ 60 too); own tuning round pending — verschil/aanvullen types not built | 🔲 |
| `dubbels-tot-10`, `helften-tot-10` | 🔲 Pass 4 / Pass 6 | 🔲 |

### Exercise file status

| ID | File | Status |
|---|---|---|
| `count-and-tap` | `CountAndTap.tsx` | ✅ done (2 phases: tap-count with running chip, then "hoeveel waren er?" choice — the cardinality probe; total never shown) |
| `dot-pattern-recognise` | `DotPatternRecognise.tsx` | ✅ done |
| `finger-pattern-recognise` | `FingerPatternRecognise.tsx` | ✅ done |
| `numberline-place` | `NumberlinePlace.tsx` | ✅ done |
| `compare-more-less` | `CompareMoreLess.tsx` | ✅ done (3 tiers: twee meer/minder → drie meest/minst → getallen; per-group counter size/gap de-confounds row length) |
| `compare-pick` | `ComparePick.tsx` | ✅ done (relation-to-anchor incl. evenveel; tiers beeld/getal at 0/60; relation recorded as `variant`) |
| `ten-frame-show` | `TenFrameShow.tsx` | ✅ done |
| `dot-pattern-decompose` | `DotPatternDecompose.tsx` | ✅ done (4 reveal stages: die-die / die-numchoice / num-num / all-num at score 0/24/50/74) |
| `splits-frame` | `SplitsFrame.tsx` | ✅ redesigned (3 tiers: die-keuze dots / getal-keuze numerals / num-pad at 0/30/70; '?' cell + reveal-and-merge animation; prompt carries the split statement '5 is 2 en ?') |
| `splits-herken-huisje` | `SplitsHerkenHuisje.tsx` | ✅ done (4 tiers: die-both drag / die-one choose / die-numaid choose / num-two choose at score 0/24/50/74; drag-and-drop via pointer events) |
| `number-sequence-order` | `NumberSequenceOrder.tsx` | ✅ done (4 tiers: with-start / gap-fill / shuffle / sparse at 0/30/55/75; tap-back un-place + ✓ confirm) |
| `show-me-on-ten-frame` | `ShowMeOnTenFrame.tsx` | ✅ done |
| `numberline-read` | `NumberlineRead.tsx` | ✅ done (target cell: bouncing arrow + pulse) |
| `quantity-match` | `QuantityMatch.tsx` | ✅ done |
| `subitise-flash` | `SubitiseFlash.tsx` | ✅ done (in-exercise replays recorded as `replayCount`) |
| `same-split-or-different` | `SameSplitOrDifferent.tsx` | ✅ done (weights are initial guesses) |
| `splits-match` | `SplitsMatch.tsx` | ✅ done (3 tiers: choose / koppelen face-up pairing / memory at 0/40/75) |
| `splits-shuffle` | `SplitsShuffle.tsx` | ✅ rebuilt (whole visibly splits, original stays greyed as referent; tiers kijk / klopt-het trick-verify / welke-splitsing at 0/30/60) |
| `splits-build-it` | `SplitsBuildIt.tsx` | ✅ done (open: cut + name the hidden part; gericht: 'Splits 5 in 2 en 3', either cut order accepted) |
| `rekenrek-show` | — | 🅿️ parked (see above) |
| `dot-pattern-decompose-pad` | — | 🅿️ parked — numpad variant of dot-pattern-decompose at score ≥ 24; uncertain whether worth a separate type (see skill map) |
| `fill-vis` | `FillVisual.tsx` | ✅ reworked (semantic variants erbij/samenvoegen/wegnemen, each with canonical cue phrase + matching reveal grammar; `variant` recorded; commutativity term-swap at equation tier for flipped `+`; `−` grammar built, goes live with the −1-2 round; scene-visual uses the theme `Counter` on a transparent ground via SceneGroup; cue+visual+equation on a shared `Panel`, numpad outside) |
| `fill-plain` | `FillPlain.tsx` | ✅ op-generic (`+`/`−` via opDisplay, tokens) |
| `choice` | `Choice.tsx` | ✅ op-generic (crossed-dots aid for `−` at visual tier; shared range-clamped distractors, 0 allowed for `−`) |
| `tf` | `TrueFalse.tsx` | ✅ op-generic, 2 tiers (judge near-miss / strikt at 60: operand-echo + `−` reversal traps via display operands) |
| `erbij-tap` | `ErbijTap.tsx` | ✅ done (replaces collect-tap; staged opening reveal — start group + number, then the arrival chunk + cue, then "=?"; items fade in place, no bob/rotate; child still taps arrivals in one by one; written order; calm stable prompt; pen lingers then hides for "hoeveel nu?"; completed-equation closure held ~850ms before the feedback overlay; Panel; tiers doen 0 / voorspel 35) |
| `wegneem-tap` | `WegneemTap.tsx` | ✅ done (mirror of erbij-tap: tap the leavers, they fade to crossed ghosts, chip counts back; tiers doen 0 / voorspel 35; remainder stays readable at the doen tier) |
| `wegnemen-crossed-out` | `WegnemenCrossedOut.tsx` | ✅ done (werkboek picture: whole drawn, removed part crossed; theme `Counter` via SceneGroup; tiers keuze 0 (cross-out animates one item at a time via useReveal, equation builds, no reflow) / numpad 50 (instant static)) |
| `numberline-jump-back` | `NumberLine.tsx` | ✅ done (backward twin id on the shared component; same 3-tier ladder, direction from `question.op`) |
| `collect-counter-down` | `CollectCounter.tsx` | ✅ done (downward twin id on the shared component; counter starts at the whole, child taps − down) |
| `collect-counter` | `CollectCounter.tsx` | ✅ op-generic (counts on from the larger `+` operand / back from the whole; confirm unlocked after first tap so 0 is answerable; `collect-counter-down` id registered with the − round) |
| `numberline-jump` | `NumberLine.tsx` | ✅ reworked (3 tiers: sprong-zien animated / sprong-zelf tap-the-landing 40 / kale-sprong sparse 70; written order — jump departs from operandA; tier-0 staged reveal: sum builds → line → start → jump → target; Panel + completed-equation closure; full-range line; direction seam for `numberline-jump-back`) |
| `splitshuisje` | `Splitshuisje.tsx` | ✅ done (production house, roof die-aid always UNSPLIT; tiers één-kamer choice 0 / één-kamer-kaal numpad 30 / twee-huisjes two-different-splits 60) |
| `splitsbenen` | `Splitsbenen.tsx` | ✅ done (second notation; tiers been-keuze 25 / been-pad 55; weight silent until 25 so the huisje lands first) |
| `splits-ontbreken-rechts` | `SplitsOntbreken.tsx` | ✅ done (tiers is-en-keuze 20 / is-en-pad 40 / vergelijking "5 = 3 + ?" 55; also serves the aanvullen skills via op `-`) |
| `splits-ontbreken-links` | `SplitsOntbreken.tsx` | ✅ done (post-60 only: links-keuze 60 / links-pad 80) |
| `splits-vrij` | `SplitsVrij.tsx` | ✅ done (two-slot numpad production, 0-splits accepted; nog-een tier 60: second different split, first greyed as referent) |
| `splits-alle` | `SplitsAlle.tsx` | ✅ done (descending huisje-table incl. both orders + 0-rows; tiers tabel-aanvullen 65 / tabel-vol 85; free-entry grid, end validation; left-column duplicate guard in tabel-vol — orange warning teaches uniqueness; for splitsen-10 the guard should likely be dropped) |
| `splits-som-match` | `SplitsSomMatch.tsx` | ✅ done (op-generic relation probe, split ↔ som both directions; 2×2 option grid + Panel; tiers som-vol 40 (full som incl. = uitkomst — gentle entry) / som-kiezen 60 (bare som) / omgekeerd 80; entry lowered to ~40 in the +/− weight tables; distractors are other facts, never the relation's twin) |
| `rekenverhaal` | `Rekenverhaal.tsx` | ✅ done (op-generic story problems, words carry the semantics; Dutch singular/plural agreement; equation HIDDEN on first attempt, revealed as scaffold on the wrong-answer retry — the sanctioned invariant exception; replay tap re-acts it; tiers tekst-film 60 / tekst 80; weight-only, never a gate) |
| optellen extras (2 types) | — | 🔲 not built |
| aftrekken-specific remainder (verschil-two-groups, verschil-rekenrek, aanvullen-target, numberline-jump-up-from-b) | — | 🔲 not built — with the wegnemen/verschil/aanvullen rounds |
| tienveld / rekenrek-make-ten / splits-helft | — | 🔲 not built |

### Per-exercise ritual

1. Create the file, implement, register via `registerExercise()`
2. Add its id to `src/exercises/index.ts`
3. Add or update the skill's weight table in `src/curriculum/weightMatrix.ts`
4. Run `npm run typecheck` and `npm test` — fix any errors (the test suite includes the curriculum-consistency tripwire; a forgotten weight or registration fails there)
5. Test in DebugMode
6. Update the status tables in this file (status lives here only)
7. Commit: `feat: add <exercise-id> exercise`

### Adding weights

`weightMatrix.ts` uses per-skill `SKILL_TABLES`. Add a named entry with `[low, high]` lerp pairs or a flat number. Skills without a table fall back to the default global curve.

---

## Documentation ownership (read before editing any doc)

Status rots when it lives in more than one place. The rules:

1. **Code is authoritative** for anything code can express (what's registered, weighted, playable). `src/curriculum/validate.ts` warns in dev when the lists disagree, and `npm test` includes a consistency tripwire.
2. **Implementation status lives in THIS file only** (the status tables under Round 2 progress). No other doc records what's built/weighted/tested — when a change alters status, update the tables here and nothing else.
3. **`rekenen_v2_skill_exercise_map.md`** owns curriculum *design rationale* (skill graph, exercise catalog, error taxonomy). It carries no status.
4. **`core_logic.md` and `rekenen_v2_app_design.md` are frozen** historical decision records. Never update them; never trust them for current state.

## Reference docs (in repo root)

- **`rekenen_v2_skill_exercise_map.md`** — authoritative skill graph, exercise type catalog, error taxonomy. **Takes precedence over the frozen docs** when there's any conflict.
- `rekenen_v2_app_design.md` — *frozen* — original app-level design conversation.
- `core_logic.md` — *frozen* — original logic model (superseded by the core model below).

## Core model (read first)

Skills are narrow and atomic. Each carries a 0–100 score that is both the **scaffolding dial** (which exercise type via the weight matrix, which tier within it — never the math the skill covers) **and the unlock gate**. Score moves +1 on correct, −3 on wrong; prerequisites must be unlocked and at score ≥ 60 (`UNLOCK_THRESHOLD`, `engine/scoring.ts`).

### Score model rationale (why the scalar gate is sound)

- Under +1/−3 the expected score drift per answer is `4p − 3` (p = accuracy): the score only climbs on sustained **≥ 75% accuracy** and collapses at 50%. Crossing 60 is a mastery signal, not a volume count.
- The **engine** controls the exercise mix (weight matrix + tiers keyed to the score), not the child — so the score measures accuracy over a curriculum-chosen, increasingly abstract mix. The weight matrix *is* the implicit facet schedule. There is deliberately no separate facet/par/vlot gating system: one was built and removed (git history, June 2026) — it was tier-blind in practice and made fluency probes block unlocks.
- Unlock at 60 = **basic mastery**: ready to start the next skill while this one keeps deepening 60 → 100 in dual rotation (leerlijn overlap). The most abstract tiers (minScore 70+) and automatisation are deliberately *post*-unlock content.
- The one structural leak in a scalar gate — **weak-exercise masking** (a rarely-served weak exercise is outvoted by strong ones, so the score crosses 60 with a live hole) — is closed by the dynamic weight factor below.

**Dynamic per-exercise weight factor** (`engine/weightFactors.ts`): a wrong answer adds +0.5 to that exercise's selection-weight multiplier, a correct one subtracts 0.25, clamped to [1, 3]. A weak exercise recruits airtime until its errors dominate the score drift — the score cannot cross 60 while a weakness is live. Combined with the −3 dial drop and the retry, failure means "more of this exercise, in an easier form" (CSA move 1, not the more-of-the-same anti-move). The factor is **stored nowhere**: a pure fold over the answer stream per (profile, skill, exercise), window 20, retries excluded; constants are tweakables at the top of the file. A factor pinned at 3 (⚠ in DebugMode and the Admin inspector) is a *look at this exercise* signal, not a drill-harder signal.

**The answer stream is the most important schema in the app.** Every answer becomes an `AnswerRecord` (`engine/diagnostics.ts`), persisted per profile in localStorage (`state/diagnosticsStorage.ts`, capped FIFO). Extend it additively; everything downstream (weight factors, stats, future scheduler/remediation) is a derivation over it.

**Failure response:** a wrong answer brings the *same problem* back once, one scaffolding tier lower, scene held stable (didactics: re-scaffold, don't move on). Retries are flagged `isRetry` and excluded from factor and stats computations. The `SelectionContext` parameter of `selectExercise` is the seam where this — and the future scheduler — plugs in.

Three independent skill relationships:
- **`unlockedBy`** — list of prereq skill ids; ALL must be unlocked AND at score ≥ `UNLOCK_THRESHOLD` before this skill becomes available. Archived prereqs satisfy implicitly (archival requires the capped score).
- **`unlocks`** — inverse, kept for readability; the engine derives behaviour from `unlockedBy` only.
- **`subsumedBy`** — single parent skill; when this skill caps at 100 AND the parent is unlocked, this skill is archived (removed from rotation, score preserved). `null` means never archive (typically fact-recall: tienvrienden, dubbels, helften).

A skill's `op` is one of `'+' | '-' | 'split' | 'count' | 'half'`. Each skill has a `generate()` returning a typed **`Problem`** with named roles per operation (`{ whole, part }` for `-`, `{ terms }` for `+`, `{ partA, partB }` for `split`, …). The engine derives the legacy `operandA`/`operandB` view for existing components; new exercises read `question.problem`. `generate` accepts an optional `GenerateContext` carrying the skill's current `score` (used: 0-splits entering mid-skill, post-60 operand flips — never the math range) and `recentRecords` (the still-unused seam for need-based per-fact sampling). Generators sample over an explicit **fact space** (`curriculum/factSampling.ts`: enumerate + weighted sample) instead of chained `rnd()` picks, so a total's airtime follows its fact count. The selector re-draws past immediate repeats and drops unplayable skills from the pool before ever returning null.

## Module map

| Path | Responsibility |
|---|---|
| `src/curriculum/types.ts` | `SkillDefinition` (incl. `didactics`, `semanticForm`), `Problem` (named-role problem union), `GenerateContext`, `Operation`, `WeightFunction` types |
| `src/curriculum/skills.ts` | All skill definitions (data — add new skills here) |
| `src/curriculum/weightMatrix.ts` | Per-skill weight tables (`SKILL_TABLES`); falls back to default global curve for untuned skills |
| `src/curriculum/factSampling.ts` | Fact-space enumeration + weighted sampling (`enumerateSplits/Plus/Minus`, `sampleFact`, `reweight`) — generators draw facts, not parameter chains |
| `src/curriculum/exercisePlan.ts` | Per-skill exercise-progression narrative (`EXERCISE_PLAN`) — the "why this order" doc layer over the weight curves; coverage-checked |
| `src/curriculum/validate.ts` | Dev-time consistency checks across applicableExercises × registry × weight tables × EXERCISE_PLAN; runs after exercise registration |
| `src/engine/scoring.ts` | applyCorrect / applyWrong / SCORE_MAX / UNLOCK_THRESHOLD (dial + unlock gate) |
| `src/engine/exerciseStats.ts` | Per-exercise recent attempts / accuracy / median-RT reporting kernel (feeds the DebugMode mix monitor; nothing gates on it) |
| `src/engine/weightFactors.ts` | Dynamic error-chasing weight factor — pure fold over the answer stream; tweakable constants |
| `src/engine/diagnostics.ts` | `AnswerRecord` (the long-term schema), `ErrorType`, `classifyError`, `DiagnosticsSink` + persisted singleton `diagnostics` |
| `src/engine/unlockEvaluator.ts` | Multi-prereq AND unlock evaluator (unlocked + score ≥ UNLOCK_THRESHOLD) |
| `src/engine/subsumeEvaluator.ts` | Archive evaluator (capped child + unlocked parent) |
| `src/engine/exerciseSelector.ts` | Picks skill + exercise, generates question; `SelectionContext` (retry one tier down, repeat avoidance); re-draws instead of returning null |
| `src/engine/answer.ts` | `computeAnswer(problem)` + `problemOperands(problem)` (legacy a/b view) |
| `src/exercises/types.ts` | **ExerciseDefinition** interface — the OO contract. Carries `tiers` (declared scaffolding levels) and `didactics`; optional `isCompatible(a, b)` guard. Also `ExerciseTier`, `ExerciseDidactics`, `AnswerDetail` (the optional `onResolve` payload). |
| `src/exercises/tiers.ts` | Shared `pickTier(tiers, score)` — picks the active scaffolding tier (highest `minScore <= score`) |
| `src/exercises/registry.ts` | Global exercise registry (Map) |
| `src/exercises/choiceOptions.ts` | Shared range-clamped numeral-distractor builder (`makeNumeralOptions`) — tot-5 never shows a numeral above 5 |
| `src/presentation/diePatterns.ts` | Canonical die/subitising `DOT_POS` map — single source |
| `src/exercises/index.ts` | Imports all exercise files to trigger registration |
| `src/exercises/DotPatternDecompose.tsx` | `dot-pattern-decompose` — perceptual splits exercise (4 stages, choice buttons, reveal animation) |
| `src/exercises/SplitsFrame.tsx` | `splits-frame` — part + '?' frame with reveal-and-merge, 3 tiers (die-keuze / getal-keuze / num-pad) |
| `src/exercises/SplitsHerkenHuisje.tsx` | `splits-herken-huisje` — splitshuisje intro, house shape, drag-and-drop, 4 tiers |
| `src/exercises/ComparePick.tsx` | `compare-pick` — relation-to-anchor choice (meer/minder/evenveel), 2 tiers |
| `src/exercises/FillVisual.tsx` | `fill-vis` — visual fill (dots / scene groups) |
| `src/exercises/FillPlain.tsx` | `fill-plain` — plain numpad |
| `src/exercises/Choice.tsx` | `choice` — 4-option multiple choice |
| `src/exercises/TrueFalse.tsx` | `tf` — Waar / niet waar? |
| `src/exercises/ErbijTap.tsx` | `erbij-tap` — the erbij action performed by the child; counting-on chip; voorspel tier (replaces the removed counting-all `collect-tap`) |
| `src/exercises/WegneemTap.tsx` | `wegneem-tap` — the wegnemen action performed by the child; counting-back chip; crossed ghosts; voorspel tier |
| `src/exercises/WegnemenCrossedOut.tsx` | `wegnemen-crossed-out` — static werkboek take-away picture |
| `src/exercises/Splitshuisje.tsx` | `splitshuisje` — production house (noteren); unsplit roof die-aid |
| `src/exercises/Splitsbenen.tsx` | `splitsbenen` — second splits notation (noteren) |
| `src/exercises/SplitsOntbreken.tsx` | `splits-ontbreken-rechts` + `-links` — total-first missing-part statements |
| `src/exercises/SplitsVrij.tsx` | `splits-vrij` — open production + nog-een variety round |
| `src/exercises/SplitsAlle.tsx` | `splits-alle` — full descending splits table |
| `src/exercises/SplitsSomMatch.tsx` | `splits-som-match` — op-generic split ↔ som relation probe (post-60 width) |
| `src/exercises/Rekenverhaal.tsx` | `rekenverhaal` — op-generic story problems (post-60 width; language gradient capstone) |
| `src/exercises/opDisplay.ts` | Shared operator glyph + colour (`opGlyph`, `opColor`) for every bare-equation exercise |
| `src/exercises/CollectCounter.tsx` | `collect-counter` — +/− counter (mid score) |
| `src/exercises/NumberLine.tsx` | `numberline-jump` — number line + choice buttons |
| `src/presentation/scenes.ts` | SCENES array + pickScene / pickColors helpers |
| `src/presentation/feedback.ts` | `FEEDBACK` config — process-praise copy + tone/timing (locked feedback constraints) |
| `src/presentation/useReveal.ts` | Hook for timed sequential reveal |
| `src/presentation/components/` | DotGroup, SceneGroup (both with `crossed` wegnemen prop; SceneGroup renders the theme `Counter` when given, emoji otherwise), CountChip, Panel (shared scene-`containerBg` card) |
| `src/state/types.ts` | Profile, AppState, SkillState (with `archived`) |
| `src/state/storage.ts` | localStorage load/save, `recordAnswer()` with cascade |
| `src/state/diagnosticsStorage.ts` | `LocalStorageDiagnosticsSink` — persisted answer stream, capped FIFO per profile |
| `src/ui/App.tsx` | Root: profile boot, screen routing |
| `src/ui/KidMode.tsx` | Full-screen exercise loop |
| `src/ui/DebugMode.tsx` | Exercise previewer (skill/score/exercise/scene pickers, diagnostics + mix monitor). Mirrors the live selector: passes `{ score }` to `generate`, the `problem` to `generateMeta`, and on a wrong answer re-presents the same problem one tier down (`buildRetry`, `isRetry`) so the re-scaffold is testable |
| `src/ui/AdminMode.tsx` | Profile management + read-only per-profile state inspector (📊: scores, statuses, live weight factors) |
| `src/ui/components/` | NumPad, ChoiceButtons, TFButtons |

## Adding a new exercise type

1. Create `src/exercises/MyExercise.tsx` with a typed `Meta` interface, a component, and call `registerExercise(...)`.
2. Declare `const TIERS: ExerciseTier[]` (even a single `minScore: 0` tier). In `generateMeta`, derive the active tier with `pickTier(TIERS, score)` and stamp `meta.tierId = tier.id` — don't reintroduce an inline `pickStage`/threshold function. The component switches on the tier.
3. Fill `tiers` and `didactics` on the definition (see Blueprint). When the child answers, pass what you cheaply know via the optional `onResolve(correct, { givenAnswer, tapCount })` so diagnostics can classify.
4. Import it in `src/exercises/index.ts`.
5. Reference its id in any skill's `applicableExercises` in `skills.ts`.
6. Add a weight in `src/curriculum/weightMatrix.ts`. An applicable + registered exercise with zero weight everywhere is flagged as dead by `validate.ts` (dev console + `npm test`).

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
npm test          # vitest — engine unit tests + curriculum consistency
npm run build     # production build
```

## Exercise invariants (locked)

- **The equation is always visible.** Every exercise shows the operation — with one documented exception (below). For splitsen the equation analog is the split statement ("5 is 2 en ?"): visible as text from the numeral tiers upward; at fully concrete tiers the structured visual (colour-split die, frame, huisje) carries the same statement.
  - **Exception — `rekenverhaal`.** The story capstone hides the equation on the first attempt (the whole point is to read the words and extract the math); it reveals the equation as a scaffold only on the re-scaffolded retry (`question.isRetry`). This is the single sanctioned exception, justified because showing the equation would let the child skip reading.
- **Reveal exercises build the equation piece by piece on a timer.** The sequence is: visual group A → `+` → visual group B → number A → `+` → number B → `= ?`. The child watches, input is locked until complete.
- **Reveal detail is each exercise's own concern.** Which steps are included and their timing depends on exercise type and score. High score → no reveal, equation is instant.
- **The visual is an illustration, not a gate.** Dots/scenes appear alongside their number, not instead of it.

## Key decisions (locked)

- Multi-profile from day one, localStorage (storage.ts is the only layer to swap for a backend)
- No audio in v2
- Subtraction is in scope for v2 (curriculum includes both addition and subtraction skills)
- No hidden admin — plain ⚙️ Opties button, kids can see it, no harm done
- Art direction parked — UI separated from logic for easy reskin
- Per-question records are captured, classified and persisted per profile; *acting* on the error types (error-driven remediation, per-fact sampling) is deferred until real play data exists
- Need-based skill scheduling is deliberately not built yet — uniform random pick stands until the WIP gates lift; the `SelectionContext` seam is where it lands
