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

- **Skill IDs**: kebab-case, lowercase, scope-suffixed (e.g. `splitsen-tot-10`, `aftrekken-wegnemen-5`).
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
        ┌───────┴───────┐                               │
        │               │                               │
    +1-2-tot-5      -1-2-tot-5                          │
        │               │                               │
        ▼               ▼                               │
  optellen-tot-5   aftrekken-                           │
        │          wegnemen-5                           │
        │               ├──► aftrekken-verschil-5       │
        │               └──► aftrekken-aanvullen-5      │
        │                                               │
        │                                               ▼
        │                                       splitsen-tot-10  [TBD: split into herken-10 / noteren-10?]
        │                                               │
        │                                       ┌───────┴───────┐
        │                                       │               │
        │  (+ getalbegrip-10)                   │         tienvrienden
        ├────────► +1-2-tot-10                  │
        │              │                        │
        │              ▼                        │
        │         +3-4-tot-10                   │
        │              │                        │
        │              │  (+ splitsen-tot-10)   │
        │              └─────────►  optellen-tot-10
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
                       │  (+ splitsen-tot-10)
                       ▼
              aftrekken-wegnemen-10
                       ├──► aftrekken-verschil-10   (+ aftrekken-verschil-5)
                       └──► aftrekken-aanvullen-10  (+ aftrekken-aanvullen-5)
