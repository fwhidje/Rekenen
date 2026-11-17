# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition + subtraction + splitsen (v2). React + Vite + TypeScript.

---

## ★ Road to AI-driven Rekenen — long-term direction

The long-term plan lives in **`road_to_ai_driven_rekenen.md`** (goal, structure, principles, build order). That file carries no status; status is here.

| Step | Status |
|---|---|
| 1. Accounts + evidence store (Supabase) | 🟡 in progress — see below |
| 2. Registry and releases as data | 🔲 |
| 3. Agent, read-only | 🔲 |
| 4. Variant proposals | 🔲 |
| 5. New templates via PR | 🔲 |

**Step 1 pieces:**

| Piece | Status |
|---|---|
| Answer record enriched (event id, build version, session, score before, typed problem, shown meta) via shared `buildAnswerRecord` | ✅ |
| Schema `supabase/migrations/0001_accounts_and_evidence.sql` | ✅ run on the real project by Filip (Nov 2026) |
| Supabase project set up by Filip (project, user, repo variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`) | ✅ |
| Login under Opties (email + password; no registration screen — the account is created in the Supabase dashboard) | ✅ live; Filip reports it working on the real project (Nov 2026) |
| Sync: event upload queue, progress pull/push (last write wins per skill), explicit per-profile upload incl. stored history, new-device seeding, admin-override events | 🟡 live; Filip reports it working on the real project (Nov 2026) — multi-device use under observation, no systematic check of the stored rows yet |
| Keep-alive GitHub Action (`.github/workflows/keepalive.yml`, every 3 days + manual run) | ✅ manual run green (Nov 2026); scheduled runs follow every 3 days |
| Review flag ⚑ (device toggle under Opties → Ontwikkelaars; marks the question on screen, rides on its answer record as `flag`) + scene (theme/background/counter) and viewport on every record — schema `supabase/migrations/0002_answer_flag_and_scene.sql` | 🟡 built (Nov 2026) — **0002 must be run before this build is deployed**; until then uploads stay queued (no rows dropped). Inspector to filter flagged rows: not built |
| Inspector — separate page `inspector.html` (`src/inspector/`): wrong / flagged answers, per-exercise summary, replay as served, copy-for-chat, JSON back-up | 🟡 built (Nov 2026), verified against a mocked backend with app-generated rows — not yet used on the real project |
| School year on a child (column exists) | 🔲 no UI yet |
| Process traces (taps/drags with timing) | 🔲 later step |

Local play without an account must keep working throughout.

**How account sync behaves** (`src/sync/`):
- Without the two build variables, or without a login, the app is the local-only app. localStorage stays the working copy in every case.
- Logging in **pulls** the account's children onto the device. Profiles that exist only on the device are **never uploaded automatically** — each gets a ☁️⬆ button (upload once, from the device with the best progress, to avoid duplicates). A profile created while logged in is uploaded at once.
- Progress merges **last write wins per skill** on `SkillState.updatedAt`, stamped at the single commit point in `App.tsx`; the server enforces the same rule with a trigger.
- Answers of linked profiles go to a persisted upload queue (cap 2000) and are sent in batches; rows the server refuses are dropped individually, network failures keep everything queued. An unknown-column error (app deployed before its migration ran) counts as a network failure, not a refusal: rows stay queued until the migration runs.
- **Migrations go first.** Run a new `supabase/migrations/NNNN_*.sql` in the Supabase SQL editor *before* merging the app change that writes its columns to `main` (which deploys).
- Deleting a linked profile while logged in deletes the child and all its evidence from the account.
- DebugMode answers never upload.
- **Retention:** nothing expires. Answer rows leave the database only when their child is deleted (the profile 🗑 while logged in, cascade) or the account is. The free Supabase plan has no self-service restore (check the plan page), so the inspector's **⬇ Back-up (JSON)** is the backup: everything the login can read, one file, kept by Filip.

---

## Long-term backlog

- **Skill / exercise introduction flow** — when a new skill unlocks or a new exercise type is encountered for the first time, show a brief intro so the child knows what to do. Could be a short animation, a "Nieuw!" badge, or a guided first attempt.
- **Themed sessions** — lock a visual theme (background + item/emoji set) for a session or N rounds instead of randomising per question. Keeps the visual context consistent and less distracting.

## Parked — needs design review before implementing

- **`rekenrek-show`** — currently listed in `getalbegrip-5` / `getalbegrip-10` applicableExercises but not registered, not weighted, and not implemented. Open question: is "how many beads on the rekenrek?" actually a useful exercise for plain counting, or does the rekenrek only earn its keep in the splitsen-5 / splitsen-10 skills where the 5-structure split is the whole point? Revisit after looking at how Flemish teaching materials — first of all the method used at the child's school — structure 6–10 (5-structure / rekenrek vs kwadraatbeeld; skill map → *Didactic frame §6*) — likely either drop from getalbegrip or redesign as a structure-recognition exercise. Same question applies to any future `rekenrek-*` variants — `rekenrek-decompose` was removed from `splitsen-herken-5` for the same reason; for the 6–10 bands its job is done by `splits-build-it` on a bead row coloured per five, and the id is dropped (skill map → *Exercise design for the next set*).

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

### Currently gated (9 flagged skills)

| Skill id | Gates | Lift when |
|---|---|---|
| `optellen-tot-5` | `+1-2-tot-10`, `+3-4-tot-10` downstream | built — lift after a DebugMode play-through by Filip. **Lifting it opens `+1-2-tot-10`** (planned, never played) and behind it `+3-4-tot-10` and `dubbels-tot-10` (planned, never played): give those their own flag first, or play them through |
| `aftrekken-wegnemen-5` | `aftrekken-verschil-5`, `getalfamilie-5`, `-1-2-tot-10`, `-3-4-tot-10` downstream (verschil-5 and getalfamilie-5 are built and carry no flag of their own — lifting this one opens them) | built — lift after a DebugMode play-through by Filip; needs `optellen-tot-5` lifted too |
| `aftrekken-verschil-10`, `getalfamilie-10` | flagged themselves: no weight table, didactics `TODO` | their own tuning round |
| `splitsen-6-7`, `splitsen-8-9` | `tienvrienden` (from 6–7), `optellen-tot-10`, `aftrekken-wegnemen-10` (both bands) downstream | built — lift after a DebugMode play-through by Filip |
| `tienvrienden` | nothing downstream | built — lift after a play-through, once `splitsen-6-7` is live |
| `optellen-tot-10` | `helften-tot-10` | optellen-tot-10 verified end-to-end |
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

Round 1 (done): curriculum data, engine, DebugMode. All 23 skills defined in `skills.ts` (splitsen-tot-5 split into herken/noteren halves; the splits of 6–10 split by total into `splitsen-6-7` / `splitsen-8-9`, with 10 in `tienvrienden`; `aftrekken-aanvullen-*` redefined as `getalfamilie-*` — Nov 2026).
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
| `splitsen-6-7`, `splitsen-8-9` *(replace `splitsen-tot-10`)* | ✅ all 8 live (Nov 2026): `splits-beeld` and `splits-buren` new, `splitshuisje` / `splitsbenen` / `splits-ontbreken-*` / `splits-vrij` checked at 6–9 in a browser, `snel-weten`. Not used: the dice exercises and `splits-alle` (table too tall). **Still gated** — not playtested by a child | 🟡 initial guesses, one curve for both |
| `tienvrienden` | ✅ all 7 live (Nov 2026): `maak-tien`, `tien-paren` new; `splitshuisje`, `splits-ontbreken-*`, `puntoefening` checked at total 10; `snel-weten`. **Still gated** | 🟡 initial guesses |
| `+1-2-tot-5` | ✅ all 9 live, gate lifted (erbij-tap single tier, fill-vis picture-and-sum in step, doosje count-on, numberline 3 tiers, tf strikt traps, op-generic symbolic trio, post-60 width pair splits-som-match + rekenverhaal) — reworked Nov 2026 after a play-through review | 🟡 initial guesses |
| `optellen-tot-5` | ✅ all 9 live (Nov 2026): `huisje-som`, `flits-som`, `snel-weten` new, zero terms in the generator (about 15% of the draws), `fill-vis` / `splits-som-match` / `rekenverhaal` skip zero terms. **Still gated** — not playtested by a child; lift the flag after a DebugMode play-through | 🟡 initial guesses |
| `+1-2-tot-10` | 📐 planned and wired (Nov 2026): didactics, a 9-exercise list of existing types (number line leads; no action exercises), generator with a 30% refresh share of the tot-5 sums and post-60 turn-arounds. Played in a browser at 6–10. The tot-10 number line was reworked for it: one bow for the jump, the landing answered on the number strip. Gated only through `optellen-tot-5` | 📐 planned, never played |
| `+3-4-tot-10` | 📐 planned and wired (Nov 2026): didactics, an 8-exercise list of existing types (`huisje-som` leads, no number line), generator with a small refresh share and post-60 turn-arounds. `buur-som` and `som-in-stappen` added for the derived-fact routes (10 exercises). Played in a browser at these numbers. Gated only through `optellen-tot-5` | 📐 planned, never played |
| `optellen-tot-10` | 🔲 own tuning round pending; didactics still `TODO` | 🔲 |
| `-1-2-tot-5` | ✅ all 10 live, gate lifted (wegneem-tap, wegnemen-crossed-out, jump-back twin, doosje count-back, fill-vis − grammar, tf reversal traps, post-60 width pair splits-som-match + rekenverhaal) — reworked Nov 2026 | 🟡 initial guesses |
| `aftrekken-wegnemen-5` | 🟡 10 of 11 live (Nov 2026): `omkeer-som` and `teken-kiezen` built, `huisje-som` / `flits-som` shared with optellen; a − 0 and a − a in the generator (about 15% together); `snel-weten`. **Still gated** — not playtested by a child | 🟡 initial guesses |
| `aftrekken-verschil-5` | ✅ all 4 live (Nov 2026): `verschil-paren`, `numberline-gap`, `teken-kiezen`, `rekenverhaal` (verschil story). Problems carry `form: 'verschil'`; a difference of 0 is kept but made rarer. Gated through `aftrekken-wegnemen-5` | 🟡 initial guesses |
| `getalfamilie-5` *(was `aftrekken-aanvullen-5`)* | ✅ all 7 live (Nov 2026): `puntoefening`, `familie-sommen` (two of its three designed tiers), `numberline-gap`, `splits-ontbreken-rechts`, `teken-kiezen`, `rekenverhaal` (aanvullen / deel-geheel stories), `snel-weten` (asks any view of the family). Gated through `aftrekken-wegnemen-5` | 🟡 initial guesses |
| `-1-2-tot-10` | 📐 planned and wired (Nov 2026): didactics, an 11-exercise list of existing types (number line back leads), generator with a 30% refresh share. Uses the reworked tot-10 number line. Gated only through `aftrekken-wegnemen-5` | 📐 planned, never played |
| `-3-4-tot-10` | 📐 planned and wired (Nov 2026): didactics, a 10-exercise list of existing types (`huisje-som` leads, `omkeer-som` early, no number line or doosje) plus `som-in-stappen`. Played in a browser. Gated only through `aftrekken-wegnemen-5` | 📐 planned, never played |
| `aftrekken-wegnemen-10`, `aftrekken-verschil-10`, `getalfamilie-10` | 🔲 didactics still `TODO`; will reuse the new op-generic exercises | 🔲 |
| `dubbels-tot-10` | 📐 planned and wired (Nov 2026): **moved forward — unlocks from `+1-2-tot-10`** (was `optellen-tot-10`), next to `+3-4-tot-10`. Didactics, 7 exercises (`dubbel-spiegel` new), generator serves 3 + 3, 4 + 4, 5 + 5 twice as often as 1 + 1, 2 + 2. Played in a browser. Gated only through `optellen-tot-5` | 📐 planned, never played |
| `helften-tot-10` | 🔲 still behind `optellen-tot-10`; didactics `TODO` | 🔲 |

**Preliminary documentation run (Nov 2026)** for the next set — `splitsen-tot-10`, `tienvrienden`, `optellen-tot-5`, `aftrekken-wegnemen-5`, `aftrekken-verschil-5`, `aftrekken-aanvullen-5`:
- `didactics` (starting point, goal, pitfalls) and `intent` filled in `skills.ts`. The goals follow Flemish sources (`reference/flemish-curriculum/`); several pitfalls are reasoned, not sourced — the skill map's source table says which. Written before any exercise was designed — revise in each skill's own round.
- Reasoning and eight open questions: skill map → *Didactic frame*. None of them is decided; no graph, generator or exercise change was made. The ones that block exercise design: which getalbeeld carries 6–10 (5-structure vs kwadraatbeeld — depends on the school's method), the shape of `splitsen-tot-10` (one skill vs split by total), how to tell knowing from counting when the score is right/wrong only.
- `EXERCISE_PLAN` for these skills now holds the planned curve, marked `PLAN.` — to be rewritten when each skill is built.
- Known and not fixed: the classifier's aanvullen rule (`given == a − b`) can never fire — see the skill map's error-taxonomy notes.

**Exercise design run (Nov 2026)** for the same set, now seven skills:
- **Graph changed in `skills.ts`**: `splitsen-tot-10` → `splitsen-6-7` + `splitsen-8-9` (unlock together); `tienvrienden` unlocks from `splitsen-6-7` and now also teaches the splits of 10; `aftrekken-aanvullen-*` → `getalfamilie-*` (a split problem; the exercise picks the view); `splitsen-herken-5` / `splitsen-noteren-5` no longer archive. All affected skills are gated, so nothing changes in play. No profile held progress in the removed ids unless set by hand.
- **Designed, not built**: 12 new exercise types and the changes to existing ones — skill map → *Exercise design for the next set* (what each is for, how it works, tiers, pitfalls, first-guess weights, shared rules, what else must be built, a build order). The ids are reserved in `skills.ts` (`EX`) and listed in `applicableExercises`; no weight tables yet.
- **Decided**: the time-aware exercise `snel-weten` is built in its soft form (no clock shown; slow-but-correct is not wrong and never shown as slow). A visible time limit with a longer retry can be added later as a higher tier.
- **All seven skills are built (Nov 2026) and all are still gated**: none has been played by a child, and every weight is a first guess. Lift the gates one at a time after a DebugMode play-through.
- **Still open**: the `zelf` tier of `familie-sommen` and the `rij` tier of `splits-buren` (designed, not built); a "make the split yourself" exercise for 6–9; error classification for family questions (a wrong puntoefening answer is classified as a split: an echoed part is tagged `reversal`, the rest `unclassified`); the pace numbers (`engine/pace.ts`) have never met real data.

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
| `fill-vis` | `FillVisual.tsx` | ✅ reworked (semantic variants erbij/samenvoegen/wegnemen, each with canonical cue phrase; `variant` recorded; picture and sum form TOGETHER — number with its group, sign in both, second number with its group; groups are 5-rows; 2 tiers: beeld + som 0 / kale som 40 (= fill-plain on the first try, picture back on the retry); the commutativity swap was removed) |
| `fill-plain` | `FillPlain.tsx` | ✅ op-generic (`+`/`−` via opDisplay, tokens) |
| `choice` | `Choice.tsx` | ✅ op-generic (crossed-dots aid for `−` at visual tier; shared range-clamped distractors, 0 allowed for `−`) |
| `tf` | `TrueFalse.tsx` | ✅ op-generic, 2 tiers (judge near-miss / strikt at 60: operand-echo + `−` reversal traps via display operands); false statements stay inside the number range (no 6 or 7 in a tot-5 skill) |
| `erbij-tap` | `ErbijTap.tsx` | ✅ done (replaces collect-tap; ONE tier — the voorspel tier was dropped; staged opening — start group + number, then the waiting arrivals + "Doe er N bij!", then "=?"; start group and arrivals share one 5-row, the arrivals wait a step to the right, pulsing, and each tap slides one home; chip counts on; row lingers then is covered for "hoeveel nu?") |
| `wegneem-tap` | `WegneemTap.tsx` | ✅ done (mirror of erbij-tap: tap the leavers in a 5-row, they fade to crossed ghosts, chip counts back; tiers doen 0 / voorspel 35; remainder stays readable at the doen tier) |
| `wegnemen-crossed-out` | `WegnemenCrossedOut.tsx` | ✅ done (werkboek picture: whole drawn, removed part crossed; theme `Counter` via SceneGroup; tiers keuze 0 (cross-out animates one item at a time via useReveal, equation builds, no reflow) / numpad 50 (instant static)) |
| `numberline-jump-back` | `NumberLine.tsx` | ✅ done (backward twin id on the shared component; same 3-tier ladder, direction from `question.op`) |
| `doosje` | `Doosje.tsx` | ✅ done (Nov 2026; at most four outside the box — a turned-around 1 + 9 is not served; replaces `collect-counter` / `collect-counter-down`, which were removed. Op-generic, one id: the first number is a group in a closed box, the lid says how many; b stand outside going in (+) or have come out (−); the hidden group can't be recounted, so the child must count on / back. Tiers kijk 0 (box seen open first) / dicht 35 / intikken 65; on a correct answer the lid lifts and shows the result) |
| `numberline-jump` | `NumberLine.tsx` | ✅ reworked; Nov 2026: on the tot-10 line the jump is one move under one bow and the landing is answered on the number strip (cells too small to tap) — the tot-5 line is unchanged; only jumps of 1 or 2 are served (a turned-around 1 + 4 no longer comes here, also in the live `+1-2-tot-5`). (3 tiers: sprong-zien animated / sprong-zelf tap-the-landing 40 / kale-sprong sparse 70; written order — jump departs from operandA; tier-0 staged reveal: sum builds → line → start → jump → target; Panel + completed-equation closure; full-range line that fills the stage (50 px cells on the tot-5 line, completed jump drawn on a correct tap); direction seam for `numberline-jump-back`) |
| `splitshuisje` | `Splitshuisje.tsx` | ✅ done (production house, roof die-aid always UNSPLIT — small on purpose, a fading aid from herken; tiers één-kamer choice 0 / één-kamer-kaal numpad 30 / twee-huisjes two-different-splits 60, the two houses side by side; a repeated split gets "Dat is dezelfde!" and another try, not counted wrong; totals 2 and 3 need a 0-split for the second house — intended) |
| `splitsbenen` | `Splitsbenen.tsx` | ✅ done (second notation; tiers been-keuze 25 / been-pad 55; weight silent until 25 so the huisje lands first) |
| `splits-ontbreken-rechts` | `SplitsOntbreken.tsx` | ✅ done (tiers is-en-keuze 20 / is-en-pad 40 / vergelijking "5 = 3 + ?" 55; also serves the aanvullen skills via op `-`) |
| `splits-ontbreken-links` | `SplitsOntbreken.tsx` | ✅ done (post-60 only: links-keuze 60 / links-pad 80) |
| `splits-vrij` | `SplitsVrij.tsx` | ✅ done (two-slot numpad production, 0-splits accepted; nog-een tier 60: second different split, first greyed as referent — both rows on the stage from the start; a repeat gets a warning and another try, it is not counted wrong) |
| `splits-alle` | `SplitsAlle.tsx` | ✅ done (descending huisje-table incl. both orders + 0-rows; tiers tabel-aanvullen 65 / tabel-vol 85; first open cell active from the start, cursor moves on; end validation marks the wrong rows; the retry keeps the rows that were right and reopens only the wrong ones (`meta.entries` → `kept`); left-column duplicate guard in tabel-vol — a warning teaches uniqueness; for splitsen-10 the guard should likely be dropped) |
| `splits-som-match` | `SplitsSomMatch.tsx` | ✅ done (op-generic relation probe, split ↔ som both directions; 2×2 option grid; tiers som-vol 40 / som-kiezen 60 / omgekeerd 80; the som is written in full at som-vol, always for `−`, and always with the mini-huisje — bare only for `+` with a dice picture; for `−` the picture always shows the whole (two-colour die or huisje, never two separate dice); distractors are other facts, never the relation's twin) |
| `rekenverhaal` | `Rekenverhaal.tsx` | ✅ done; Nov 2026: three more stories — `verschil` (two groups, "hoeveel zijn er hier meer?"), and for a family `aanvullen` ("Er moeten er 5 zijn. Hoeveel komen er nog bij?", sum "2 + ? = 5") and `deel-geheel` ("2 zijn wakker. Hoeveel slapen er?"). (op-generic story problems, words carry the semantics; Dutch singular/plural agreement; tiers tekst-som 60 (sentences, the sum forming alongside) / tekst 80 (sentences only — the sanctioned hidden-equation exception); the film never auto-plays on a first attempt: ▶ acts the story out, taps recorded, creatures leave at the question; the retry is the pictured version — film plays, creatures stay, sum shown; weight-only, never a gate) |
| optellen extras (2 types) | — | 🔲 not built |
| `flits-som` | `FlitsSom.tsx` | ✅ done (Nov 2026; op-generic; the dots shrink when both groups are wide, so 6 + 4 fits a phone. The sum stays, its picture is shown briefly and then covered — two colour groups for +, crossed group for −, an empty place for a 0; ↻ look again, replays recorded; the picture returns with the correct answer. Tiers lang 0 (2.5 s, choice with the sum's own numbers as distractors) / kort 30 (1.2 s, number strip); a retry shows the picture standing still. `FLASH_MS` at the top of the file is the tuning knob. L measured at both sizes; the − side is not yet used by a live skill) |
| `huisje-som` | `HuisjeSom.tsx` | ✅ done (Nov 2026; op-generic. A filled splitshuisje beside the sum; the sum's numbers light up in the house, the dark one is the answer — roof for +, other room for −. Tiers huisje-open 0 (choice) / huisje-flits 30 (house covered after 1.8 s, strip) / twee-sommen 50 (two sums of one house in a row: 2 + 3 then 3 + 2 — van plaats wisselen; skipped for doubles) / huisje-erna 70 (empty house, fills in as confirmation); a retry always has the house open and one sum. L measured at both sizes) |
| `omkeer-som` | `OmkeerSom.tsx` | ✅ done (Nov 2026; "3 + 2 = 5, dus 5 − 3 = ?". Tiers omkeer-beeld 0 (two-colour row: together, then one colour crossed; choice) / omkeer-kaal 35 (two lines, strip) / buur 65 (the given line is the neighbouring sum: "5 − 2 = 3, dus 5 − 3 = ?"). Skips zero terms and a − a. A retry brings the picture back) |
| `familie-sommen` | `FamilieSommen.tsx` | 🟡 two of three tiers (Nov 2026; a huisje, its three numbers as tiles, the + pair then the − pair to fill by tapping tiles; a wrong tile ends the question. Tiers aanvullen 0 (one open place per sum) / leggen 40 (both numbers before the = open; + in either order, − order fixed). The designed `zelf` tier — make sums from the bare house — is not built) |
| `puntoefening` | `Puntoefening.tsx` | ✅ done (Nov 2026; "2 + ? = 5" for a family. Tiers doel-beeld 0 (the whole as places, given part filled; choice) / doel-flits 25 (picture flashes; strip) / kaal 45 / voor 65 ("? + 2 = 5") / min 80 ("5 − ? = 3"); the same part stays given on a retry, and the picture comes back. The `voor` tier was not opened in the browser check — the debug score steps skip it) |
| `numberline-gap` | `NumberlineGap.tsx` | ✅ done (Nov 2026; two marks and one bow between them. A family is served as aanvullen ("2 + ? = 5"), a − problem as verschil ("5 − 2 = ?"). Tiers sprong-zien 0 (bow drawn, small steps under it; choice) / sprong-kaal 40 (bow comes with the answer; strip) / kale-lijn 70 (only the ends labelled). A difference of 0 puts both marks on one cell) |
| `teken-kiezen` | `TekenKiezen.tsx` | ✅ done (Nov 2026; "5 ○ 2 = 3", two buttons + / −. Tiers film 0 (a scene plays: arrive / leave / two groups paired for verschil) / som 40 / zin 70 (cue sentence, outcome hidden until the sign is chosen). For a family the sign varies per question; skips zero terms. No `givenAnswer` is recorded — the answer is a sign) |
| `verschil-paren` | `VerschilParen.tsx` | ✅ done (Nov 2026; two owners as two colours — a row each and a chip in the question; questions meer / minder / "hoeveel moet ● er nog" recorded as `variant`. Tiers paren 0 (pairs dim one by one, the − sum forms; choice with both groups and their total as distractors) / naast 30 / schuin 55 (rows with different spacing) / getallen 75 (two numbers)) |
| `splits-beeld` | `SplitsBeeld.tsx` | ✅ done (Nov 2026; not in the original design — replaces the dice exercises for 6–10. The whole on 5-rows in two colours, with the statement "8 is 5 en ?". Tiers zien 0 (both parts in view; choice) / bedekt 25 (one part under a cover of fixed size; strip) / flits 50 (the picture for 1.5 s). A retry shows the whole picture) |
| `splits-buren` | `SplitsBuren.tsx` | 🟡 three of four tiers (Nov 2026; "7 is 5 en 2 — 7 is 4 en ?". Tiers schuif-zien 0 (a bead row coloured per five; the gap between the parts moves one bead; choice incl. "both parts moved the same way") / twee-regels 35 (strip) / sprong 70 (two steps away). The designed `rij` tier — three rows of the table — is not built) |
| `maak-tien` | `MaakTien.tsx` | ✅ done (Nov 2026; "7 en ? is 10" with a tienveld or two hands, recorded as `variant`. Tiers zien 0 (picture stays; choice) / flits 30 (1.4 s; strip) / denk 55 (no picture until the answer is in). Only for the splits of 10) |
| `tien-paren` | `TienParen.tsx` | ✅ done (Nov 2026; number cards, tap two that make 10; a wrong pair ends the question. Tiers open 0 (six cards with a small tienveld each) / getallen 35 / lokkers 60 (eight cards: three pairs and two that belong to nobody). A card-grid exercise without a stage) |
| `snel-weten` | `SnelWeten.tsx` | ✅ done (Nov 2026; one bare fact, one tap on the number strip, no clock. Reports `answerMs` and a margin per tier; the engine judges the pace (`engine/pace.ts`): a slow correct answer gets the normal praise and does not move the score. Tiers rustig 60 (tap baseline + 1.5 s) / vlot 80 (+ 0.8 s); met-huisje is the untimed retry with the family's house. Asks a split as a split, a getalfamilie in any of four views. Never played by a child — the limits are guesses) |
| `som-in-stappen` | `SomInStappen.tsx` | ✅ done (Nov 2026; op-generic, only for sums that cross the five. "4 + 3": the 3 split into 1 and 2, 4 + 1 = 5, 5 + 2 = ?. Tiers stappen-zien 0 (picture, split and first step given; choice) / eerst-vijf 35 (two taps: first how many to five; strip) / drie-termen 65 ("4 + 1 + 2 = ?"). A retry is the fully shown version) |
| `buur-som` | `BuurSom.tsx` | ✅ done (Nov 2026; optellen only, not for a dubbel. "3 + 3 = 6, dus 3 + 4 = ?" — the anchor is the best neighbour: dubbel, sum of 10, sum of / with 5, else the +2 sum. Tiers buur-beeld 0 / buur-kaal 35 / buur-zonder 65 (anchor without its outcome)) |
| `dubbel-spiegel` | `DubbelSpiegel.tsx` | ✅ done (Nov 2026; a row and its mirror image, sum n + n, title "Het dubbel van n". Tiers spiegel-zien 0 / spiegel-denk 30 / woord 60. Replaces the planned `dubbel-recognise`) |
| splits-helft | — | 🔲 not built |

### Per-exercise ritual

1. Create the file, implement, register via `registerExercise()`
2. Add its id to `src/exercises/index.ts`
3. Add or update the skill's weight table in `src/curriculum/weightMatrix.ts`
4. Run `npm run typecheck` and `npm test` — fix any errors (the test suite includes the curriculum-consistency tripwire; a forgotten weight or registration fails there)
5. Test in DebugMode — right, and wrong-then-retry; check the conventions (W / R / C / L / Q), L at 375 × 667 and 390 × 844
6. Update the status tables in this file (status lives here only)
7. Commit: `feat: add <exercise-id> exercise`

### Adding weights

`weightMatrix.ts` uses per-skill `SKILL_TABLES`. Add a named entry with `[low, high]` lerp pairs or a flat number. Skills without a table fall back to the default global curve.

---

## Documentation ownership (read before editing any doc)

Status rots when it lives in more than one place. The rules:

1. **Code is authoritative** for anything code can express (what's registered, weighted, playable). `src/curriculum/validate.ts` warns in dev when the lists disagree, and `npm test` includes a consistency tripwire.
2. **Implementation status lives in THIS file only** (the status tables under Round 2 progress). No other doc records what's built/weighted/tested — when a change alters status, update the tables here and nothing else.
3. **`rekenen_v2_skill_exercise_map.md`** owns curriculum *design rationale* (skill graph, exercise catalog, error taxonomy). It carries no status. **`road_to_ai_driven_rekenen.md`** owns the long-term direction; it carries no status either.
4. **`core_logic.md` and `rekenen_v2_app_design.md` are frozen** historical decision records. Never update them; never trust them for current state.
5. **`reference/`** holds extracts of external sources (today: Flemish curriculum documents) and the background didactics text. Evidence only — no status, no decisions of this project. Never edit the quoted text; add a file and a README row when a new source is consulted. The curriculum follows the **Flemish** progression: Dutch material (TAL, SLO, Dutch methods) is organised differently and is not a reference.

## Reference docs (in repo root)

- **`rekenen_v2_skill_exercise_map.md`** — authoritative skill graph, exercise type catalog, error taxonomy. **Takes precedence over the frozen docs** when there's any conflict.
- **`road_to_ai_driven_rekenen.md`** — long-term plan (AI-teacher direction). Carries no status.
- **`reference/l1_maths_didactics_belgie.md`** — the project's own background text on first-year didactics (source of the terms "movement 5", "mastery width"). A synthesis without sources; where it differs from the Flemish documents below, the documents win; its §15 describes an older app.
- **`reference/flemish-curriculum/`** — extracts of the Flemish sources behind the didactics: minimumdoelen wiskunde, GO! doelenset bewerkingen (getalfamilies, optellen / aftrekken to 10), UCLL leerlijnen and vakdidactisch kader. `README.md` there lists sources, URLs and what is still unread (ZILL, OVSG, the school's method).
- `rekenen_v2_app_design.md` — *frozen* — original app-level design conversation.
- `core_logic.md` — *frozen* — original logic model (superseded by the core model below).

## Core model (read first)

*One exception to "+1 on correct" (Nov 2026):* in the time-aware exercise `snel-weten` a correct answer that took longer than the child's own tap time plus a margin leaves the score unchanged (`engine/pace.ts`). The child sees no clock and gets the same praise. It applies only above score 60, so it cannot hold up an unlock. The answer record carries `answerMs` and `pace`; for upload the pace rides in the `variant` column (no migration).

Skills are narrow and atomic. Each carries a 0–100 score that is both the **scaffolding dial** (which exercise type via the weight matrix, which tier within it — never the math the skill covers) **and the unlock gate**. Score moves +1 on correct, −3 on wrong; prerequisites must be unlocked and at score ≥ 60 (`UNLOCK_THRESHOLD`, `engine/scoring.ts`).

### Score model rationale (why the scalar gate is sound)

- Under +1/−3 the expected score drift per answer is `4p − 3` (p = accuracy): the score only climbs on sustained **≥ 75% accuracy** and collapses at 50%. Crossing 60 is a mastery signal, not a volume count.
- The **engine** controls the exercise mix (weight matrix + tiers keyed to the score), not the child — so the score measures accuracy over a curriculum-chosen, increasingly abstract mix. The weight matrix *is* the implicit facet schedule. There is deliberately no separate facet/par/vlot gating system: one was built and removed (git history, June 2026) — it was tier-blind in practice and made fluency probes block unlocks.
- Unlock at 60 = **basic mastery**: ready to start the next skill while this one keeps deepening 60 → 100 in dual rotation (leerlijn overlap). The most abstract tiers (minScore 70+) and automatisation are deliberately *post*-unlock content.
- The one structural leak in a scalar gate — **weak-exercise masking** (a rarely-served weak exercise is outvoted by strong ones, so the score crosses 60 with a live hole) — is closed by the dynamic weight factor below.

**Dynamic per-exercise weight factor** (`engine/weightFactors.ts`): a wrong answer adds +0.5 to that exercise's selection-weight multiplier, a correct one subtracts 0.25, clamped to [1, 3]. A weak exercise recruits airtime until its errors dominate the score drift — the score cannot cross 60 while a weakness is live. Combined with the −3 dial drop and the retry, failure means "more of this exercise, in an easier form" (CSA move 1, not the more-of-the-same anti-move). The factor is **stored nowhere**: a pure fold over the answer stream per (profile, skill, exercise), window 20, retries excluded; constants are tweakables at the top of the file. A factor pinned at 3 (⚠ in DebugMode and the Admin inspector) is a *look at this exercise* signal, not a drill-harder signal.

**The answer stream is the most important schema in the app.** Every answer becomes an `AnswerRecord` (`engine/diagnostics.ts`), persisted per profile in localStorage (`state/diagnosticsStorage.ts`, capped FIFO, `meta` stripped). Records are assembled in exactly one place, `buildAnswerRecord` (`engine/answerRecord.ts`). Extend it additively; everything downstream (weight factors, stats, future scheduler/remediation) is a derivation over it.

**Failure response:** a wrong answer brings the *same question* back once, one scaffolding tier lower, scene held stable (didactics: re-scaffold, don't move on). "Same question" is a rule the exercises implement (convention R, below): the retry keeps which part is given, which variant is acted out, etc. Retries are flagged `isRetry` and excluded from factor and stats computations. The `SelectionContext` parameter of `selectExercise` is the seam where this — and the future scheduler — plugs in.

Three independent skill relationships:
- **`unlockedBy`** — list of prereq skill ids; ALL must be unlocked AND at score ≥ `UNLOCK_THRESHOLD` before this skill becomes available. Archived prereqs satisfy implicitly (archival requires the capped score).
- **`unlocks`** — inverse, kept for readability; the engine derives behaviour from `unlockedBy` only.
- **`subsumedBy`** — single parent skill; when this skill caps at 100 AND the parent is unlocked, this skill is archived (removed from rotation, score preserved). `null` means never archive (typically fact-recall: tienvrienden, dubbels, helften).

A skill's `op` is one of `'+' | '-' | 'split' | 'count' | 'half'`. Each skill has a `generate()` returning a typed **`Problem`** with named roles per operation (`{ whole, part }` for `-`, `{ terms }` for `+`, `{ partA, partB }` for `split`, …). The engine derives the legacy `operandA`/`operandB` view for existing components; new exercises read `question.problem`. `generate` accepts an optional `GenerateContext` carrying the skill's current `score` (used: 0-splits entering mid-skill, post-60 operand flips — never the math range) and `recentRecords` (the still-unused seam for need-based per-fact sampling). Generators sample over an explicit **fact space** (`curriculum/factSampling.ts`: enumerate + weighted sample) instead of chained `rnd()` picks, so a total's airtime follows its fact count. The selector re-draws past immediate repeats and drops unplayable skills from the pool before ever returning null.

## Module map

| Path | Responsibility |
|---|---|
| `src/curriculum/types.ts` | `SkillDefinition` (incl. `didactics`, `semanticForm`), `Problem` (named-role problem union; a − problem may carry `form: 'verschil'`, set by the verschil skills so op-generic exercises show a comparison), `GenerateContext`, `Operation`, `WeightFunction` types |
| `src/curriculum/skills.ts` | All skill definitions (data — add new skills here) |
| `src/curriculum/weightMatrix.ts` | Per-skill weight tables (`SKILL_TABLES`); falls back to default global curve for untuned skills |
| `src/curriculum/factSampling.ts` | Fact-space enumeration + weighted sampling (`enumerateSplits/Plus/Minus`, `sampleFact`, `reweight`) — generators draw facts, not parameter chains |
| `src/curriculum/exercisePlan.ts` | Per-skill exercise-progression narrative (`EXERCISE_PLAN`) — the "why this order" doc layer over the weight curves; coverage-checked |
| `src/curriculum/validate.ts` | Dev-time consistency checks across applicableExercises × registry × weight tables × EXERCISE_PLAN; runs after exercise registration |
| `src/engine/scoring.ts` | applyCorrect / applyWrong / SCORE_MAX / UNLOCK_THRESHOLD (dial + unlock gate) |
| `src/engine/exerciseStats.ts` | Per-exercise recent attempts / accuracy / median-RT reporting kernel (feeds the DebugMode mix monitor; nothing gates on it) |
| `src/engine/weightFactors.ts` | Dynamic error-chasing weight factor — pure fold over the answer stream; tweakable constants; a correct-but-slow answer is skipped |
| `src/engine/pace.ts` | Time-aware answers: `tapBaselineMs` (the fast quarter of the child's own recent timed correct answers, clamped, default 1.5 s) and `judgePace` (fast / slow for a correct first attempt of a question that names a margin). Pure fold; constants at the top |
| `src/engine/diagnostics.ts` | `AnswerRecord` (the long-term schema; incl. `scene`, `viewport`, review `flag`), `AnswerScene`, `AnswerFlag`, `ErrorType`, `classifyError`, `DiagnosticsSink` + persisted singleton `diagnostics` |
| `src/engine/answerRecord.ts` | `buildAnswerRecord` — the one place an `AnswerRecord` is assembled (KidMode + DebugMode); `APP_VERSION` (build commit via `vite.config.ts`), `SESSION_ID`, `currentViewport()`; scene / viewport / flag are passed in by the caller (KidMode only); test tripwires JSON-safety, size and that the profile name never enters a record |
| `src/engine/unlockEvaluator.ts` | Multi-prereq AND unlock evaluator (unlocked + score ≥ UNLOCK_THRESHOLD) |
| `src/engine/subsumeEvaluator.ts` | Archive evaluator (capped child + unlocked parent) |
| `src/engine/exerciseSelector.ts` | Picks skill + exercise, generates question; `SelectionContext` (retry one tier down, repeat avoidance); re-draws instead of returning null |
| `src/engine/answer.ts` | `computeAnswer(problem)` + `problemOperands(problem)` (legacy a/b view) |
| `src/exercises/types.ts` | **ExerciseDefinition** interface — the OO contract. Carries `tiers` (declared scaffolding levels) and `didactics`; optional `isCompatible(a, b, problem)` guard (the problem is passed so a guard can depend on the operation). Also `ExerciseTier`, `ExerciseDidactics`, `AnswerDetail` (the optional `onResolve` payload). |
| `src/exercises/conventions.test.ts` | Tripwire for the behaviour conventions (W wrong text, R retry stability, C closure, Q no free-wrapping groups) + `PENDING_AUDIT`, the list of exercises not yet checked against them |
| `src/exercises/tiers.ts` | Shared `pickTier(tiers, score)` — picks the active scaffolding tier (highest `minScore <= score`) |
| `src/exercises/registry.ts` | Global exercise registry (Map) |
| `src/exercises/choiceOptions.ts` | Shared range-clamped numeral-distractor builders: `makeNumeralOptions` (near-misses; tot-5 never shows a numeral above 5) and `makeSumOptions` (first the numbers that are on screen — the echo errors — then near-misses) |
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
| `src/exercises/ErbijTap.tsx` | `erbij-tap` — the erbij action performed by the child; counting-on chip; one tier (replaces the removed counting-all `collect-tap`) |
| `src/exercises/WegneemTap.tsx` | `wegneem-tap` — the wegnemen action performed by the child; counting-back chip; crossed ghosts; voorspel tier |
| `src/exercises/WegnemenCrossedOut.tsx` | `wegnemen-crossed-out` — static werkboek take-away picture |
| `src/exercises/Splitshuisje.tsx` | `splitshuisje` — production house (noteren); unsplit roof die-aid |
| `src/exercises/Splitsbenen.tsx` | `splitsbenen` — second splits notation (noteren) |
| `src/exercises/SplitsOntbreken.tsx` | `splits-ontbreken-rechts` + `-links` — total-first missing-part statements |
| `src/exercises/SplitsVrij.tsx` | `splits-vrij` — open production + nog-een variety round |
| `src/exercises/SplitsAlle.tsx` | `splits-alle` — full descending splits table |
| `src/exercises/SplitsSomMatch.tsx` | `splits-som-match` — op-generic split ↔ som relation probe (post-60 width) |
| `src/exercises/Rekenverhaal.tsx` | `rekenverhaal` — op-generic story problems (post-60 width; language gradient capstone) |
| `src/exercises/FlitsSom.tsx` | `flits-som` — op-generic: the picture of a sum flashes, the sum stays |
| `src/exercises/HuisjeSom.tsx` | `huisje-som` — op-generic: the sum read from a filled splitshuisje |
| `src/exercises/OmkeerSom.tsx`, `TekenKiezen.tsx`, `VerschilParen.tsx`, `NumberlineGap.tsx`, `Puntoefening.tsx`, `FamilieSommen.tsx` | The exercises of the aftrekken skills and the getalfamilie skill (`omkeer-som`, `teken-kiezen`, `verschil-paren`, `numberline-gap`, `puntoefening`, `familie-sommen`) — see Exercise file status |
| `src/exercises/SnelWeten.tsx`, `SplitsBeeld.tsx`, `SplitsBuren.tsx`, `MaakTien.tsx`, `TienParen.tsx` | `snel-weten` (time-aware), and the exercises of the split bands and tienvrienden — see Exercise file status |
| `src/exercises/SomInStappen.tsx`, `BuurSom.tsx`, `DubbelSpiegel.tsx` | `som-in-stappen`, `buur-som` (the derived-fact routes of the ±3/4 skills) and `dubbel-spiegel` (dubbels) |
| `src/exercises/opDisplay.ts` | Shared operator glyph + colour (`opGlyph`, `opColor`) for every bare-equation exercise |
| `src/exercises/Doosje.tsx` | `doosje` — op-generic count-on / count-back from a group hidden in a box (replaces the collect-counter pair) |
| `src/exercises/NumberLine.tsx` | `numberline-jump` — number line + choice buttons |
| `src/presentation/scenes.ts` | SCENES array + pickScene / pickColors helpers |
| `src/presentation/feedback.ts` | `FEEDBACK` config — process-praise copy + tone/timing incl. `closureMs` (locked feedback constraints); `wrongFeedbackText` — the one place the wrong overlay's text is decided |
| `src/presentation/useClosure.ts` | `useClosure(question, onResolve)` — how every exercise hands in its answer: correct → completed state held `closureMs`, wrong → at once |
| `src/presentation/useReveal.ts` | Hook for timed sequential reveal |
| `src/presentation/useFlash.ts` | Hook for an aid shown for a set time and then covered in place (`showing`, `seen`, `replay`, `replays`; `hold` keeps it visible on a retry) |
| `src/presentation/components/FiveRow.tsx` | The 5-row: the layout for any quantity that changes (convention Q); DotGroup and SceneGroup are built on it |
| `src/presentation/components/` | DotGroup, SceneGroup (both with `crossed` wegnemen prop; SceneGroup renders the theme `Counter` when given, emoji otherwise), CountChip, **ExerciseFrame** (`ExerciseTitle` cream band + `ExerciseStage` paper card — the shared exercise shell, theme-invariant `paper`/`cream`; see Unified exercise shell below — plus `Reserve`, space held for content that appears later, and `ExerciseTitle`'s `warning`, a notice drawn on the band without resizing it), **AnswerSlot** (the boxed "?" of an equation: empty / typed / solved) |
| `src/state/types.ts` | Profile, AppState, SkillState (with `archived`) |
| `src/state/storage.ts` | localStorage load/save, `recordAnswer()` with cascade |
| `src/state/deviceSettings.ts` | Per-device preferences (not per profile, never synced) — today only the ⚑ review-flag button toggle |
| `src/state/diagnosticsStorage.ts` | `LocalStorageDiagnosticsSink` — persisted answer stream, capped FIFO per profile; strips `meta` (upload-only evidence) |
| `src/sync/rows.ts` | Wire row types mirroring the SQL schema; `toEventRow` / `fromEventRow`; `SeedEventRow` (the lean columns new-device seeding reads back — no meta, flag or scene); stable ids for pre-sync records |
| `src/sync/progressMerge.ts` | Pure progress sync rules: `stampChanges` / `stampState` / `stampAll`, `progressRows`, `mergeRemoteProgress`, `applySnapshot` |
| `src/sync/remote.ts` | `Remote` interface (all the engine knows of the backend) + Supabase implementation; `SyncError` (permanent vs transient; `isPermanentCode` — an unknown column is transient) |
| `src/sync/engine.ts` | `SyncEngine` — link set, upload queues, push / pull / upload / deleteChild; serialised, never throws into the play loop |
| `src/sync/client.ts` | Supabase client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` (null when unset) + the `sync` singleton |
| `src/sync/useSync.ts` | React binding: session tracking and WHEN sync runs (login, start, online, visibility, debounced push) |
| `inspector.html` + `src/inspector/` | Separate inspector page (see Inspector): `main.tsx` entry, `Inspector.tsx` (login, filters, layout, back-up), `EventList.tsx` (summary + list), `EventDetail.tsx` (evidence + copy), `Replay.tsx` (the exercise as served), `model.ts` (pure: filters, retry pairing, summary, `rowToQuestion`, `answerText`; tested), `data.ts` (own read-only Supabase client, paged reads, back-up), `hashState.ts`, `ui.ts` |
| `supabase/migrations/` | Database schema for accounts + evidence store, one numbered SQL file per change; run by hand in the Supabase SQL editor |
| `src/ui/App.tsx` | Root: profile boot, screen routing |
| `src/ui/KidMode.tsx` | Full-screen exercise loop; stamps scene + viewport on every record; ⚑ review-flag button when the device setting is on |
| `src/ui/DebugMode.tsx` | Exercise previewer (skill/score/exercise/scene pickers, diagnostics + mix monitor). Mirrors the live selector: passes `{ score }` to `generate`, the `problem` to `generateMeta`, re-draws problems the chosen exercise cannot show (`isCompatible`), and on a wrong answer re-presents the same problem one tier down (`buildRetry`, `isRetry`) so the re-scaffold is testable |
| `src/ui/AdminMode.tsx` | Account section (login / sync status) + profile management incl. ☁️ upload + read-only per-profile state inspector (📊: scores, statuses, live weight factors) + 🌳 entry to the progress override + ⚑ review-flag toggle (device setting, under Ontwikkelaars) + link to the inspector page (logged in) |
| `src/ui/SkillTreeScreen.tsx` | Progress override screen: skill tree for one profile, tap a skill → Open hier / Beheerst → preview diff → Toepassen |
| `src/admin/progressOverride.ts` | Progress override rules (pure): `planOverride(profile, skillId, mode)` → new profile + per-skill diff; `prerequisites`, `blockedBy`, `canOverride` |
| `src/admin/skillTreeLayout.ts` | Derived tree layout (row = longest prereq chain, order = parent barycenter then track) — never hand-placed |
| `src/presentation/components/Equation.tsx` | "x ± y = res" with one place open (`hole`: x / y / res / sign) and a `shown` step for reveals; `eqText` for the wrong-answer overlay — the sum of the family exercises |
| `src/presentation/components/Huisje.tsx` | The splitshuisje as a shared component (roof + two rooms as strings; `activeCell`, unsplit `dieAid`, `lit` places, `good` answer place) — used by `splitshuisje` and `huisje-som` |
| `src/ui/components/` | NumPad (`compact` for tall stages), ChoiceButtons, TFButtons (`picked` stays lit during the closure), **NumberStrip** (one tap on a number at a fixed place: 0, then 1–5, for tot 10 a second row 6–10; no confirm, no option set — the input of the "know it" exercises) |

## Unified exercise shell (locked)

Every exercise wears the same chrome, from `presentation/components/ExerciseFrame`:

- **`<ExerciseTitle>`** — the prompt in its own cream band above everything. Required in every exercise (a `npm test` tripwire, `exerciseShell.test.ts`, fails any exercise file that doesn't render one).
- **`<ExerciseStage>`** — one `paper` card holding the exercise proper: visuals, animations, and any drag / tap-the-stage interaction. Single colour throughout — no nested tints; sub-groups inside it are transparent. Pass `style` for width / `overflowX` / `minWidth` / `gap` overrides.
- **Input goes OUTSIDE the stage** — numpad / choice / true-false buttons are siblings below it. Only stage interactions (drag trays, tap-to-place, tap-the-counter) live inside.
- **Exception:** pure choose-between-visual-cards exercises (`compare-more-less`, the `match`/`pairs` grids of `quantity-match` / `splits-match`, `compare-pick`'s picture options) have no stage — the option cards are each their own background. They still render an `<ExerciseTitle>`.

`paper` and `cream` are identical across all themes, so the shell colour is constant regardless of scene (never use the theme-varying `containerBg` for a stage). `rekenverhaal`'s multi-line story is its title band (via `ExerciseTitle` with a style override).

## Exercise behaviour conventions (locked)

Five rules every exercise follows, so the child meets the same behaviour everywhere. W, R, C and (roughly) Q are enforced by `src/exercises/conventions.test.ts`; L needs a browser.

**W — wrong answer: the overlay shows the correct fact, as the child should read it.**
- Decided in one place: `wrongFeedbackText(question, def)` (`presentation/feedback.ts`), used by KidMode and DebugMode.
- An exercise declares `correctStatement(question)` on its definition and returns the completed statement in the wording that was on screen: `"3 + 2 = 5"` (`equationText`), `"5 is 2 en 3"` (`splitText`), `"5 = 2 + 3"`.
- It returns `null` when no single statement is the answer (open production: `splits-vrij`, `splits-alle`, twee-huisjes) → the neutral `FEEDBACK.wrongNeutral` ("Dat klopt nog niet").
- Never show a number that was not asked for. `question.answer` is the *total* for a split, so the default (no declaration) is neutral for split problems and "Het antwoord is N" only for the other operations.
- Judgement / matching exercises (`tf`, `splits-som-match`) show the true equation, not a bare number.

**R — retry: the same question, one tier down.**
- `buildRetry` regenerates meta at the lower tier and passes the original meta as `ctx.retryOf` (5th argument of `generateMeta`).
- Every random choice that defines *what is asked* is copied from `ctx.retryOf`: which part is given (`givenSide`, `given`), the semantic variant (erbij / samenvoegen story), the pre-printed cells, the option set of a matching exercise. Also the look, where it is cheap (dots vs creatures, colours) — the retry must read as the same problem with more help.
- Only tier-dependent fields change (`tierId`, reveal kind, choice vs numpad, whether an aid is shown).
- A retry never gives *less* help than the original.
- The definition lists these fields in `retryStable` (possibly `[]`); the test draws questions at every tier and checks `buildRetry` preserves them.
- Sanctioned exception — `tf`: the fact is kept, the statement is drawn afresh (the overlay has just shown the true equation; the identical statement would be answered by flipping the previous answer).

**C — correct answer: show the completed state, hold it, then resolve.**
- Exercises never call `onResolve` themselves. They call `resolve(correct, detail)` from `useClosure(question, onResolve)` (`presentation/useClosure.ts`).
- Correct → `solved` turns true: the exercise fills its "?" with the answer (boxed slots use `AnswerSlot`, which turns to the confirm colour; inline "?" becomes the number), or marks the chosen card / button. That state is held `FEEDBACK.closureMs` (800 ms) before the overlay.
- Wrong → resolves at once (the overlay names the correct fact; the retry follows).
- `answered` locks the exercise's own inputs during the hold. A second `resolve` for the same question is ignored.
- A typed-but-unconfirmed entry uses the accent colour; the confirm colour is reserved for `solved`.

**L — layout: nothing moves, and the question fits the screen.**
- From the moment a question is on screen until it is answered, the title band, the stage and the input area keep their position and height. Things appear, fade and change *in place*.
- Anything that appears later reserves its space from the start: answer buttons of a two-phase exercise go in `<Reserve show={…}>` (`ExerciseFrame`); later items are laid out from the start and faded in (opacity), never inserted.
- Groups that grow use a fixed grid sized for the final count (`erbij-tap`'s pen), so a new item never wraps the stage taller.
- A title that changes during a question keeps the same number of lines; a warning is drawn on the band itself (`<ExerciseTitle warning=…>`), so it cannot change the band's size.
- The whole question fits **375 × 667** without scrolling, measured at **390 × 844** too. Tall stages make room: two houses side by side at a smaller size, `NumPad compact`, tighter stage padding.
- The exercise column is `border-box` inside `100dvh` (KidMode / DebugMode / the inspector's replay frame): the page itself never scrolls.
- Stages that set a width use `boxSizing: 'border-box'` — a `width: 100%` stage with padding otherwise sticks out of the screen and is clipped.
- Tap targets on the stage are at least ~44 px where the range allows (the tot-5 number line: 50 px cells).
- **How to check** (no test can — jsdom has no layout): play the exercise right and wrong-then-retry at both sizes and confirm nothing shifts; when automating, sample `offsetTop` / `offsetHeight` of the title, stage and input (not `getBoundingClientRect`, which a button's press animation distorts) and `document.documentElement.scrollHeight` / `scrollWidth`.

**Q — quantities: a 5-row or a die pattern, nothing else.**
- A group of things is drawn in one of two structured layouts. No free-wrapping clusters — "4 as 3-over-1" teaches nothing and invites counting by ones.
- **5-row** (`presentation/components/FiveRow.tsx`; `DotGroup` and `SceneGroup` are built on it): five positions per row, filled left to right; 6–10 continue on a second row. Use it for every quantity that *changes* — things are added, removed, tapped, crossed out — and for the groups of a sum. Positions are fixed, so an item that appears or is crossed out never moves its neighbours; `total` reserves the places a group will grow into.
- **Die pattern** (`presentation/diePatterns.ts`): for a quantity that *stands still to be recognised* — the split pictures (two-colour die, twin dice), the huisje's roof aid.
- Two groups of a sum stand side by side as two 5-row segments (●●● + ●●), not merged into one cluster.
- Test proxy: a converted exercise file contains no `flexWrap` — quantities come from the shared components.
- A deliberate, known consequence of the concrete tiers: where the picture is on screen the answer can be counted. That is the intended support for the entry of `+` and especially `−`; the symbolic exercises take over through the middle of the curve.

**Warnings that are not errors.** A repeated split (`splits-vrij` nog-een, twee-huisjes) and a duplicate left number (`splits-alle`) are refused with a notice on the title band (`<ExerciseTitle warning=…>`) and another try. They are never counted wrong and never resolve the question.

**Audit status.** The exercises of `+1-2-tot-5`, `-1-2-tot-5` and `splitsen-noteren-5` follow W / R / C / L / Q (Nov 2026; L measured in a browser at both sizes). The others — the getalbegrip and splitsen-herken exercises — predate the conventions and are **not yet checked**: they are listed in `PENDING_AUDIT` in `conventions.test.ts`, which is the to-do list (code is authoritative; no copy here). **A later run must go through that list**: bring each exercise in line, declare `retryStable` + `correctStatement`, route answers through `useClosure`, draw quantities per Q, verify L in a browser, remove its id from the list. Until then they only get the safe default of W. A new exercise never goes on the list.

## Adding a new exercise type

1. Create `src/exercises/MyExercise.tsx` with a typed `Meta` interface, a component, and call `registerExercise(...)`.
2. Declare `const TIERS: ExerciseTier[]` (even a single `minScore: 0` tier). In `generateMeta`, derive the active tier with `pickTier(TIERS, score)` and stamp `meta.tierId = tier.id` — don't reintroduce an inline `pickStage`/threshold function. The component switches on the tier.
3. Wear the shell: render an `<ExerciseTitle>` and (unless pure choose-between-cards) an `<ExerciseStage>`, input outside it (see Unified exercise shell above).
4. Fill `tiers` and `didactics` on the definition (see Blueprint). Follow the behaviour conventions (W / R / C / L / Q, above): answer through `useClosure`'s `resolve(correct, { givenAnswer, tapCount })` — pass what you cheaply know so diagnostics can classify — declare `retryStable` and `correctStatement`, keep what is asked stable via `ctx.retryOf`, and check in a browser that nothing moves and the question fits.
5. Import it in `src/exercises/index.ts`.
6. Reference its id in any skill's `applicableExercises` in `skills.ts`.
7. Add a weight in `src/curriculum/weightMatrix.ts`. An applicable + registered exercise with zero weight everywhere is flagged as dead by `validate.ts` (dev console + `npm test`).

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
- An exercise reports `givenAnswer` (and `tapCount` for multi-step) via `useClosure`'s `resolve` wherever it cheaply can, so answers are classifiable.
- An exercise follows the behaviour conventions (W / R / C / L / Q) and declares `retryStable` + `correctStatement`.
- Every skill has an `EXERCISE_PLAN` entry.

## Review flag ⚑ (admin)

Parent tool for marking an exercise while the child plays it ("layout is off", "badly worded"), to look at later. Path: ⚙️ Opties → Ontwikkelaars → *⚑ Markeerknop tijdens het spelen* (per device, `state/deviceSettings.ts`, off by default).

**No separate store — the flag rides on the answer record.** The flag is just another field of the evidence stream, so an inspector of the data at rest finds flagged answers by filtering, and has everything needed to reconstruct the question next to it.

- **Using it.** The ⚐ button sits next to Opties in KidMode. Tap → *⚑ Gemarkeerd* (tap again to clear). It applies to the question on screen and resets on the next question. It is greyed out during the feedback overlay: the record is already written by then. A wrong answer's retry is a new question — flag that one if the wrong answer revealed the problem.
- **What gets recorded.** `AnswerRecord.flag = 'flagged'` (column `flag`). It is an app token, never free text — the record's privacy invariant (`answerRecord.ts`) forbids text typed by a person. A prepopulated reason list can add tokens to `AnswerFlag` later without a schema change (the column is text).
- **Reconstructing a flagged question.** Every record (flagged or not) carries `exerciseId`, `tierId`, `variant`, the typed `problem`, `meta` (what was shown, server-side only), `scene` (theme id + background / counter index into `THEMES`, `presentation/themes.ts`) and `viewport` (window size, CSS px). The inspector's replay re-renders it from exactly these.
- **Where flags exist.** Only answers that upload reach the server: linked profiles, logged in. Locally the record keeps the flag but not `meta` (stripped by the local sink). DebugMode has no flag button and never uploads. A flagged question abandoned before it is answered leaves no record.
- **Finding them:** the inspector (below) — *Toon: Gemarkeerd*. Or directly in the Supabase SQL editor:
  ```sql
  select occurred_at, exercise_id, tier_id, variant, problem, meta,
         scene_theme, scene_background, scene_counter, viewport_w, viewport_h,
         given_answer, correct, app_version
  from answer_events where flag is not null order by occurred_at desc;
  ```
- **Open question (deliberately not decided).** A flagged answer still counts: score ±, weight factor, stats. If a flag means "the exercise was broken", excluding flagged records from the weight-factor fold and stats is cheap (both are derivations over the stream); reverting the score is not. Decide once there is a sense of what flags actually mean in practice.

## Inspector 📖 (admin, separate page)

Parent tool for reading the account's answer stream: find the wrong and flagged answers, see their evidence, and replay the exercise as the child saw it. Path: ⚙️ Opties → Account (logged in) → *📖 Gegevens bekijken*, or open `…/Rekenen/inspector.html` directly on any device (it has its own login form).

**Separate from the app, by construction:**
- Its own page and Vite entry (`inspector.html` → `src/inspector/main.tsx`; `vite.config.ts` lists both inputs). The app only *links* to it. The app bundle contains no inspector code; the two pages share a chunk with React, the exercises and the Supabase client.
- `src/inspector/` may import app modules (exercise registry, skills, themes, `sync/rows` types). Nothing outside it may import from it.
- Its own Supabase client (`inspector/data.ts`), not the app's `sync` singleton: it never queues, pushes or deletes. **Read-only**: only `select`. It shares the login with the app (same origin, same browser storage), so *Uitloggen* there logs the app out in that browser too.
- `inspectorIsolation.test.ts` tripwires both rules (no app import of the inspector; no insert / upsert / update / delete / rpc in it).

**Who sees what** is decided by the database, not the page: row level security (migration 0001) gives a login only its own children. Not logged in → login form, no data.

**What it does:**
- **Filters:** child, period (vandaag / 7 / 30 dagen / alles), *Toon* (default *Te bekijken* = fout of gemarkeerd; also Gemarkeerd, Fout, Alles), exercise, skill. State lives in the URL hash (ids only), so a view is bookmarkable; j / k or ↓ / ↑ walk the list.
- **Per oefening:** first attempts in the period — n, wrong (count and %), ⚑, median response time; sorted flags first, then error rate; tap to filter.
- **List:** grouped per day; ✓/✗, ⚑, ↻ (retry), tier label, problem, answer, time, and the retry's outcome on the original. Retries are paired to the wrong answer just before them in the same session (`linkRetries`).
- **Detail:** every column in words (tier label, error type, score before, scene, viewport, app version), links between an answer and its retry, raw row + `meta`. **📋 Kopieer** puts the row on the clipboard as labelled JSON without the child id — for pasting into a chat about a fix.
- **Replay:** the real exercise component, built from the row (`rowToQuestion`: problem + stored `meta` + `is_retry`), in a frame the size of the recorded window, with the recorded theme / background / counter, KidMode's layout copied around it. Interactive; the result is shown and never saved. Scaled to fit, or 1:1. Rows without `meta` (pre-sync history, meta over the cap) offer an **approximation** — same problem and tier, freshly drawn layout — clearly labelled. Rows from before migration 0002 get a default scene and a 400 × 820 frame, also labelled.
- **⬇ Back-up (JSON):** children, progress, all answer and progress events of the login, one file.

**Limits worth knowing:**
- Replay copies KidMode's frame (`Replay.tsx`): if KidMode's chrome changes, update it there. Exercises size from their container (no viewport units), which is why a sized box reproduces their layout.
- Replay renders with the *current* code; the row's `app_version` says which build served it.
- For splits the stored correct answer is the *total*; the inspector shows only the given part and the verdict (`answerText`).
- Large periods are read in pages of 1000 (Supabase's default row cap), stopping at 50 000 rows.

## Progress override (admin)

Parent-facing tool to put a profile at a chosen point in the skill tree: recovery after lost localStorage (no backend yet), or starting a child who is already ahead. Kept after accounts land. Path: ⚙️ Opties → 🌳 on a profile card.

**Kept out of the engine.** `src/admin/` reads the curriculum graph and reuses the storage cascade (`applyEvaluations`, exported from `state/storage.ts` for this); nothing in `engine/` or the play loop imports it.

**Rules** (constants at the top of `progressOverride.ts`), for a chosen skill T:

| Action | T | Direct prereqs (`T.unlockedBy`) | Deeper ancestors |
|---|---|---|---|
| **Open hier** | unlocked, score 0, un-archived | 60 (`UNLOCK_THRESHOLD`) | 90 |
| **Beheerst** | 90 | 90 | 90 |

- Prereq scores are **raise-only** (`max(current, rule)`) — earned progress is never taken away. Only an *Open hier* target can drop; the preview shows drops in red and the confirm dialog repeats them.
- After writing, the normal unlock + archive cascade runs, so every skill whose prereqs are now met opens at its current score (intended — the engine's own rule). 90 < 100, so nothing archives directly; ancestors finish and archive after ~10 correct answers.
- Only reachable skills can be picked: T and all its ancestors must be non-`disabled` (`blockedBy`). WIP-gated skills show ⛔.
- A skill that is both a direct prereq and a deeper ancestor counts as direct (absent from today's graph; a test tripwires it).
- Restoring a mixed state = several actions in a row (e.g. *Open hier* on the frontier skill, *Beheerst* on a side branch like `getalbegrip-10` that is nobody's active prereq).
- Not restorable: the answer stream (weight factors restart at ×1).

## Dev commands

```
npm run dev       # Vite dev server (hot reload)
npm run typecheck # tsc --noEmit
npm test          # vitest — engine unit tests + curriculum consistency
npm run build     # production build
```

## Exercise invariants (locked)

- **The equation is always visible.** Every exercise shows the operation — with one documented exception (below). For splitsen the equation analog is the split statement ("5 is 2 en ?"): visible as text from the numeral tiers upward; at fully concrete tiers the structured visual (colour-split die, frame, huisje) carries the same statement.
  - **Exception — `rekenverhaal`, top tier only.** At `tekst` (80) the story hides the equation on the first attempt (the whole point is to read the words and extract the math). The tier below (`tekst-som`, 60) shows the sum forming alongside the sentences, and the retry (`question.isRetry`) shows it with the film. This is the single sanctioned exception, justified because showing the equation would let the child skip reading.
- **Reveal exercises build the equation piece by piece on a timer.** The sequence is: visual group A → `+` → visual group B → number A → `+` → number B → `= ?`. The child watches, input is locked until complete.
- **Reveal detail is each exercise's own concern.** Which steps are included and their timing depends on exercise type and score. High score → no reveal, equation is instant.
- **The visual is an illustration, not a gate.** Dots/scenes appear alongside their number, not instead of it.

## Key decisions (locked)

- Multi-profile from day one. localStorage is the working copy and stays so (local play needs no account); online accounts sync on top of it (road step 1)
- No audio in v2
- Subtraction is in scope for v2 (curriculum includes both addition and subtraction skills)
- No hidden admin — plain ⚙️ Opties button, kids can see it, no harm done
- Art direction parked — UI separated from logic for easy reskin
- Per-question records are captured, classified and persisted per profile; *acting* on the error types (error-driven remediation, per-fact sampling) is deferred until real play data exists
- Need-based skill scheduling is deliberately not built yet — uniform random pick stands until the WIP gates lift; the `SelectionContext` seam is where it lands
