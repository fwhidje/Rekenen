# REKENEN v2 — Skill & Exercise Map

> **Ownership note** — this document is authoritative for *curriculum design
> rationale*: the skill graph, the exercise-type catalog, the error taxonomy
> and the didactic decisions behind them. **Implementation status lives in
> `CLAUDE.md` only** — do not record build/weight status here; it rots. When
> code and this document disagree on *status*, trust `CLAUDE.md` and the code
> (`npm test` runs a curriculum-consistency check); when they disagree on
> *design intent*, flag it.

Working draft for the v2 curriculum data. Covers everything up to and including **splitsen tot 10** and **+/- tot 10** (end of L1 Period 2 in the Flemish progression). Out of scope here: getalbegrip tot 20, +/- tot 20 zonder brug, brug van 10. They extend the same shape and will be added later.

This is meant as input for Claude Code. All open questions from earlier drafts have been resolved (see *Resolved decisions* at the bottom); the questions raised since are listed under *Didactic frame → Open questions for the exercise round*.

**Flemish, not Dutch.** The progression, terms and notations here follow Flemish goal documents and teacher-training material. Extracts of the sources consulted are kept in `reference/flemish-curriculum/`. Dutch material (TAL, SLO, Dutch methods) is organised differently and is not a reference for this curriculum.

---

## Conventions

- **Skill IDs**: kebab-case, lowercase, scope-suffixed (e.g. `splitsen-6-7`, `aftrekken-wegnemen-5`).
- **Vocabulary**: Flemish (splitsen, tienvrienden, dubbel, helft, buurgetal, wegnemen, verschil, aanvullen) — not NL variants.
- **Score model**: each skill has its own 0–100 score; unlock threshold 60 (one-way); presentation difficulty lives in the score → exercise-type weight, not in the skill itself. Selection weights are additionally multiplied by a dynamic per-exercise factor that inflates on wrong answers, so a weak exercise recruits airtime and the score can't cross the threshold while a weakness is live — see `CLAUDE.md` → *Score model rationale* for why the scalar gate is sound.
- **Generator pattern**: a small predicate over (a, b, op) describing what the engine may sample for that skill.

### Three independent skill relationships

Each skill carries three pieces of metadata, each with one job:

- **`unlocked_by`** — list of skills that must be ≥ threshold for this skill to become available.
- **`unlocks`** — list of skills this skill (at threshold) opens up. Just the inverse of `unlocked_by` from the other side.
- **`subsumed_by`** — *single* skill that, once unlocked, archives this one when its own score caps at 100. `null` if this skill should never be archived in v2 scope (e.g. fact-recall drills like `tienvrienden`).

`subsumed_by` is **not** the inverse of `unlocks`. A skill can unlock several downstream skills but be subsumed by only one of them — usually a strict math superset further along the same track.

### Subsume rule

```
if child.score == 100 AND child.subsumed_by != null AND child.subsumed_by.unlocked == true:
    archive(child)
```

Score is preserved on archive. The skill no longer enters rotation. There is no auto-resurrection — once archived, a skill stays archived (unlocks are one-way per the v2 logic).

The combination "capped (100) AND parent unlocked" gives every skill a guaranteed period of dual-rotation with its parent before it drops out, so there's no risk of a half-learned skill being archived.

---

## Skill graph

The diagram below shows **unlock dependencies** only. Subsume relationships are listed in the per-skill entries and the audit table further down.

```
                              getalbegrip-5
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
       splitsen-herken-5  ──►  splitsen-noteren-5  getalbegrip-10
                │                                       │
        ┌───────┴───────┐              (+ splitsen-herken-5)
        │               │                    ┌──────────┴──────────┐
    +1-2-tot-5      -1-2-tot-5               │                     │
        │               │              splitsen-6-7          splitsen-8-9
        ▼               ▼                    │                     │
  optellen-tot-5   aftrekken-                ▼                     │
        │          wegnemen-5           tienvrienden               │
        │               ├──► aftrekken-verschil-5                  │
        │               └──► getalfamilie-5                        │
        │                                                          │
        │  (+ getalbegrip-10)                                      │
        ├────────► +1-2-tot-10                                     │
        │              │                                           │
        │              ▼                                           │
        │         +3-4-tot-10                                      │
        │              │                                           │
        │              │  (+ splitsen-6-7 + splitsen-8-9)          │
        │              └─────────►  optellen-tot-10  ◄─────────────┘
        │                                  │
        │                            ┌─────┴─────┐
        │                            ▼           ▼
        │                       dubbels-10   helften-10
        │
        │  (aftrekken-wegnemen-5 + getalbegrip-10)
        ├────────► -1-2-tot-10
                       │
                       ▼
                  -3-4-tot-10
                       │
                       │  (+ splitsen-6-7 + splitsen-8-9)
                       ▼
              aftrekken-wegnemen-10
                       ├──► aftrekken-verschil-10   (+ aftrekken-verschil-5)
                       └──► getalfamilie-10         (+ getalfamilie-5)
```

Decision recap: **the split bands only gate the *full* tot-10 arithmetic skills, not the +1-2 / +3-4 / -1-2 / -3-4 intermediates.** Splitsen knowledge isn't a hard prereq for counting on by 1, 2, 3, 4 — making it one risks stalling the whole arithmetic track. Splitsen becomes a hard prereq only at the full optellen-tot-10 / aftrekken-wegnemen-10 step.

**Splitsen-tot-5 split (decided)**: `splitsen-tot-5` is split into two skills — `splitsen-herken-5` (recognition / perceptual) and `splitsen-noteren-5` (notation / production). Recognition unlocks the +/- track; notation is parallel, not a prereq for arithmetic.

**Splitsen 6–10 split by total (decided, November 2026)**: the herken / noteren split is *not* mirrored. The totals are divided into bands instead — `splitsen-6-7` and `splitsen-8-9`, which unlock **together**, and `tienvrienden`, which holds the splits of 10 and unlocks from `splitsen-6-7`. Inside each band the score dial runs from recognition to production. Reasoning: *Didactic frame §7*.

- Both bands gate `optellen-tot-10` and `aftrekken-wegnemen-10`. They run in parallel, so the wait is the slower band, not the sum; `tienvrienden` gates neither. One gate more than before by count — if it turns out to stall, drop to `splitsen-8-9` alone.
- The bands do not wait for `splitsen-noteren-5`. Their weight curves start with recognition and bring the notations in mid-curve.

---

## Skills (detailed)

### Pre-arithmetic

#### `getalbegrip-5`
- **Name**: Getalbegrip tot 5 — number sense to 5
- **Intent**: Builds the bidirectional links between quantity, cijfersymbool, structured visual (dot / finger / ten-frame), and number-line position for 1–5 — the foundation everything else in the curriculum hangs off.
- **`unlocked_by`**: [] (root)
- **`unlocks`**: `splitsen-herken-5`, `getalbegrip-10`
- **`subsumed_by`**: `getalbegrip-10`
- **Generator**: pick n ∈ [1, 5]
- **Applicable exercise types**: `count-and-tap`, `dot-pattern-recognise`, `finger-pattern-recognise`, `numberline-place`, `compare-more-less`, `compare-pick`, `number-sequence-order`, `show-me-on-ten-frame`, `numberline-read`, `quantity-match`, `subitise-flash`

#### `getalbegrip-10`
- **Name**: Getalbegrip tot 10
- **Intent**: Extends number sense to 1–10 with the 5-structure made explicit (6 = 5 + 1, 7 = 5 + 2, …) — so 6–10 are seen through the 5-anchor, never counted from 1. Sets up the rekenrek and ten-frame as natural representations.
- **`unlocked_by`**: `getalbegrip-5`
- **`unlocks`**: `splitsen-6-7`, `splitsen-8-9`, `+1-2-tot-10`, `-1-2-tot-10`
- **`subsumed_by`**: `null` (would be `getalbegrip-20`, out of scope)
- **Generator**: n ∈ [1, 10], biased 70% to [6, 10] — the skill's identity is the 5-anchor extension; 1–5 keeps a refresh share
- **Applicable exercise types**: as `getalbegrip-5` plus `rekenrek-show`, `ten-frame-show`, `number-sequence-order`, `show-me-on-ten-frame`, `numberline-read`, `quantity-match`, `subitise-flash`

### Splitsen

#### `splitsen-herken-5`
- **Name**: Splitsen herkennen tot 5
- **Intent**: First half of the part-whole spine: perceptually identifies the two parts of a structured total 2–5. The recognition foundation under all upcoming +/− work; production (notation) runs in parallel.
- **`unlocked_by`**: `getalbegrip-5`
- **`unlocks`**: `splitsen-noteren-5`, `+1-2-tot-5`, `-1-2-tot-5`, `splitsen-6-7`, `splitsen-8-9`
- **`subsumed_by`**: `null` — no later split skill contains the totals 2–5
- **Generator**: total ∈ [2, 5] weighted 1:2:3:4 (linger on 5, the structural anchor; total 2 only has 1+1); (a, b) with a+b = total, a ≥ 1, b ≥ 1 (no trivial 0-splits)
- **Applicable exercise types**: `dot-pattern-decompose`, `splits-frame`, `splits-herken-huisje`, `same-split-or-different`, `splits-match`, `splits-shuffle`, `splits-build-it` *(rekenrek presentations deferred to tot-10 where the 5-structure earns them; see also parked: `dot-pattern-decompose-pad`)*