```

Decision recap: **splitsen-tot-10 only gates the *full* tot-10 arithmetic skills, not the +1-2 / +3-4 / -1-2 / -3-4 intermediates.** Splitsen knowledge isn't a hard prereq for counting on by 1, 2, 3, 4 — making it one risks stalling the whole arithmetic track. Splitsen becomes a hard prereq only at the full optellen-tot-10 / aftrekken-wegnemen-10 step.

**Splitsen-tot-5 split (decided)**: `splitsen-tot-5` is split into two skills — `splitsen-herken-5` (recognition / perceptual) and `splitsen-noteren-5` (notation / production). Recognition unlocks the +/- track; notation is parallel, not a prereq for arithmetic.

**Open question — splitsen-tot-10**: does the same herken/noteren split apply at the tot-10 level? If yes, which side does `splitsen-tot-10`'s current downstream (`tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10`) depend on? And which side does it connect to from tot-5 (`splitsen-noteren-5` → `splitsen-noteren-10`, or `splitsen-herken-5` → `splitsen-herken-10`, or cross-links)? Still open — *Didactic frame §7* argues against mirroring the split and for dividing the skill by total instead.

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
- **`unlocks`**: `splitsen-tot-10`, `+1-2-tot-10`, `-1-2-tot-10`
- **`subsumed_by`**: `null` (would be `getalbegrip-20`, out of scope)
- **Generator**: n ∈ [1, 10], biased 70% to [6, 10] — the skill's identity is the 5-anchor extension; 1–5 keeps a refresh share
- **Applicable exercise types**: as `getalbegrip-5` plus `rekenrek-show`, `ten-frame-show`, `number-sequence-order`, `show-me-on-ten-frame`, `numberline-read`, `quantity-match`, `subitise-flash`

### Splitsen

#### `splitsen-herken-5`
- **Name**: Splitsen herkennen tot 5
- **Intent**: First half of the part-whole spine: perceptually identifies the two parts of a structured total 2–5. The recognition foundation under all upcoming +/− work; production (notation) runs in parallel.
- **`unlocked_by`**: `getalbegrip-5`
- **`unlocks`**: `splitsen-noteren-5`, `+1-2-tot-5`, `-1-2-tot-5`, `splitsen-tot-10` *(see open question above)*
- **`subsumed_by`**: `splitsen-tot-10` *(TBD if tot-10 also splits)*
- **Generator**: total ∈ [2, 5] weighted 1:2:3:4 (linger on 5, the structural anchor; total 2 only has 1+1); (a, b) with a+b = total, a ≥ 1, b ≥ 1 (no trivial 0-splits)
- **Applicable exercise types**: `dot-pattern-decompose`, `splits-frame`, `splits-herken-huisje`, `same-split-or-different`, `splits-match`, `splits-shuffle`, `splits-build-it` *(rekenrek presentations deferred to tot-10 where the 5-structure earns them; see also parked: `dot-pattern-decompose-pad`)*

#### `splitsen-noteren-5`
- **Name**: Splitsen noteren tot 5
- **Intent**: Second half of the part-whole spine: produces splits of totals 2–5 in the canonical Flemish notations (splitshuisje, splitsbenen, missing-part equations). Where herken reads a split that's shown, noteren generates one or completes it — the production complement to recognition. Runs parallel to the +/− track, not a prereq for it.
- **`unlocked_by`**: `splitsen-herken-5`
- **`unlocks`**: *(nothing in the v2 graph — runs parallel to the +/- track, doesn't gate arithmetic)*
- **`subsumed_by`**: `splitsen-tot-10` *(TBD — if tot-10 also splits, this becomes `splitsen-noteren-10`)*
- **Generator**: fact-proportional over totals 2–5 (5 naturally lingers — most splits); 0-splits join the fact space from score 30, accepted in splits-vrij and required in splits-alle.
- **Applicable exercise types**: `splitshuisje` (entry — the herken house, now written), `splitsbenen` (from 25 — second notation, transfer), `splits-ontbreken-rechts` ("5 is 3 en ?" wording → "5 = 3 + ?" equation form at 55, after + landed via the + track), then post-60: `splits-ontbreken-links`, `splits-vrij` (nog-een variety round), `splits-alle` (full table). **Boundary invariant vs herken**: the parts are never visible on screen — the roof die-aid is always an unsplit pattern; tier-0 choice is answer-entry scaffolding, numpad from ~30 is true production. Herken's `num-two` tier (74+) ≈ noteren's entry is the intended dual-rotation handover.

#### `splitsen-tot-10`
> **TBD**: should this also split into `splitsen-herken-10` / `splitsen-noteren-10`? If so, which side does each downstream skill (`tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10`) hang off, and how does it connect upstream to the tot-5 herken / noteren pair? Entry below describes the current pre-split form.

- **Name**: Splitsen tot 10
- **Intent**: the part-whole spine extended to 6–10: every split of 6, 7, 8, 9 and 10 known paraat — the fact base that sums and differences to 10 are read from (getalfamilie), and that the brug over 10 later leans on.
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: (1) the missing part named at once, not counted — paraat knowledge of the splits to 10 is a Flemish minimum goal and, per the UCLL line, first-year work; (2) the splits organised, not 35 loose facts — anchors, turn-around, neighbour step, and the full table per total; (3) the split usable as a getalfamilie, so that it can answer a sum or a difference later. Why: *Didactic frame §1, §2, §7*.
- **`unlocked_by`**: `splitsen-herken-5`, `getalbegrip-10` *(was `splitsen-tot-5`)*
- **`unlocks`**: `tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10`
- **`subsumed_by`**: `null` (would be `splitsen-tot-20`)
- **Generator**: total ∈ [6, 10]; a ≥ 1, b ≥ 1
- **Applicable exercise types**: as `splitsen-herken-5` + `splitsen-noteren-5`; rekenrek presentations especially natural here because of the 5-structure *(which structured picture carries 6–10 is an open question — Didactic frame §6)*

#### `tienvrienden`
- **Name**: Tienvrienden / vrienden van 10
- **Intent**: instant recall of the 5 pairs that make 10 (1+9, 2+8, 3+7, 4+6, 5+5) in both orders — the splits of 10, practised until no thinking time is needed
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: (1) speed — the partner comes without counting, fingers or a picture; (2) from both sides and in every form (split, `7 + . = 10`, `10 − 7`); (3) its purpose is the brug over 10, where the second term is split without attention being spent on it. This is the one skill whose goal a right/wrong score does not measure — *Didactic frame §1*.
- **`unlocked_by`**: `splitsen-tot-10`
- **`unlocks`**: future `brug-van-10` (out of scope)
- **`subsumed_by`**: `null` — fact-recall drill, kept in rotation through brug van 10
- **Generator**: a ∈ [1, 9], b = 10 − a; presentation almost always as `a + ? = 10`
- **Applicable exercise types**: `splits-ontbreken-rechts` (`8 + ? = 10`), `splits-ontbreken-links` (`? + 7 = 10`), `tienveld-fill`, `rekenrek-make-ten`. Few or no other types — this skill is specifically about automaticity.

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
- **Generator**: a ∈ [1, 4], b ∈ [1, 5−a]
- **Applicable exercise types**: as `+1-2-tot-5`; at high score `fill-plain` and `tf` dominate, visuals weight down

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
- **`unlocked_by`**: `+3-4-tot-10`, `splitsen-tot-10`
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
- **`unlocks`**: `aftrekken-verschil-5`, `aftrekken-aanvullen-5`, `-1-2-tot-10`
- **`subsumed_by`**: `aftrekken-wegnemen-10`
- **Generator**: a ∈ [2, 5], b ∈ [1, a]
- **Applicable exercise types**: `wegnemen-crossed-out` (heavy at low score), `doosje`, `numberline-jump-back`, `fill-plain`, `choice`, `tf`

#### `aftrekken-verschil-5`
- **Intent**: difference meaning — "Anna heeft 5, Tom heeft 2, hoeveel meer Anna?" Both groups still exist; nothing is removed. The Flemish goal documents call this aftrekken als *vergelijking*.
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: the arithmetic is already known — the work is (1) the relational question "hoeveel meer / hoeveel minder" (terms the minimum goals already list for kleuters), (2) pairing off as the action that makes a difference visible, (3) seeing that a − sum fits although nothing leaves, larger number first. *Didactic frame §3.*
- **`unlocked_by`**: `aftrekken-wegnemen-5`
- **`unlocks`**: `aftrekken-verschil-10`
- **`subsumed_by`**: `aftrekken-verschil-10`
- **Generator**: same math as `aftrekken-wegnemen-5`; presentation always two-groups-side-by-side
- **Applicable exercise types**: `verschil-two-groups` (heavy at low score), `verschil-rekenrek`, `fill-plain` (with verbal phrasing "hoeveel meer / hoeveel minder"), `choice`

#### `aftrekken-aanvullen-5`
- **Intent**: missing-part meaning — "Tom heeft 2 en wil 5. Hoeveel erbij?" Operationally same as `splits-ontbreken-rechts` framed as subtraction. In Flemish terms: the puntoefening `2 + . = 5`, and aftrekken worded as aanvullen (indirect optellen).
- **Key to achieve** *(goal and pitfalls in full: `skills.ts`)*: (1) the puntoefening solved from the getalfamilie, not by trying or counting up; (2) split, sum and difference recognised as one fact in three notations; (3) the = sign read as a relation — this is the first sum whose unknown is not at the end. *Didactic frame §2, §3, §4.*
- **`unlocked_by`**: `aftrekken-wegnemen-5`
- **`unlocks`**: `aftrekken-aanvullen-10`
- **`subsumed_by`**: `aftrekken-aanvullen-10`
- **Generator**: same math
- **Applicable exercise types**: `aanvullen-target`, `splits-ontbreken-rechts` framed as min-sum, `numberline-jump-up-from-b`, `fill-plain`, `choice`

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
- **`unlocked_by`**: `-3-4-tot-10`, `splitsen-tot-10`
- **`unlocks`**: `aftrekken-verschil-10`, `aftrekken-aanvullen-10`
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

#### `aftrekken-aanvullen-10`
- **Intent**: missing-part meaning within 10
- **`unlocked_by`**: `aftrekken-wegnemen-10`, `aftrekken-aanvullen-5`
- **`unlocks`**: future `aftrekken-aanvullen-20`
- **`subsumed_by`**: `null`
- **Generator**: a ∈ [2, 10], b ∈ [1, a]; aanvullen presentations
- **Applicable exercise types**: as `aftrekken-aanvullen-5` extended

---

## Didactic frame — tot-5 arithmetic, splitsen tot 10, tienvrienden

Scope: `optellen-tot-5`, `aftrekken-wegnemen-5`, `aftrekken-verschil-5`, `aftrekken-aanvullen-5`, `splitsen-tot-10`, `tienvrienden`. The goal and the pitfalls of each skill are in `skills.ts` (`didactics`); this section holds the reasoning behind them and the questions they raise. It was written before any exercise for these skills was designed, and is meant to be revised when they are.

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

---

## Subsume audit table

Every in-scope skill, its `subsumed_by` value, and the strict-superset check that justifies it.

| Skill | `subsumed_by` | Strict superset? |
|---|---|---|
| `getalbegrip-5` | `getalbegrip-10` | ✓ |
| `getalbegrip-10` | `null` | — (out of scope parent) |
| `splitsen-herken-5` | `splitsen-tot-10` *(TBD: `splitsen-herken-10` if tot-10 splits)* | ✓ |
| `splitsen-noteren-5` | `splitsen-tot-10` *(TBD: `splitsen-noteren-10` if tot-10 splits)* | ✓ |
| `splitsen-tot-10` | `null` | — *(TBD if this skill splits)* |
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
| `aftrekken-aanvullen-5` | `aftrekken-aanvullen-10` | ✓ |
| `-1-2-tot-10` | `aftrekken-wegnemen-10` | ✓ |
| `-3-4-tot-10` | `aftrekken-wegnemen-10` | ✓ |
| `aftrekken-wegnemen-10` | `null` | — |
| `aftrekken-verschil-10` | `null` | — |
| `aftrekken-aanvullen-10` | `null` | — |

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
| `rekenrek-decompose` | beads on a rekenrek already showing the split, child names parts | 20-bead rack | choice / numpad | mid (esp. tot-10) |
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
| `verschil-two-groups` | two groups side-by-side, "hoeveel meer?" | comparison | low (verschil) |
| `verschil-rekenrek` | top row vs bottom row, count the difference | comparison | mid (verschil) |
| `aanvullen-target` | target (e.g. 5 stars) + partial (3 stars), fill missing | missing-part | low (aanvullen) |
| `numberline-jump-back` | start at a, jump back b | terugtellen | low–mid (wegnemen) |
| `numberline-jump-up-from-b` | start at b, jump up to a, count the jumps | aanvullend optellen | mid (aanvullen) |
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