#### `splitsen-noteren-5`
- **Name**: Splitsen noteren tot 5
- **Intent**: Second half of the part-whole spine: produces splits of totals 2–5 in the canonical Flemish notations (splitshuisje, splitsbenen, missing-part equations). Where herken reads a split that's shown, noteren generates one or completes it — the production complement to recognition. Runs parallel to the +/− track, not a prereq for it.
- **`unlocked_by`**: `splitsen-herken-5`
- **`unlocks`**: *(nothing in the v2 graph — runs parallel to the +/- track, doesn't gate arithmetic)*
- **`subsumed_by`**: `null` — see `splitsen-herken-5`
- **Generator**: fact-proportional over totals 2–5 (5 naturally lingers — most splits); 0-splits join the fact space from score 30, accepted in splits-vrij and required in splits-alle.
- **Applicable exercise types**: `splitshuisje` (entry — the herken house, now written), `splitsbenen` (from 25 — second notation, transfer), `splits-ontbreken-rechts` ("5 is 3 en ?" wording → "5 = 3 + ?" equation form at 55, after + landed via the + track), then post-60: `splits-ontbreken-links`, `splits-vrij` (nog-een variety round), `splits-alle` (full table). **Boundary invariant vs herken**: the parts are never visible on screen — the roof die-aid is always an unsplit pattern; tier-0 choice is answer-entry scaffolding, numpad from ~30 is true production. Herken's `num-two` tier (74+) ≈ noteren's entry is the intended dual-rotation handover.

#### `splitsen-6-7` and `splitsen-8-9`
Two skills of the same shape — the former `splitsen-tot-10`, divided by total so that one score covers few enough facts to mean something (*Didactic frame §7*).

- **Name**: Splitsen van 6 en 7 / Splitsen van 8 en 9
- **Intent**: the part-whole spine for these totals: every split known paraat — the fact base that sums and differences to 10 are read from (getalfamilie), and that the brug over 10 later leans on.
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: (1) the missing part named at once, not counted — paraat knowledge of the splits to 10 is a Flemish minimum goal and, per the UCLL line, first-year work; (2) the splits organised, not loose facts — anchors (a part of 5, a part of 1, the dubbel), turn-around, neighbour step, and the full table per total; (3) the split usable as a getalfamilie, so that it can answer a sum or a difference later.
- **`unlocked_by`**: `splitsen-herken-5`, `getalbegrip-10` — both bands, at the same time
- **`unlocks`**: `optellen-tot-10`, `aftrekken-wegnemen-10` (both bands needed); `tienvrienden` (from `splitsen-6-7` only)
- **`subsumed_by`**: `null`
- **Generator**: fact-proportional over the band's ordered splits, a ≥ 1, b ≥ 1 — 11 for 6–7, 15 for 8–9. 0-splits are known from `splitsen-noteren-5` and appear only in the table exercise.
- **Picture**: the 5-structure throughout (two-colour 5-rows, tienveld, bead row coloured per five). No die patterns — they stop at 6.
- **Exercises**: *Exercise design for the next set → `splitsen-6-7` / `splitsen-8-9`*

#### `tienvrienden`
- **Name**: Tienvrienden / vrienden van 10
- **Intent**: instant recall of the 5 pairs that make 10 (1+9, 2+8, 3+7, 4+6, 5+5) in both orders — the splits of 10, practised until no thinking time is needed. Since the bands stop at 9, this skill also *teaches* the splits of 10, from the picture up.
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: (1) speed — the partner comes without counting, fingers or a picture; (2) from both sides and in every form (split, `7 + . = 10`, `10 − 7`); (3) its purpose is the brug over 10, where the second term is split without attention being spent on it. This is the one skill whose goal a right/wrong score does not measure — *Didactic frame §1*.
- **`unlocked_by`**: `splitsen-6-7`
- **`unlocks`**: future `brug-van-10` (out of scope)
- **`subsumed_by`**: `null` — fact-recall drill, kept in rotation through brug van 10
- **Generator**: a ∈ [1, 9], b = 10 − a
- **Exercises**: *Exercise design for the next set → `tienvrienden`*

### Optellen

#### `+1-2-tot-5`
- **Intent**: add 1 or add 2 within 5 — counting on, no structural reasoning required. Introduces the `+` sign and the equation form, with the erbij action as its meaning.
- **`unlocked_by`**: `splitsen-herken-5`
- **`unlocks`**: `optellen-tot-5`
- **`subsumed_by`**: `optellen-tot-5`
- **Generator**: uniform over the 7 facts (a+1 for a ∈ [1,4], a+2 for a ∈ [1,3]); post-60 a ~30% share arrives small-addend-first (`1 + 4`) as commutativity material — symbolic exercises display it as written (fill-vis demonstrates the explicit term swap), action exercises enact from the larger operand.
- **Applicable exercise types**: `erbij-tap`, `fill-vis` (erbij/samenvoegen variants with canonical cue phrases), `numberline-jump`, `doosje`, `choice`, `tf`, `fill-plain`. The erbij action dominates at low score; symbolic forms take over toward 100. Post-60 width pair: `splits-som-match` (relation probe) and `rekenverhaal` (semantics by words alone).

#### `optellen-tot-5`
- **Intent**: any optelling within 5 (a + b ≤ 5) — the sums are no longer counted but read from the splits (getalfamilie), in either order
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: the skill adds **no new facts** — its three sums beyond `+1-2-tot-5` (1 + 3, 1 + 4, 2 + 3) are turn-arounds that skill already serves post-60. Its content is a change of method: (1) the sum known from the split, not counted on; (2) van plaats wisselen as a property the child uses; (3) one sum for both meanings, erbij and samen. *Didactic frame §1, §2.*
- **`unlocked_by`**: `+1-2-tot-5`
- **`unlocks`**: `+1-2-tot-10`
- **`subsumed_by`**: `optellen-tot-10`
- **Generator**: a ∈ [1, 4], b ∈ [1, 5−a]; zero terms (a + 0, 0 + a) to be added, down-weighted (*Exercise design → shared rules, 3*)
- **Exercises**: *Exercise design for the next set → `optellen-tot-5`*

#### `+1-2-tot-10`
- **Intent**: add 1 or 2 within 10 — still counting on, but a wider range
- **`unlocked_by`**: `optellen-tot-5`, `getalbegrip-10`
- **`unlocks`**: `+3-4-tot-10`
- **`subsumed_by`**: `optellen-tot-10`
- **Generator**: a ∈ [1, 9], b ∈ {1, 2}, a + b ≤ 10
- **Applicable exercise types**: as `+1-2-tot-5`

#### `+3-4-tot-10`
- **Intent**: add 3 or 4 within 10 — the stepping-stone where derived-fact reasoning (dubbels, near-dubbels) starts mattering
- **`unlocked_by`**: `+1-2-tot-10`
- **`unlocks`**: `optellen-tot-10`
- **`subsumed_by`**: `optellen-tot-10`
- **Generator**: a ∈ [1, 7], b ∈ {3, 4}, a + b ≤ 10
- **Applicable exercise types**: full set; `rekenrek-add` becomes appropriate

#### `optellen-tot-10`
- **Intent**: any optelling within 10
- **`unlocked_by`**: `+3-4-tot-10`, `splitsen-6-7`, `splitsen-8-9`
- **`unlocks`**: `dubbels-tot-10`, `helften-tot-10`
- **`subsumed_by`**: `null` (would be `optellen-tot-20`)
- **Generator**: a ∈ [1, 9], b ∈ [1, 10−a]
- **Applicable exercise types**: full set

#### `dubbels-tot-10`
- **Intent**: knows 1+1, 2+2, 3+3, 4+4, 5+5
- **`unlocked_by`**: `optellen-tot-10`
- **`unlocks`**: future `dubbels-tot-20`
- **`subsumed_by`**: `null` — fact-recall drill
- **Generator**: a = b ∈ [1, 5]
- **Applicable exercise types**: `fill-plain`, `choice`, `tf`, `dubbel-recognise`

#### `helften-tot-10`
- **Intent**: knows half of 2, 4, 6, 8, 10
- **`unlocked_by`**: `optellen-tot-10`
- **`unlocks`**: future `helften-tot-20`
- **`subsumed_by`**: `null` — fact-recall drill
- **Generator**: total ∈ {2, 4, 6, 8, 10}
- **Applicable exercise types**: `fill-plain`, `choice`, `splits-helft`

### Aftrekken

#### `-1-2-tot-5`
- **Intent**: take away 1 or 2 within 5 — counting back. Introduces the `−` sign, with the wegnemen action (things leave) as its meaning.
- **`unlocked_by`**: `splitsen-herken-5`
- **`unlocks`**: `aftrekken-wegnemen-5`
- **`subsumed_by`**: `aftrekken-wegnemen-5`
- **Generator**: uniform over the 9 facts (a−1 for a ∈ [1,5], a−2 for a ∈ [2,5]), including the two "alles weg" → 0 facts (1−1, 2−2), damped ×0.25 below score 30 so 0 doesn't appear before the action-meaning is anchored.
- **Applicable exercise types**: `wegneem-tap`, `wegnemen-crossed-out` (low flat share throughout — the werkboek form), `fill-vis` (wegnemen reveal grammar: the leave IS the − sign's meaning), `numberline-jump-back`, `doosje`, `choice` (crossed-dots aid), `tf` (reversal traps "2 − 5 = 3" at the strikt tier — the only place order-sensitivity is tested), `fill-plain`. Entry more concrete-heavy than the + mirror: backward counting is weaker than forward. Post-60 width pair: `splits-som-match` (relation probe) and `rekenverhaal` (semantics by words alone).

#### `aftrekken-wegnemen-5`
- **Intent**: take-away meaning within 5 — "ik had 5, ik geef 3 weg, hoeveel blijft over?" — answered from the getalfamilie rather than counted back
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: six facts are new over `-1-2-tot-5` (3 − 3, 4 − 3, 5 − 3, 4 − 4, 5 − 4, 5 − 5), exactly where counting back gets long and fragile. So: (1) the difference known from the getalfamilie; (2) + and − as each other's omgekeerde bewerking — the four familieopgaven of one family; (3) the sign read, now that + and − rotate together. *Didactic frame §1, §2, §3.*
- **`unlocked_by`**: `-1-2-tot-5`, `optellen-tot-5`
- **`unlocks`**: `aftrekken-verschil-5`, `getalfamilie-5`, `-1-2-tot-10`
- **`subsumed_by`**: `aftrekken-wegnemen-10`
- **Generator**: a ∈ [2, 5], b ∈ [1, a]; a − 0 to be added, down-weighted together with a − a
- **Exercises**: *Exercise design for the next set → `aftrekken-wegnemen-5`*

#### `aftrekken-verschil-5`
- **Intent**: difference meaning — "Anna heeft 5, Tom heeft 2, hoeveel meer Anna?" Both groups still exist; nothing is removed. The Flemish goal documents call this aftrekken als *vergelijking*.
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: the arithmetic is already known — the work is (1) the relational question "hoeveel meer / hoeveel minder" (terms the minimum goals already list for kleuters), (2) pairing off as the action that makes a difference visible, (3) seeing that a − sum fits although nothing leaves, larger number first. *Didactic frame §3.*
- **`unlocked_by`**: `aftrekken-wegnemen-5`
- **`unlocks`**: `aftrekken-verschil-10`
- **`subsumed_by`**: `aftrekken-verschil-10`
- **Generator**: same math as `aftrekken-wegnemen-5`, including a = b (a difference of 0 — kept on purpose)
- **Exercises**: *Exercise design for the next set → `aftrekken-verschil-5`*

#### `getalfamilie-5`
*(was `aftrekken-aanvullen-5`; redefined November 2026 — Didactic frame §2, §3)*
- **Name**: Getalfamilies tot 5
- **Intent**: one family, every view: a whole and two parts, any one of them unknown, in any notation — the split, both sums, both differences and the puntoefening `2 + . = 5`. Home of the missing-part meanings: aanvullen tot ("Tom heeft 2 en wil 5. Hoeveel erbij?") and combinatie with a part unknown ("5 potloden, 2 zijn blauw, de rest rood").
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: (1) the puntoefening solved from the getalfamilie, not by trying or counting up; (2) split, sum and difference recognised as one fact in several notations — the four familieopgaven; (3) the = sign read as a relation — this is the first sum whose unknown is not at the end.
- **`unlocked_by`**: `aftrekken-wegnemen-5` (which itself needs `optellen-tot-5`)
- **`unlocks`**: `getalfamilie-10`
- **`subsumed_by`**: `getalfamilie-10`
- **Generator**: a family is a split problem (whole = a + b), fact-proportional over totals 2–5; the exercise chooses which member is asked and in which notation.
- **Exercises**: *Exercise design for the next set → `getalfamilie-5`*

#### `-1-2-tot-10`
- **Intent**: take away 1 or 2 within 10
- **`unlocked_by`**: `aftrekken-wegnemen-5`, `getalbegrip-10`
- **`unlocks`**: `-3-4-tot-10`
- **`subsumed_by`**: `aftrekken-wegnemen-10`
- **Generator**: a ∈ [1, 10], b ∈ {1, 2}, b ≤ a
- **Applicable exercise types**: as `-1-2-tot-5`

#### `-3-4-tot-10`
- **Intent**: take away 3 or 4 within 10 — derived-fact reasoning starts mattering
- **`unlocked_by`**: `-1-2-tot-10`
- **`unlocks`**: `aftrekken-wegnemen-10`
- **`subsumed_by`**: `aftrekken-wegnemen-10`
- **Generator**: a ∈ [3, 10], b ∈ {3, 4}, b ≤ a
- **Applicable exercise types**: full subtraction set

#### `aftrekken-wegnemen-10`
- **Intent**: take-away meaning within 10
- **`unlocked_by`**: `-3-4-tot-10`, `splitsen-6-7`, `splitsen-8-9`
- **`unlocks`**: `aftrekken-verschil-10`, `getalfamilie-10`
- **`subsumed_by`**: `null` (would be `aftrekken-wegnemen-20`)
- **Generator**: a ∈ [2, 10], b ∈ [1, a]
- **Applicable exercise types**: full subtraction set

#### `aftrekken-verschil-10`
- **Intent**: difference meaning within 10
- **`unlocked_by`**: `aftrekken-wegnemen-10`, `aftrekken-verschil-5`
- **`unlocks`**: future `aftrekken-verschil-20`
- **`subsumed_by`**: `null`
- **Generator**: a ∈ [2, 10], b ∈ [1, a]; presentation always two-groups
- **Applicable exercise types**: as `aftrekken-verschil-5` extended

#### `getalfamilie-10`
*(was `aftrekken-aanvullen-10`)*
- **Intent**: one family, every view, for the totals 6–10
- **`unlocked_by`**: `aftrekken-wegnemen-10`, `getalfamilie-5`
- **`unlocks`**: future `getalfamilie-20`
- **`subsumed_by`**: `null`
- **Generator**: fact-proportional over the splits of 6–10
- **Applicable exercise types**: as `getalfamilie-5`

---

## Didactic frame — tot-5 arithmetic, splitsen tot 10, tienvrienden

Scope: `optellen-tot-5`, `aftrekken-wegnemen-5`, `aftrekken-verschil-5`, the missing-part skill (then `aftrekken-aanvullen-5`, now `getalfamilie-5`), the splits of 6–10 (then one skill `splitsen-tot-10`, now `splitsen-6-7` and `splitsen-8-9`) and `tienvrienden`. The goal and the pitfalls of each skill are in `skills.ts` (`didactics`); this section holds the reasoning behind them and the questions they raised. §1–§7 were written before the skills were restructured and before any exercise was designed, and keep the names of that moment; the answers and what followed are at the end of the section, the exercises in *Exercise design for the next set*.

### Sources and how far they carry

| Claim rests on | What | Confidence |
|---|---|---|
| Read (extracts in `reference/flemish-curriculum/`) | Flemish minimumdoelen wiskunde (reading version); GO! doelenset bewerkingen, goals WI.265–WI.281; four UCLL documents (leerlijn hoofdrekenen, leerlijn getallenkennis, overzicht bewerkingen, vakdidactisch kader) | Quoted directly. The minimumdoelen give milestones (end of kleuterschool, 4th year), not years; the GO! age grid was lost in extraction; the UCLL lines are the only source here that says "first year" |
| Not read | ZILL leerplan, OVSG leerplan, the teacher's guide of any Flemish method | Unknown — in particular which method the child's school uses, and what it does differently |
| Not sourced | Which splits and pairs are the hard ones; how the counting habit shows in response times; how hard "hoeveel meer" is at this age | Reasoned from the structure of the facts and general didactic background, not checked against a Flemish source. Marked "expected" where they appear in `skills.ts`; to be checked against play data |

### 1. The common goal: from counting to knowing

`+1-2-tot-5` and `-1-2-tot-5` rest on counting on and counting back, and rightly: the UCLL overview lists doortellen ("4. Twee erbij, 5, 6.") and terugtellen ("8. Drie eraf, 7, 6, 5.") among the standaardmethoden. The skills in this set are where that method is replaced:

- UCLL, first year: "Standaardmethode gebruiken om som en verschil te vinden — < 10: op basis van splitsen … en deze resultaten automatiseren."
- GO!: "Tellen op door parate kennis van de getalfamilies te gebruiken" (WI.274), "Trekken af door parate kennis van de getalfamilies te gebruiken" (WI.278).
- Minimumdoelen: "paraat de splitsingen tot en met 10" and "paraat de optellingen en aftrekkingen tot en met 20"; and on how a fact becomes known: "Feitelijke kennis bereik je niet door te memoriseren, maar door te automatiseren. Daarbij maakt een leerling zich een strategie eigen, die hij steeds opnieuw oefent en verkort."

What follows for the skills:

- **`optellen-tot-5` has no new facts.** It has 10 sums (a, b ≥ 1). Seven are the `+1-2-tot-5` facts; the other three (1 + 3, 1 + 4, 2 + 3) are the turn-arounds that skill's generator already serves above score 60. The skill's content is the method: the sum read from the split.
- **`aftrekken-wegnemen-5` has six new facts** (3 − 3, 4 − 3, 5 − 3, 4 − 4, 5 − 4, 5 − 5) — those where counting back takes three or four steps. That is the natural place for the getalfamilie to take over.
- **The score cannot see the difference.** A child who counts every sum correctly climbs to 100. The one observable is response time, which answer records carry and nothing uses. This matters most for `tienvrienden`, whose whole goal is speed. No gate is proposed here — a fluency gate was built and removed (`CLAUDE.md` → Score model rationale) — but the exercise round has to say how these skills will tell knowing from counting (open question 1).

### 2. The getalfamilie is the unit

The GO! goals treat one family as one piece of knowledge: fill the missing part ("5 bestaat uit 3 en ? … Dat is 2", WI.270), add from it, subtract from it, solve a puntoefening from it (WI.275), give its four familieopgaven ("2 + 3 = 5, 5 – 3 = 2, 3 + 2 = 5, 5 – 2 = 3", WI.280), give all families of a number (WI.281).

In this curriculum the facts of one family are spread over up to five skills (herken, noteren, optellen, wegnemen, aanvullen), each with its own score. Only `splits-som-match` crosses between them (and `splits-ontbreken-rechts`, which the aanvullen skills share with noteren). Mastering the skills one by one does not guarantee the connection — and the connection is the goal. Where it gets exercised is open question 2.

### 3. Meanings: the Flemish taxonomy against the three subtraction skills

The minimumdoelen (kleuters, with concrete material, to 10; again for the 4th year) and GO! use the same three situation types for **both** optellen and aftrekken: **oorzaak-verandering**, **combinatie** (GO!: "deel-geheel") and **vergelijking**. UCLL uses the same terms. This curriculum's wegnemen / verschil / aanvullen came from a different cut. How they line up:

| Here | Flemish type | Fit |
|---|---|---|
| `fill-vis` erbij variant | optellen als oorzaak-verandering ("Hij krijgt er 3 bij") | same |
| `fill-vis` samenvoegen variant | optellen als combinatie ("2 rode en 6 blauwe … samen?") | same |
| — | optellen als vergelijking ("Sara heeft er 3 meer dan Soetkin. Hoeveel boeken heeft Sara?") | **absent** |
| `aftrekken-wegnemen-*` | aftrekken als oorzaak-verandering ("Hij eet er 3 op") | same |
| `aftrekken-verschil-*` | aftrekken als vergelijking | partly — see below |
| `aftrekken-aanvullen-*` | not a situation type | see below |
| — | aftrekken als combinatie ("9 kleurpotloden. 6 zijn blauwe, de rest zijn rode. Hoeveel rode?") | **absent** |

- **Verschil.** The sources show two comparison questions. The difference unknown ("hoeveel heeft Filip er minder?") is the kleuter example, with concrete material. The compared amount unknown ("Sara heeft er 3 minder dan Soetkin. Hoeveel boeken heeft Sara?") is the example for the written aftrekking. The verschil skill as defined covers only the first.
- **Aanvullen.** In these sources aanvullen is not a meaning of aftrekken next to the others. It appears as the puntoefening solved from the getalfamilie (WI.275; UCLL: "Verband tussen + en – (dit gebruiken in o.a. puntoefeningen …)"), as a way of wording a subtraction ("de aftrekking als het aanvullen van de tweede term om het verschil te vinden (indirect optellen)", WI.277), and as the term "aanvullen tot". The story "Tom heeft 2 en wil 5" is an oorzaak-verandering with the change unknown.
- **Combinatie with a part unknown** has no home. It is the static twin of aanvullen — a whole and one part are known, the other part is asked — and the meaning closest to splitsen itself.
- The UCLL first-year line names oorzaak-verandering and vergelijking for aftrekken, all three for optellen.

Recommendation, not a decision: keep three subtraction skills, but define `aftrekken-aanvullen-*` as the **missing-part** skill — combinatie with a part unknown and aanvullen tot, with the puntoefening as its notation. That covers the gap without a fourth skill. Whether the comparison with the compared amount unknown, and optellen als vergelijking, belong in this range at all is open question 3.

### 4. The = sign

Minimumdoel 2.2.5, with its own comment: "het gelijkheidsteken wordt vaak uitsluitend als signaal gezien om iets uit te rekenen, terwijl het slaat op een gelijkheid tussen beide zijden". UCLL asks for "speciale aandacht voor de betekenis van het gelijkheidsteken" in the first year. The puntoefening is the first place this bites: with the unknown before the =, "work out what stands there" gives 2 + . = 5 → 7. `splitsen-noteren-5` already prepares it ("5 = 3 + ?" as the second equation shape the child meets); the aanvullen skill is where it is tested.

### 5. Nul

UCLL, first year: "commutativiteit en neutraal element voor de optelling en aftrekking onderzoeken". Here a − a = 0 exists (`-1-2-tot-5`, `aftrekken-wegnemen-5`) and 0-splits exist (`splitsen-noteren-5`), but a + 0, 0 + a and a − 0 are generated by no skill. Open question 4.

### 6. Which picture carries 6–10

Totals above 5 cannot be taken in at a glance; a split of 8 is read from a structured picture or known. This curriculum has built on the **5-structure** so far (5-row, tienveld, fingers; `getalbegrip-10` reads 6–10 as 5 + n). The UCLL framework chooses the **kwadraatbeeld** — quantities built from a square of four — and says it "heeft heel wat voordelen ten opzichte van andere getalbeelden, voornamelijk wat betreft het automatiseren van o.a. de splitsingen". It also draws a split as one picture cut by a dividing line, and warns against the picture where the parts are drawn again under the whole.

These are different anchors: with a 5-structure, 7 is 5 en 2 comes for free and 4 en 3 does not; with squares of four it should be the other way round (inferred from how the picture is built — only the kwadraatbeelden of 5 and 6 were seen). One teacher-training source is not "the Flemish way", and methods differ. What matters is what the child sees at school. Open question 5 — and the parked rekenrek question (`CLAUDE.md` → Parked) is the same question.

### 7. `splitsen-tot-10`: size, and the herken / noteren question

**Against mirroring the tot-5 split.** `splitsen-tot-5` was split because recognition had to gate the + / − track while notation ran alongside. At tot 10 that reason is gone: every downstream skill (`tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10`) needs splits that are *known*, which is the production side. A `herken-10` could not be their gate, and as a non-gate it would be the low-score phase of `noteren-10` — which the score dial already provides inside one skill. The notations are no longer new either.

**The real problem is size.** Totals 2–5 have 10 ordered splits; totals 6–10 have 35 (19 if order is ignored), under one score. Eleven of the 19 have an anchor in a 5-structure — a part of 1, a part of 5, or a dubbel. The other eight (2 + 4, 3 + 4, 2 + 6, 2 + 7, 3 + 6, 2 + 8, 3 + 7, 4 + 6) have none, and a child can cross 60 on the anchored ones while these are still counted. The dynamic weight factor protects against a weak *exercise*, not a weak *fact*. Three ways out:

| Option | For | Against |
|---|---|---|
| A. One skill, plus per-fact sampling from the answer stream (`GenerateContext.recentRecords`) | no graph change; the seam exists | per-fact sampling is deliberately deferred; the score still averages over 35 facts |
| B. Split by total, e.g. `splitsen-6-7` → `splitsen-8-9`, with the splits of 10 taught and drilled in `tienvrienden` | skills stay narrow, as everywhere else in the graph; totals are met in turn; ends the double coverage of the splits of 10 | graph change; `tienvrienden` must then teach, not only drill; what gates `optellen-tot-10` needs redeciding |
| C. One skill per total | closest to "one number at a time" | five small skills; most rotation overhead |

Lean: B. It is the same move as `+1-2` / `+3-4` before `optellen-tot-10`. Open question 6.

Whatever is chosen: the splits of 10 are today both 9 of the 35 facts of `splitsen-tot-10` and the whole of `tienvrienden`, and neither skill is ever archived.

### Open questions for the exercise round

1. **Knowing versus counting.** How do these skills tell a known answer from a counted one, given that the score is right/wrong only? At least for `tienvrienden`.
2. **Getalfamilie.** Where is the connection between split, sums and differences exercised — a familieopgaven exercise type, and under which skill?
3. **Comparison.** Do "3 meer dan / 3 minder dan" with the compared amount unknown, and optellen als vergelijking, belong in the tot-5 range, or later?
4. **Nul as a term.** Do a + 0, 0 + a and a − 0 enter `optellen-tot-5` / `aftrekken-wegnemen-5`, and from which score?
5. **Getalbeeld for 6–10.** Which structured pictures does the child's school method use (kwadraatbeeld, 5-structure, both)? Decide before any tot-10 exercise is drawn.
6. **Shape of `splitsen-tot-10`.** Options A / B / C above, and with it what `tienvrienden` is.
7. **Missing-part skill.** Redefine `aftrekken-aanvullen-*` as proposed in §3?
8. **Verschil of 0.** The generator allows a = b; "hoeveel meer?" with answer 0 is an evenveel question — keep, reword, or exclude?

### Answers so far (Filip, November 2026)

Directions, given before any exercise was designed. "Decided" is settled; "direction" still needs a design; "proposed" is a suggestion that has not been accepted.

| # | Answer | State |
|---|---|---|
| 1 | Timed answers: a time allowance on the first attempt, a longer one on the retry. Not for typed (numpad) answers — the child's dexterity would dominate. Needs testing and balancing. | Direction. Designed as `snel-weten` (*Exercise design → shared rules, 4*), in a softer form than a visible limit: slow-but-correct is not wrong and is never shown as slow. **Accepted** (November 2026): build this form; a visible limit can be added later as a higher tier |
| 2 | Getalfamilie matters enough to be a skill of its own, or at least part of a skill that follows from the + and − skills. No new node: the missing-part skill (answer 7) is the getalfamilie skill — "a whole and two parts, any one of them unknown, in any notation" is one piece of knowledge. | Decided and in the graph: `getalfamilie-5` / `getalfamilie-10`, a split problem whose exercise chooses the view |
| 3 | Later than tot 5 — as `rekenverhaal` variants in the tot-10 range. | Decided |
| 4 | Yes: a + 0, 0 + a and a − 0 belong, from the start of `optellen-tot-5` / `aftrekken-wegnemen-5`. | Decided. Designed: about 15% of the draws; each exercise says whether it can show a zero (*shared rules, 3*). Not yet in the generators |
| 5 | Leave as is: the 5-structure stays, because it carries the tienvrienden. The child is still in the kleuterklas, so the school's method is unknown. | Decided. Look again when he enters the first year |
| 6 | Option B (split by total), with two conditions: it must not bore, and it must not gate everything else. The 6–7 and 8–9 bands unlock **at the same time**; `tienvrienden` unlocks after `splitsen-6-7`; `splitsen-herken-5` and `splitsen-noteren-5` are no longer archived. | Decided and in the graph. Both bands gate the full tot-10 sums (in parallel); `tienvrienden` gates nothing. The bands do not wait for `splitsen-noteren-5` |
| 7 | Yes — redefine `aftrekken-aanvullen-*` as the missing-part skill. | Decided (see 2) |
| 8 | Leave as is: "0 meer" is correct. Usage data will show whether it is always answered wrong. | Decided |

### The background document, checked against this frame

`reference/l1_maths_didactics_belgie.md` is the project's own background text on first-year didactics — the source of this curriculum's wegnemen / verschil / aanvullen cut and of the terms "movement 5", "mastery width" and "language gradient" used in the catalog. It reached this frame after the sections above were written. What it changes and what it does not:

- **It supports** the getalfamilie decision (its movement 5: 3 + 4, 4 + 3, 7 − 3, 7 − 4 and the split as five views of one fact), the split by total (totals met one at a time, 10 singled out), the 5-structure (rekenrek and tienveld as the standard tools), and the speed goals (under 3 s for a known fact, under 2 s for tienvrienden).
- **It shaped the design**: speed pressure before automatisation is named as harmful and as a source of maths anxiety, hence the soft form of `snel-weten`. Structured finger use is named as a strength, not a crutch — hence the `vingers` variant of `maak-tien`, and the pitfall wording "counting by ones", never "using fingers". Aanvullend optellen is named as a Flemish strength — hence `numberline-gap`. The principle error it cites from Dowker is the `buur` tier of `omkeer-som`. Its remediation move "step down the ladder" is the retry rule.
- **Where it and the documents read disagree**: it presents wegnemen / verschil / aanvullen and samenvoegen / erbij / aanvullen as "the Flemish framing"; the minimumdoelen, GO! and UCLL use oorzaak-verandering / combinatie / vergelijking (§3). The decisions above follow the documents. It also equates kwadraatbeelden with dobbelsteenpatronen; in the UCLL framework the kwadraatbeeld is a different picture (§6).
- **Its warning against deferring meanings** (semantic narrowing) is met for subtraction — verschil and the missing-part meanings exist at tot 5. What is deferred is only the harder comparison question with the compared amount unknown.
- **Not checked**: it cites no sources for its claims on Flemish practice, and its research references (Thevenot, Torbeyns and Verschaffel, Dowker) were not read here. Its §15 describes an older state of the app.

---

## Subsume audit table

Every in-scope skill, its `subsumed_by` value, and the strict-superset check that justifies it.

| Skill | `subsumed_by` | Strict superset? |
|---|---|---|
| `getalbegrip-5` | `getalbegrip-10` | ✓ |
| `getalbegrip-10` | `null` | — (out of scope parent) |
| `splitsen-herken-5` | `null` | no later split skill contains the totals 2–5 |
| `splitsen-noteren-5` | `null` | same |
| `splitsen-6-7` | `null` | — |
| `splitsen-8-9` | `null` | — |
| `tienvrienden` | `null` | fact-recall, deliberate |
| `+1-2-tot-5` | `optellen-tot-5` | ✓ |
| `optellen-tot-5` | `optellen-tot-10` | ✓ |
| `+1-2-tot-10` | `optellen-tot-10` | ✓ |
| `+3-4-tot-10` | `optellen-tot-10` | ✓ |
| `optellen-tot-10` | `null` | — |
| `dubbels-tot-10` | `null` | fact-recall |
| `helften-tot-10` | `null` | fact-recall |
| `-1-2-tot-5` | `aftrekken-wegnemen-5` | ✓ |
| `aftrekken-wegnemen-5` | `aftrekken-wegnemen-10` | ✓ |
| `aftrekken-verschil-5` | `aftrekken-verschil-10` | ✓ |
| `getalfamilie-5` | `getalfamilie-10` | ✓ |
| `-1-2-tot-10` | `aftrekken-wegnemen-10` | ✓ |
| `-3-4-tot-10` | `aftrekken-wegnemen-10` | ✓ |
| `aftrekken-wegnemen-10` | `null` | — |
| `aftrekken-verschil-10` | `null` | — |
| `getalfamilie-10` | `null` | — |

---

## Exercise type catalog

Grouped by what they teach. Each type has a unique id; the score → exercise-type weight matrix references these.

### Splitsen recognition (perceptual)

These types live under `splitsen-herken-5` / `-10`. They show a total and ask "what are the parts?" — answered by tapping or typing the missing part. No standard notation involved.

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `dot-pattern-decompose` | total shown as die-pattern dots, child picks the missing part | structured dots (1 or 2 dies) | 4-choice buttons | low–mid |
| `splits-frame` | known part in the frame, missing part a '?'; choose (dots → numerals) or type it, then watch the parts merge back into the whole — composition made visible | part + '?' frame, reveal-and-merge | choice / numpad (per tier) | low–high |
| `splits-herken-huisje` | splitshuisje-shaped scaffold for recognition: total on the roof, two part-rooms below, child fills/picks the parts | splitshuisje silhouette + dots/numerals per tier | drag / choice (per tier) | low–mid |
| `same-split-or-different` | two splits shown; "is it the same split or different?" (order-independence; cross-representation at higher score) | two split visuals | ja / nee | low–mid |
| `splits-match` | match a split across representations (dots ↔ splitshuisje ↔ notation); face-up pair-forming mid-score, memory-pairs at the top | mixed split representations | choice / tap | mid |
| `splits-shuffle` | a whole visibly splits into two groups while the original stays greyed as referent; conservation verified by comparison (some rounds cheat by one dot), then identify the resulting split | animated whole→split, greyed original | ja-nee / choice | low–mid |
| `splits-build-it` | tap a gap to cut the row into two groups, then name the hidden part of your own split; at higher score "Splits 5 in 2 en 3" with either cut order accepted | dot row | tap-to-cut + choice | low–mid |

> **Parked**: `dot-pattern-decompose-pad` — same visual as `dot-pattern-decompose` but numpad input instead of choice buttons; would only be weighted from score ≥ 12 (i.e. where the child already reads numbers). Uncertain whether this adds enough over `splits-frame` tier 3 to be worth building as a separate exercise type.

> Implementation status of every exercise type lives in **CLAUDE.md → Exercise file status** (ownership note at the top of this file).

### Splitsen notation (production)

These types live under `splitsen-noteren-5` / `-10`. They use the canonical Flemish primary-school notations.

Production rule (the herken/noteren boundary): **the parts are never shown** — at most the unsplit total (die-aid) and one part as a bare numeral. The missing part comes out of the child's part-whole knowledge, not off the screen.

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `splitshuisje` | The Flemish house notation: total on the roof (unsplit die-aid at the lowest tier), parts written in the rooms. Tiers: one room prefilled + choice → bare numpad → two houses, two different splits | the house | choice → numpad | low–mid (canonical scaffold) |
| `splitsbenen` | Total with two "legs" down to the parts — the compact second notation; introduced after the huisje (transfer: same fact, new clothes) | the legs diagram | choice → numpad | mid |
| `splits-ontbreken-rechts` | `5 is 3 en ?` → `5 = 3 + ?` (equation form from its 55 tier, once + landed via the + track). Total-first = splits notation, NOT the aanvulsom. Also serves the aanvullen skills (op −) | statement only | choice → numpad | mid |
| `splits-ontbreken-links` | `5 = ? + 3` — the harder position: the slot reads before the given part | statement only | choice → numpad | post-60 |
| `splits-vrij` | "Geef een splitsing van 5" — open, multiple correct, 0-splits accepted. The nog-een tier (60) demands a SECOND, different split (order-equivalent = same): variety against one-split bias | statement under construction | numpad ×2 | post-35 |
| `splits-alle` | The full descending table of one total, both orders + 0-rows, as workbooks print it. Tiers: left column pre-printed → empty table | the huisje-table | numpad multi | post-60 capstone |

### Number-sense / pre-arithmetic

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `count-and-tap` | tap each item to count | scene with N items | tap | low |
| `dot-pattern-recognise` | "hoeveel?" with a dice/structured dot pattern | structured dots | choice / numpad | low–mid |
| `finger-pattern-recognise` | hand picture, kid identifies how many | hands | choice | low |
| `numberline-place` | "waar staat 7?" | empty number line | tap on line | mid |
| `compare-more-less` | which group has more/fewer (two groups), growing into meest/minst across three; counter size and spacing vary per group so row length is no cue | 2–3 counter groups | tap group | low–mid |
| `compare-pick` | given anchor A and a relation — meer dan / minder dan / evenveel als — pick the B that satisfies it; the home of evenveel and of per-relation diagnostics (relation recorded per answer) | anchor + 4 options | tap option | mid |
| `rekenrek-show` | shows N beads in 5-structure, kid names the number | 20-bead rack | numpad / choice | mid — *parked: open design question (see CLAUDE.md → Parked)* |
| `ten-frame-show` | partly filled ten-frame | ten-frame | numpad / choice | mid |
| `number-sequence-order` | drag numerals into low→high order on a strip; gap-fill at higher score | shuffled numeral tiles + strip | drag | low–mid |
| `show-me-on-ten-frame` | reverse of `ten-frame-show`: tap cells to fill exactly N | empty ten-frame | tap | low–mid |
| `numberline-read` | reverse of `numberline-place`: name the numeral at a marked position | number line, one cell marked | choice / numpad | mid |
| `quantity-match` | match the same quantity across representations (dots/fingers/ten-frame/numeral); memory-pairs at higher score | mixed representations | choice / tap | mid |
| `subitise-flash` | pattern flashes ~1s then hides; name the quantity (retry replays the same pattern) | timed structured pattern | choice / numpad | mid |

> Implementation status of every exercise type lives in **CLAUDE.md → Exercise file status** (ownership note at the top of this file).

### Optellen presentations

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `fill-vis` | equation built by timed reveal over the semantic action: erbij (arrival), samenvoegen (merge) or wegnemen (leave), each with its canonical cue phrase; flipped `+` terms get an explicit commutativity swap at the equation tier | theme counter / dots | numpad | low–mid |
| `fill-plain` | bare equation only (op-generic: `+` and `−`) | none | numpad | high |
| `choice` | equation + 4 answer buttons; dots aid at low tier (combining groups for `+`, crossed-out group for `−`) | optional visual | tap | mid |
| `tf` | equation + maybe-wrong answer; waar / niet waar. Tiers: near-miss traps → strikt (operand-echo, and order-reversal for `−`) | none | tap | mid–high |
| `erbij-tap` | staged opening reveal (start group + number, then the arrival chunk + cue, then "=?"); the start group is a GIVEN quantity (chip reads it uncounted); child then taps the arrivals in while the chip counts on, then names the hidden total; voorspel tier asks the answer before the arrival animates. Written order: start = first operand, arrivals = second | theme counter | tap + choice | low |
| `doosje` | the first number is a group in a closed box (the lid says how many); the others stand outside, going in (+) or having come out (−); how many now / still inside? The hidden group cannot be recounted, so counting on / back from the lid's number is the only route. Replaces `collect-counter` (a bare counter with +/− buttons: nothing to count, and it could not tell counting on from counting all) | box + 5-row | choice → numpad | low–mid |
| `numberline-jump` | jump on a full-range line departing from the first operand (matches the written sum); tier 0 reveals sum → line → start → jump → target; tiers: watch the animated jump → tap the landing yourself → sparse labels | number line | choice / tap-cell | mid |
| `rekenrek-add` | move beads to model a + b | rekenrek | drag / tap | mid |

> `collect-tap` (tap items into a basket) was removed: its tap-everything flow trained counting-all — the documented dead-end strategy — and could not fail. `erbij-tap` is its replacement with the counting-on structure built in.

### Aftrekken-specific presentations

Each implicitly suggests a strategy. The score → exercise-type matrix shifts which ones dominate per skill.

| ID | Description | Strategy nudged | Suits |
|---|---|---|---|
| `wegneem-tap` | whole group stands as a GIVEN quantity (chip reads it uncounted); child taps the leavers, each fades to a crossed ghost while the chip counts back; then names the remainder. voorspel tier asks the answer before the leave animates | direct take-away, counting back | low (wegnemen) |
| `wegnemen-crossed-out` | one group with some items crossed out — the static werkboek picture; tiers choice → numpad | direct take-away | low–mid (wegnemen) |
| `numberline-jump-back` | start at a, jump back b | terugtellen | low–mid (wegnemen) |
| `doosje` (−) | a in the box, b come out; how many are still inside? | take-away | low–mid (wegnemen) |

### Post-60 width set (op-generic, + and − skills)

Width probes per the mastery-width criteria: representational transfer and semantic robustness, not more of the same presentation.

| ID | Description | Probes | Suits |
|---|---|---|---|
| `splits-som-match` | a split representation next to som options ("welke som hoort erbij?"), and the inverse direction at the top tier. For + it binds the sum to its part-whole structure; for − it seeds via-splitsing (5 = 4 en 1, dus 5 − 1 = 4). Distractors are other facts — never the relation's own twin | representational transfer (Movement 5: operation → relation) | post-60 |
| `rekenverhaal` | mini story problems whose WORDS carry the semantics (erbij / samenvoegen / wegnemen cue phrases as sentences, with Dutch singular/plural agreement), acted by the scene creatures; the equation is **hidden on the first attempt** and revealed only as a scaffold on the wrong-answer retry, so the child must read the story; replay tap re-acts it. Weight-controlled, never a gate | semantic robustness by language alone (the language-gradient capstone) | post-60 |

### Generic high-score

`fill-plain`, `choice`, `tf` — the "no-scaffolding" set, used at high score across most arithmetic skills.

---

## Exercise design for the next set

The exercises of `optellen-tot-5`, `aftrekken-wegnemen-5`, `aftrekken-verschil-5`, `getalfamilie-5`, `splitsen-6-7`, `splitsen-8-9` and `tienvrienden`, designed together so that each exercise has one job and no two do the same one. Skeletons, not specifications: what an exercise is about, what it achieves, how it works, what can go wrong with it, and where it sits on the skill's curve. Every weight here is a first guess, to be tuned in the skill's own round.

The exercises that are op-generic are also range-generic by design; the tot-10 skills (`+1-2-tot-10` … `getalfamilie-10`) reuse them and get their own tuning later.

### Shared rules of the set

**1. The aid ladder.** `+1-2-tot-5` and `-1-2-tot-5` helped with pictures that can be counted. This set's goal is to stop counting, so its aids are different, in this order:

| Step | Aid | Why |
|---|---|---|
| a | a structured picture that **flashes** | seen, not counted (movement 1 of the background document) |
| b | the **split** — a huisje with numbers | the answer is a fact the child already knows, used as a tool |
| c | nothing | the bare sum |
| d | nothing, **one tap, time-aware** | knowing versus counting |

A countable picture comes back only on a retry, as the step down.

**2. Answer input.** Choice buttons at the entry, with distractors chosen to catch the skill's own pitfalls (the sum of the numbers shown, a number echoed, one off). From the middle of the curve a **number strip**: the numbers of the range at fixed places (0, then 1–5, then 6–10 as a second row), one tap, no confirm. Nothing to search for and no 25% guess. The numpad stays where it is today (`fill-plain`, the noteren exercises).

**3. Nul.** a + 0, 0 + a and a − 0 belong to `optellen-tot-5` / `aftrekken-wegnemen-5` from score 0. With zero terms allowed, 11 of the 21 sums within 5 contain a 0, so the generator down-weights them to about 15% of the draws together (a − a included for −). Each exercise below says whether it can show a zero; the ones that cannot exclude it with `isCompatible`.

**4. Time-aware answers — only in `snel-weten`.** Decided direction: timed answers, never for typed input (*Answers so far*, 1). The design proposed here is softer than a time limit, because the background document is explicit that speed pressure before automatisation costs working memory and that maths anxiety is installed by exactly this:

- No clock, no countdown, no "too slow". The child is never told an answer was slow.
- Three outcomes instead of two: **fast and correct** counts (+1, and a small extra beat on screen — the only time-cue, and a positive one); **slow and correct** gets the normal correct feedback and leaves the score where it is; **wrong** is wrong (−3, retry).
- The allowance is relative to the child: his own tap time on something he surely knows, plus about 3 s at the first timed tier and 2 s at the top (the background document's thresholds for "automatised" and for tienvrienden).
- Only above score 60, so it cannot hold up an unlock. It can hold a skill between 60 and 100 — which is the intended meaning of "not yet automatised".
- The retry of a wrong answer is the same fact one tier down: untimed, with the huisje back.

Accepted in this form. A visible limit with a longer second attempt — the original idea — can be added later as a higher tier. Open, to settle when it is built and tested: where the baseline comes from (candidate: the median time of the child's correct answers in `dot-pattern-recognise`, which stays in rotation; otherwise a short "tik de 7" warm-up inside the exercise); whether slow should cost something.

**5. Conventions.** W / R / C / L / Q apply as everywhere. Quantities are 5-rows (two rows for 6–10) or, up to 5, die patterns. A picture that disappears is covered, not removed, so the stage keeps its size.

### What has to be built besides the exercises

| Piece | For |
|---|---|
| `NumberStrip` — the fixed one-tap number row | every new exercise from its middle tier |
| A flash: a picture shown for a set time, then covered in place; replay button, replays recorded | `flits-som`, `maak-tien`, flash tiers elsewhere |
| The huisje as a shared component (today inside `Splitshuisje.tsx`) | `huisje-som`, `familie-sommen`, `snel-weten` retry |
| Two-colour 5-row / tienveld for a split of 6–10 | the bands, `maak-tien`, `puntoefening` |
| A third answer outcome ("correct, not counted") through `useClosure` → `buildAnswerRecord` → scoring, and a `pace` field on the record | `snel-weten` |
| Zero terms in the two generators, down-weighted | `optellen-tot-5`, `aftrekken-wegnemen-5` |
| Error classification for a family question: which member was asked decides what "the sum of the numbers shown" or "the target echoed" is | `getalfamilie-5` |
| `rekenverhaal` variants: `verschil`, `deel-geheel`, `aanvullen` | verschil and getalfamilie skills |

### New exercise types

#### `flits-som` — the picture flashes, the sum stays
- **About**: a sum whose picture is on screen too briefly to count.
- **Achieves**: the two groups are *seen* as two parts of a whole — the split, perceived — instead of counted on or back. The first step away from counting, with a picture still there.
- **How it works**: the sum is on screen throughout. Above it the picture appears, stays about two seconds, then is covered. `+`: two 5-row segments in two colours (●●● ○○). `−`: the whole as one 5-row with the leavers crossed (the `wegnemen-crossed-out` picture). A zero term is an empty outlined place. A ▶ button shows it again; replays are recorded.
- **Tiers**: `lang` 0 — about 2.5 s, choice · `kort` 30 — about 1.2 s, number strip.
- **Retry**: the picture stays (that is `fill-vis` / `wegnemen-crossed-out`).
- **Pitfalls of the presentation**: too short → guessing; too long → counted after all (the duration is the tuning knob); a memory task instead of a seeing task when the groups are not structured.
- **Used by**: `optellen-tot-5` and `aftrekken-wegnemen-5`, entry only.

#### `huisje-som` — read the sum from the split
- **About**: a filled splitshuisje next to a sum of the same family.
- **Achieves**: the method this set exists for — "5 is 2 en 3, dus 2 + 3 = 5" and "dus 5 − 2 = 3". The aid is a known fact, not a picture; nothing on screen can be counted.
- **How it works**: the house (total on the roof, parts in the rooms) stands beside the sum. As the sum forms, each of its numbers lights up in the house; the number that does not light up is the answer.
- **Tiers**: `huisje-open` 0 — house stays, choice · `huisje-flits` 30 — house shown, then roof and rooms covered, strip · `twee-sommen` 50 — house open, two sums of the family in a row (2 + 3 then 3 + 2; 5 − 2 then 5 − 3): one house answers both · `huisje-erna` 70 — bare sum; the house appears filled only when the answer is in, as confirmation.
- **Retry**: one tier down — the house comes back.
- **Pitfalls of the presentation**: at `huisje-open` "take the number that is not in the sum" works without thought — that is the rule being taught, but it is why the tier is short and the weight falls; an echoed number (a room that is already in the sum) is the informative error. `twee-sommen` is where van plaats wisselen is taught — there is no separate commutativity exercise.
- **Zero**: yes (a room with 0).
- **Used by**: `optellen-tot-5` and `aftrekken-wegnemen-5`, the main exercise up to 60.

#### `omkeer-som` — one sum gives its reverse
- **About**: a finished sum, and under it the reverse sum to complete: "3 + 2 = 5, dus 5 − 3 = ?".
- **Achieves**: optellen and aftrekken as each other's omgekeerde bewerking; a difference found from a sum the child knows.
- **How it works**: two lines. At the entry a two-colour 5-row above them: joined for the first line, then one colour slides out for the second.
- **Tiers**: `omkeer-beeld` 0 — with the picture, choice · `omkeer-kaal` 35 — the two lines only, strip · `buur` 65 — the given line is a neighbour instead of the reverse: "5 − 2 = 3, dus 5 − 3 = ?". Children tend to carry "one more gives one more" over from + to − (the principle error the background document cites from Dowker); this tier tests it.
- **Pitfalls of the presentation**: the answer is always a number of the first line — pattern-matching is possible at the first two tiers, not at `buur`.
- **Zero**: no.
- **Used by**: `aftrekken-wegnemen-5`, from 25.

#### `familie-sommen` — one family, four sums
- **About**: a huisje and its familieopgaven: 2 + 3 = 5, 3 + 2 = 5, 5 − 2 = 3, 5 − 3 = 2.
- **Achieves**: the family as one piece of knowledge (GO! WI.280). The only place where all the views of a fact stand together.
- **How it works**: the house on top, three number tiles under it (5, 2, 3), sum frames below. The child taps tiles into the open places. Two frames at a time (the + pair, then the − pair) so the stage fits.
- **Tiers**: `aanvullen` 0 — each sum has one open place · `leggen` 40 — every place open; for − the order matters, and 2 − 5 is the error it catches · `zelf` 70 — only the house: make a sum, then another one that is different (any family sum counts; a repeat gets the warning, as in `splits-vrij`).
- **Retry**: one tier down; the sums already right stay (as in `splits-alle`).
- **Pitfalls of the presentation**: tiles can be placed mechanically at `aanvullen`; a family with two equal parts has only two sums (shown as two frames).
- **Zero**: no.
- **Used by**: `getalfamilie-5`, core.

#### `puntoefening` — the unknown before the = sign
- **About**: "2 + . = 5" — in this app drawn with the boxed "?".
- **Achieves**: the puntoefening solved from the split; = read as "is evenveel als"; the aanvullen meaning with its picture.
- **How it works**: at the entry a 5-row (tienveld for 10) with the target marked: 5 places outlined, 2 filled. The sum below.
- **Tiers**: `doel-beeld` 0 — picture stays, choice · `doel-flits` 25 — picture flashes, strip · `kaal` 45 — bare · `voor` 65 — the open place first: ". + 2 = 5" · `min` 80 — "5 − . = 3".
- **Choice distractors**: the sum of the two numbers shown (7), the target (5), one off.
- **Pitfalls of the presentation**: the open places can be counted at `doel-beeld` — intended at the entry, gone at 25.
- **Zero**: no.
- **Used by**: `getalfamilie-5`, entry and core; `tienvrienden` as "7 + . = 10".

#### `numberline-gap` — how far from here to there
- **About**: two marks on the number line and the jump between them. A third id on the `NumberLine` component.
- **Achieves**: aanvullend optellen — a difference found by going up from the smaller number, which the background document names as a Flemish strength worth keeping; and verschil as a distance.
- **How it works**: variants, recorded. `aanvullen`: start mark and target flag, sum "2 + ? = 5". `verschil`: two owners' marks, sum "5 − 2 = ?". The jump is drawn as **one** bow, not as hops.
- **Tiers**: `sprong-zien` 0 — the bow is drawn, hops faint under it, choice · `sprong-kaal` 40 — marks only, the bow appears with the answer, strip · `kale-lijn` 70 — sparse labels.
- **Pitfalls of the presentation**: counting the marks instead of the steps (one too many) — the classic off-by-one, and worth tagging; answering where the jump lands.
- **Used by**: `getalfamilie-5` and `aftrekken-verschil-5`, middle of the curve, modest weight — it invites counting up, which is a legitimate strategy but not the goal.

#### `teken-kiezen` — plus or min?
- **About**: a sum with its sign missing: "5 ○ 2 = 3".
- **Achieves**: the sign is read and chosen, not assumed; a situation is turned into an operation (minimumdoel 2.2.11). In the verschil skill: nothing leaves, and it is still −.
- **How it works**: two large buttons, + and −.
- **Tiers**: `film` 0 — a short scene plays (things arrive, things leave, two groups pair off, a target is filled), then the sum with its outcome · `som` 40 — the sum only; decide from the numbers · `zin` 70 — one cue sentence and the numbers.
- **Pitfalls of the presentation**: two options, so a guess is right half the time — the −3 makes guessing lose, and the weight stays low.
- **Zero**: no ("5 ○ 0 = 5" has two answers).
- **Used by**: `aftrekken-wegnemen-5`, `aftrekken-verschil-5`, `getalfamilie-5`, low weight.

#### `verschil-paren` — pair them off, the rest is the difference
- **About**: two owners, two groups, "hoeveel meer?".
- **Achieves**: the relational question itself; pairing off as the action that makes a difference visible; the − sum that belongs to it.
- **How it works**: two 5-rows under each other, left-aligned, one per owner. Pairs link one by one; linked items dim; the ones without a partner stand out. Meanwhile the sum forms: the larger number, minus the ones that found a partner. Variants, recorded: `meer` ("Hoeveel heeft Anna er meer?"), `minder` ("Hoeveel heeft Tom er minder?"), and from 60 `gelijk` ("Hoeveel moet Tom er nog krijgen om evenveel te hebben?").
- **Tiers**: `paren` 0 — the pairing plays, choice · `naast` 30 — rows aligned, no pairing shown, strip · `schuin` 55 — rows not aligned (different spacing, as in `compare-more-less`), so the difference cannot be read off the overhang · `getallen` 75 — two owners with a number each and the question; no groups.
- **Choice distractors**: the larger group, the smaller group, both together.
- **Retry**: one tier down; owners, variant and which group is larger stay.
- **Pitfalls of the presentation**: at the aligned tiers the answer is the overhang, readable without thinking — the intended support, removed at `schuin`. Equal groups give 0: everyone has a partner; the feedback says "evenveel".
- **Used by**: `aftrekken-verschil-5`, the main exercise throughout.

#### `splits-buren` — one part up, the other down
- **About**: a split that is given, and its neighbour to complete: "7 is 5 en 2 — 7 is 4 en ?".
- **Achieves**: a split derived from one that is known; the pattern behind the table; a way back when a fact is not known that is not counting.
- **How it works**: at the entry a bead row coloured per five with a gap; one bead slides across the gap. The first statement stays, greyed, as the referent.
- **Tiers**: `schuif-zien` 0 — the bead slides, choice · `twee-regels` 35 — the two statements only, strip · `rij` 60 — three rows of the table in order, the first complete · `sprong` 80 — two steps away ("7 is 5 en 2 — 7 is 3 en ?").
- **Choice distractors**: both parts moved the same way (5 → 4, 2 → 1) — the informative error.
- **Used by**: the two bands, from 20.

#### `maak-tien` — the empty places are the partner
- **About**: a full ten with some places taken: how many to 10?
- **Achieves**: the tienvrienden seen before they are known. On a tienveld the empty places *are* the partner; on two hands the fingers that are down.
- **How it works**: variants, recorded: `tienveld` (filled in reading order) and `vingers` (the existing hand pictures). Statement "7 en ? is 10".
- **Tiers**: `zien` 0 — picture stays, choice · `flits` 30 — picture flashes, strip · `denk` 55 — no picture until the answer is in; then it fills, as confirmation.
- **Pitfalls of the presentation**: counting the empty places by ones at `zien`. For 5–9 the empty places are a part of one row and are seen; for 1–4 they are "the rest of this row and a whole row" — which is why 3 → 7 is harder than 7 → 3, and why both directions are served.
- **Used by**: `tienvrienden`, entry.

#### `tien-paren` — find the friends
- **About**: number cards; tap two that make 10.
- **Achieves**: a pair recognised from either side; "is this a pair?" as a judgement.
- **How it works**: six cards, three pairs. A found pair locks and shows its two-colour tienveld.
- **Tiers**: `open` 0 — cards carry a small tienveld · `getallen` 35 — numbers only · `lokkers` 60 — eight cards: three pairs and two cards that are one off a partner and belong to nobody.
- **Wrong**: a wrong pair ends the question; the overlay shows the pair of the first card tapped.
- **Pitfalls of the presentation**: the last pair is free (so `open` and `getallen` hold two real decisions; `lokkers` three).
- **Used by**: `tienvrienden`, from 10.

#### `snel-weten` — known, or worked out?
- **About**: one bare fact, one tap.
- **Achieves**: tells a known answer from a counted one, and gives the facts the repetition that automatises them (rule 4).
- **How it works**: the prompt in the skill's own form — "8 is 5 en ?", "2 + 3 =", "5 − 2 =", for tienvrienden just "7" under a small full ten, for getalfamilie any view — and the number strip.
- **Tiers**: `rustig` 60 — allowance of the child's tap time plus about 3 s · `vlot` 80 — plus about 2 s. A third tier, `met-huisje`, exists only as the retry: untimed, the family's house shown.
- **Pitfalls of the presentation**: everything in rule 4; a slip of the finger on a strip without confirm.
- **Zero**: yes.
- **Used by**: every fact skill of the set from 60; not `aftrekken-verschil-5`, whose facts are those of wegnemen.

### Existing exercises that stretch

| Exercise | Change | For |
|---|---|---|
| `splits-frame` | a 6–10 picture (two-colour 5-rows instead of dice) and a flash tier at the top | bands |
| `splits-build-it` | a row of up to 9 beads, coloured per five (this is what `rekenrek-decompose` was meant to be — that id is dropped) | bands |
| `splitshuisje`, `splitsbenen`, `splits-ontbreken-*`, `splits-vrij` | range only; the huisje's roof aid becomes an unsplit 5-row picture | bands, `tienvrienden` |
| `splits-alle` | the table of 9 has ten rows — needs a layout check at 375 × 667, and the duplicate guard dropped | bands |
| `splits-match` | 6–10 pictures | bands |
| `rekenverhaal` | variants `verschil`, `deel-geheel`, `aanvullen` | verschil, getalfamilie |
| `fill-vis`, `choice`, `fill-plain`, `tf` | zero terms; `tf` traps "3 + 0 = 4" and "3 − 0 = 0" | optellen, wegnemen |

A tier added to an existing exercise is keyed to the score for every skill that uses it — the flash tier of `splits-frame` will also reach `splitsen-herken-5` at the top of its curve. Intended, but to be checked there.

Planned ids that this design replaces: `verschil-two-groups` and `verschil-rekenrek` → `verschil-paren`; `aanvullen-target` → `puntoefening`; `numberline-jump-up-from-b` → `numberline-gap`; `tienveld-fill` and `rekenrek-make-ten` → `maak-tien`; `rekenrek-decompose` → `splits-build-it`.

### Per skill: the curve

Weights are relative, written as breakpoints `score: weight`; an exercise is silent before its first breakpoint.

#### `optellen-tot-5`
Entry: the picture flashes and the split is the aid. Middle: the split alone, then nothing. Top: bare and time-aware.

| Exercise | Weight | Role |
|---|---|---|
| `huisje-som` | 0: 30 · 50: 25 · 100: 8 | the method |
| `flits-som` | 0: 30 · 40: 15 · 65: 0 | seen, not counted |
| `fill-vis` | 0: 8 · 40: 0 | the picture the child knows from +1 / +2, for continuity |
| `choice` | 0: 12 · 60: 6 · 100: 4 | |
| `splits-som-match` | 20: 0 · 45: 15 · 100: 10 | split ↔ sum, the other direction |
| `tf` | 30: 0 · 60: 12 | incl. zero traps |
| `fill-plain` | 30: 0 · 60: 20 | |
| `rekenverhaal` | 60: 0 · 75: 10 | erbij / samen |
| `snel-weten` | 60: 0 · 80: 25 · 100: 35 | |

Not used here, on purpose: `erbij-tap`, `doosje`, `numberline-jump` — they practise counting on, which this skill leaves behind.

#### `aftrekken-wegnemen-5`
The same shape, more support for longer, plus the two things that are new: the reverse of a sum, and the sign.

| Exercise | Weight | Role |
|---|---|---|
| `huisje-som` | 0: 30 · 60: 25 · 100: 8 | the method |
| `flits-som` | 0: 30 · 45: 15 · 70: 0 | |
| `wegnemen-crossed-out` | 0: 12 · 100: 5 | the werkboek picture, kept |
| `omkeer-som` | 25: 0 · 50: 18 · 100: 10 | + and − as reverse |
| `teken-kiezen` | 20: 0 · 40: 10 · 100: 6 | the sign is read |
| `choice` | 0: 10 · 100: 4 | |
| `splits-som-match` | 30: 0 · 50: 12 · 100: 8 | |
| `tf` | 40: 0 · 65: 12 | reversal, zero and sign traps |
| `fill-plain` | 40: 0 · 70: 18 | |
| `rekenverhaal` | 60: 0 · 75: 10 | wegnemen |
| `snel-weten` | 65: 0 · 85: 25 · 100: 30 | |

Not used: `wegneem-tap`, `doosje`, `numberline-jump-back` (counting back).

#### `aftrekken-verschil-5`
A meaning skill: the facts are known, the question is new. The meaning-carrying presentation stays dominant to the top; there is no bare `5 − 2` here, because a bare sum says nothing about verschil.

| Exercise | Weight | Role |
|---|---|---|
| `verschil-paren` | 0: 60 · 60: 35 · 100: 25 | |
| `teken-kiezen` | 15: 0 · 35: 12 · 100: 8 | it is a − although nothing leaves |
| `numberline-gap` (verschil) | 35: 0 · 55: 18 · 100: 15 | the difference as a distance |
| `rekenverhaal` (verschil) | 60: 0 · 75: 20 · 100: 25 | the question in words alone |

Four exercises is thin. It is what the skill needs at this range; the wider comparison questions come at tot 10.

#### `getalfamilie-5`

| Exercise | Weight | Role |
|---|---|---|
| `puntoefening` | 0: 40 · 60: 25 · 100: 15 | the unknown inside the sum |
| `familie-sommen` | 0: 25 · 40: 30 · 100: 20 | all the views of one family |
| `splits-ontbreken-rechts` | 20: 12 · 100: 8 | the same question in split notation ("5 = 2 + ?") |
| `numberline-gap` (aanvullen) | 20: 0 · 40: 12 · 100: 8 | |
| `teken-kiezen` | 30: 6 | |
| `rekenverhaal` (deel-geheel, aanvullen) | 60: 0 · 75: 12 | |
| `snel-weten` | 65: 0 · 85: 20 · 100: 25 | any view |

#### `splitsen-6-7` / `splitsen-8-9`
One curve for both. Recognition first, the notations from the middle, organisation (`splits-buren`, the table) and speed at the top.

| Exercise | Weight | Role |
|---|---|---|
| `splits-frame` | 0: 35 · 50: 15 · 100: 5 | part and "?" in the 5-structure |
| `splits-build-it` | 0: 25 · 50: 10 · 80: 0 | make the split yourself |
| `splitshuisje` | 10: 10 · 40: 22 · 100: 12 | |
| `splits-buren` | 20: 0 · 50: 20 · 100: 12 | derive, do not count |
| `splits-ontbreken-rechts` | 25: 0 · 55: 20 · 100: 12 | |
| `splitsbenen` | 30: 0 · 55: 12 · 100: 8 | |
| `splits-match` | 35: 0 · 55: 10 · 100: 6 | |
| `splits-ontbreken-links` | 60: 0 · 75: 10 | |
| `splits-vrij` | 60: 0 · 75: 8 | |
| `splits-alle` | 70: 0 · 85: 8 | |
| `snel-weten` | 60: 0 · 80: 25 · 100: 35 | |

Left at tot 5: `dot-pattern-decompose` and `splits-herken-huisje` (dice), `splits-shuffle` (conservation) and `same-split-or-different` (order) — what they teach does not need teaching again.

#### `tienvrienden`
The picture first, then every form, then mostly speed.

| Exercise | Weight | Role |
|---|---|---|
| `maak-tien` | 0: 45 · 50: 20 · 100: 8 | the pairs seen |
| `tien-paren` | 10: 10 · 40: 20 · 100: 12 | both sides |
| `splitshuisje` | 20: 0 · 45: 12 · 100: 6 | the house of 10 |
| `splits-ontbreken-rechts` | 25: 0 · 50: 15 · 100: 8 | "10 is 7 en ?" |
| `puntoefening` | 30: 0 · 55: 15 · 100: 8 | "7 + . = 10" |
| `splits-ontbreken-links` | 60: 8 | |
| `snel-weten` | 60: 0 · 75: 35 · 100: 50 | the goal of the skill |

### Check: one job each

| What the set must achieve | Carried by |
|---|---|
| A sum or difference seen, not counted | `flits-som` |
| The split used as the tool | `huisje-som` |
| Van plaats wisselen | `huisje-som` (`twee-sommen`) |
| + and − as each other's reverse | `omkeer-som` |
| The whole family together | `familie-sommen` |
| The unknown inside the sum; = as a relation | `puntoefening` |
| Going up to find a difference | `numberline-gap` |
| The sign chosen | `teken-kiezen` |
| "Hoeveel meer" | `verschil-paren` |
| A split derived from a neighbour | `splits-buren` |
| The pairs of 10 seen | `maak-tien` |
| The pairs of 10 from both sides | `tien-paren` |
| Known versus counted | `snel-weten` |
| The meaning in words alone | `rekenverhaal` (existing, new variants) |

### Suggested order of building

1. The shared pieces (number strip, flash, huisje component).
2. `optellen-tot-5`: `huisje-som`, `flits-som`, zero terms.
3. `aftrekken-wegnemen-5`: `omkeer-som`, `teken-kiezen`.
4. `snel-weten` with the third outcome — then test it on the two skills above before it goes anywhere else.
5. `getalfamilie-5`: `puntoefening`, `familie-sommen`, `numberline-gap`, the `rekenverhaal` variants.
6. `aftrekken-verschil-5`: `verschil-paren`.
7. The bands: the stretched split exercises, `splits-buren`.
8. `tienvrienden`: `maak-tien`, `tien-paren`.

---

## Score → exercise-type weighting (sketch)

Per the v2 logic, this is where difficulty lives. Below is a high-level shape; the actual numbers will need playtesting.

| Score band | Bias |
|---|---|
| 0–20 | scene visuals + collect/tap; numpad mostly avoided; reveal animations on |
| 20–50 | mix of fill-vis and choice; rekenrek/ten-frame appear; doosje takes over from erbij-tap |
| 50–80 | fill-plain becomes plurality; tf appears; visuals only on the "harder" instances of the skill |
| 80–100 | ~80% fill-plain; tf and choice fill the rest; visuals ≤ 10% |

Notes:

- Capped skills (score 100, not yet subsumed) stay in rotation, pinned at the top of this distribution. Once subsumed, they leave rotation entirely.
- For splitsen skills specifically, `splitshuisje` and `splitsbenen` should never disappear entirely — they're the classroom notation. Suggest a floor of ~10% even at score 100.
- For subtraction-semantic skills, the *strategy-suggestive* presentations should remain dominant within that skill (a `verschil-5` skill at high score still shows verschil presentations 60–70% of the time, just with less ornament).

---

## Per-question record + error-type taxonomy

Per-question records capture both correctness and *type of error*. The diagnostic value: an off-by-one error in `aftrekken-wegnemen-5` says something different (still terugtelling) than a reversal (non-commutativity not grasped) or a semantic-narrow error (treated as addition). The stream is captured and persisted per profile (`src/engine/diagnostics.ts` + `src/state/diagnosticsStorage.ts`) and already drives the dynamic per-exercise weight factor via correctness; biasing scaffolding off the *error types* becomes a v2.x feature once there's data to look at.

### Record shape

As implemented (`AnswerRecord` in `src/engine/diagnostics.ts` is the source of truth):

```
{
  timestamp:      epoch ms,
  profileId:      string,
  skillId:        string,
  exerciseId:     string,                  // e.g. "fill-vis", "splitshuisje"
  tierId?:        string,                  // active scaffolding tier
  variant?:       string,                  // presentation / semantic framing (future use)
  isRetry?:       boolean,                 // re-scaffolded retry of a just-failed problem
  op:             '+'|'-'|'split'|'count'|'half',
  semanticForm?:  'wegnemen'|'verschil'|'aanvullen',
  operandA:       number,
  operandB:       number,
  correctAnswer:  number,
  givenAnswer?:   number,                  // when the exercise reports it
  correct:        boolean,
  errorType:      enum | null,             // null when correct == true
  responseTimeMs?: number,
  tapCount?:      number                   // multi-step exercises
}
```

### Error-type enum (initial set)

Detection happens at recording time — the engine sees (problem, givenAnswer) and tags. First match wins; `unclassified` is the fallback. Keep the rule set minimal; extend as patterns surface in real play.

| Tag | Detection rule | Skills it fires on |
|---|---|---|
| `off-by-one` | `\|given − correct\| == 1` | all arithmetic, splitsen |
| `reversal` | for subtraction: `given == b − a` (took smaller from larger ignoring order) or `given == a + b` (added instead); for splitsen: parts swapped relative to expected slot | aftrekken-*, splitsen-* |
| `semantic-narrow` | for verschil/aanvullen: `given == a + b` (treated as addition); for aanvullen: `given == a − b` (treated as wegnemen) | aftrekken-verschil-*, aftrekken-aanvullen-* |
| `near-miss` | `given == a` or `given == b` (just regurgitated an operand) | all arithmetic |
| `tienvriend-mismatch` | for tienvrienden: `given + a != 10` and not off-by-one | tienvrienden |
| `unclassified` | nothing above matches | fallback |

Notes on the rule set:

- `reversal` and `semantic-narrow` overlap on the rule `given == a + b` for verschil/aanvullen. Tag as `semantic-narrow` (it's the more informative diagnosis) — `reversal` is reserved for the wegnemen case where the kid took smaller from larger.
- For splitsen, a "swapped parts" reversal is only meaningful when the exercise type pins which slot is which (`splits-ontbreken-rechts` vs `-links`). For `splits-vrij` and `splits-alle` order doesn't matter, so reversal doesn't apply — these only fire `unclassified` or `near-miss`.
- Response time is optional but cheap to capture; useful later for distinguishing "knew it" from "worked it out."
- The aanvullen rule `given == a − b` cannot fire as written: with a = whole and b = part, a − b is the correct answer, and only wrong answers are classified. Rework it together with the aanvullen skill (*Didactic frame §3*) — the likely errors there are the sum of the two numbers shown and the target echoed.

---

## Resolved decisions (log)

For Claude Code context — what was considered and chosen during the design conversation.

1. **Atomicity**: `+1`/`+2` and `-1`/`-2` grouped into single skills (`+1-2-tot-5`, `-1-2-tot-5`, `+1-2-tot-10`, `-1-2-tot-10`), not kept as four atoms.
2. **Tot-10 progression**: intermediate `+3-4-tot-10` and `-3-4-tot-10` skills inserted between the easy version and the full one. Avoids the leap from "+1/+2" straight to "anything within 10."
3. **Subtraction semantics**: three separate skills per range (`wegnemen`, `verschil`, `aanvullen`), not a single skill with semantic exercise variants. Heavier but produces per-meaning fluency tracking. `verschil` and `aanvullen` unlock in parallel from `wegnemen`, not serially.
4. **Tienvrienden**: sibling of `splitsen-tot-10`, not a sub-skill. Independent score so automaticity is visible.
5. **Subsume model**: explicit `subsumed_by` field per skill, separate from `unlocks`. Rule: child capped (100) AND parent unlocked → archive, score preserved. Fact-recall skills (`tienvrienden`, `dubbels-tot-10`, `helften-tot-10`) have `subsumed_by: null` to keep them in rotation.
6. **Splitsen-tot-10 gating**: only gates the *full* tot-10 arithmetic skills, not the `+1-2` / `+3-4` / `-1-2` / `-3-4` intermediates. Avoids stalling the arithmetic track on splitsen maturity.
7. **Helften location**: hangs off `optellen-tot-10` (not aftrekken).
8. **Verschil/aanvullen at tot-10**: dual deps (tot-10 wegnemen *and* tot-5 cousin). Belt-and-braces.
9. **Vergelijken / compare-more-less**: an exercise type within `getalbegrip-5` / `getalbegrip-10`, not its own skill node.
10. **Error logging**: per-question record captures `errorType` enum; detection at recording time; initial enum kept minimal (`off-by-one`, `reversal`, `semantic-narrow`, `near-miss`, `tienvriend-mismatch`, `unclassified`).
11. **Splitsen-tot-5 split**: `splitsen-tot-5` separates into `splitsen-herken-5` (perceptual / recognition — `dot-pattern-decompose`, `splits-frame`, `rekenrek-decompose`) and `splitsen-noteren-5` (notation / production — splitshuisje, splitsbenen, splits-vrij / -alle / -ontbreken-*). Recognition gates the +/- track; notation runs in parallel and gates nothing in v2. Open: does the same split apply to `splitsen-tot-10`? TBD pending playtesting.
13. **Splits of 6–10 by total** (November 2026): `splitsen-tot-10` is replaced by `splitsen-6-7` and `splitsen-8-9`, unlocking together; the splits of 10 are `tienvrienden`, unlocking from `splitsen-6-7`. The herken / noteren split is not mirrored. `splitsen-herken-5` and `splitsen-noteren-5` are no longer archived. Supersedes 4 and the open part of 11.
14. **Getalfamilie**: `aftrekken-aanvullen-*` becomes `getalfamilie-*` — one family, every view; the home of the missing-part meanings. Subtraction keeps wegnemen and verschil as its own skills. Amends 3.
15. **Nul as a term**: a + 0, 0 + a and a − 0 belong to `optellen-tot-5` / `aftrekken-wegnemen-5`, down-weighted.
16. **Getalbeeld for 6–10**: the 5-structure; looked at again when the child enters the first year.
17. **Comparison with the compared amount unknown** ("3 meer dan"): not in the tot-5 range; later, as story problems at tot 10.
18. **A difference of 0** stays in the verschil skills.
19. **Exercise set for the tot-5 arithmetic, the split bands and tienvrienden** designed in one go — *Exercise design for the next set*. The time-aware exercise (`snel-weten`) is built in its soft form — no clock shown, slow-but-correct is not wrong; a visible limit may be added later as a higher tier.
12. **No trivial 0-splits**: splitsen generators produce a ≥ 1, b ≥ 1. A "split into 0 and n" carries no recognition signal and was previously confusing in visual exercises. Was previously `a ≥ 0`.

---

## Quick translation table (for the generator + UI)

| Concept | Flemish term to use | Avoid |
|---|---|---|
| number bonds / splits | splitsen, splitsing | "getalrelaties" |
| pairs that make 10 | tienvrienden, vrienden van 10 | "verliefde getallen" (NL) |
| neighbouring numbers | buurgetallen | "buren" alone in UI |
| double / half | dubbel / helft | — |
| take-away | wegnemen | "aftrekken" is the umbrella |
| difference | verschil | — |
| make up / fill in | aanvullen | — |
| count back | terugtellen | — |
| dot patterns (dice) | dobbelsteenpatronen, kwadraatbeelden | — |
| number line | getallenlijn | — |
| arithmetic rack | rekenrek | — |
