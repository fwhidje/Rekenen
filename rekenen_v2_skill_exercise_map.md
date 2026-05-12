# REKENEN v2 — Skill & Exercise Map

Working draft for the v2 curriculum data. Covers everything up to and including **splitsen tot 10** and **+/- tot 10** (end of L1 Period 2 in the Flemish progression). Out of scope here: getalbegrip tot 20, +/- tot 20 zonder brug, brug van 10. They extend the same shape and will be added later.

This is meant as input for Claude Code. All open questions from earlier drafts have been resolved (see *Resolved decisions* at the bottom).

---

## Conventions

- **Skill IDs**: kebab-case, lowercase, scope-suffixed (e.g. `splitsen-tot-10`, `aftrekken-wegnemen-5`).
- **Vocabulary**: Flemish (splitsen, tienvrienden, dubbel, helft, buurgetal, wegnemen, verschil, aanvullen) — not NL variants.
- **Score model**: each skill has its own 0–50 score; unlock threshold ~25 (one-way); presentation difficulty lives in the score → exercise-type weight, not in the skill itself.
- **Generator pattern**: a small predicate over (a, b, op) describing what the engine may sample for that skill.

### Three independent skill relationships

Each skill carries three pieces of metadata, each with one job:

- **`unlocked_by`** — list of skills that must be ≥ threshold for this skill to become available.
- **`unlocks`** — list of skills this skill (at threshold) opens up. Just the inverse of `unlocked_by` from the other side.
- **`subsumed_by`** — *single* skill that, once unlocked, archives this one when its own score caps at 50. `null` if this skill should never be archived in v2 scope (e.g. fact-recall drills like `tienvrienden`).

`subsumed_by` is **not** the inverse of `unlocks`. A skill can unlock several downstream skills but be subsumed by only one of them — usually a strict math superset further along the same track.

### Subsume rule

```
if child.score == 50 AND child.subsumed_by != null AND child.subsumed_by.unlocked == true:
    archive(child)
```

Score is preserved on archive. The skill no longer enters rotation. There is no auto-resurrection — once archived, a skill stays archived (unlocks are one-way per the v2 logic).

The combination "capped (50) AND parent unlocked" gives every skill a guaranteed period of dual-rotation with its parent before it drops out, so there's no risk of a half-learned skill being archived.

---

## Skill graph

The diagram below shows **unlock dependencies** only. Subsume relationships are listed in the per-skill entries and the audit table further down.

```
                              getalbegrip-5
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
          splitsen-tot-5                          getalbegrip-10
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
        │                                       splitsen-tot-10
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

---

## Skills (detailed)

### Pre-arithmetic

#### `getalbegrip-5`
- **Name**: Getalbegrip tot 5 — number sense to 5
- **Intent**: recognises quantity, cijfersymbool, position on number line, dot-pattern, and finger-pattern for 1–5
- **`unlocked_by`**: [] (root)
- **`unlocks`**: `splitsen-tot-5`, `getalbegrip-10`
- **`subsumed_by`**: `getalbegrip-10`
- **Generator**: pick n ∈ [1, 5]
- **Applicable exercise types**: `count-and-tap`, `dot-pattern-recognise`, `finger-pattern-recognise`, `numberline-place`, `compare-more-less`

#### `getalbegrip-10`
- **Name**: Getalbegrip tot 10
- **Intent**: same for 1–10, with explicit awareness of the **5-structure** (6 = 5+1, 7 = 5+2, …) — entry point for the rekenrek
- **`unlocked_by`**: `getalbegrip-5`
- **`unlocks`**: `splitsen-tot-10`, `+1-2-tot-10`, `-1-2-tot-10`
- **`subsumed_by`**: `null` (would be `getalbegrip-20`, out of scope)
- **Generator**: n ∈ [1, 10]
- **Applicable exercise types**: as `getalbegrip-5` plus `rekenrek-show`, `ten-frame-show`

### Splitsen

#### `splitsen-tot-5`
- **Name**: Splitsen tot 5
- **Intent**: knows the splits of 2, 3, 4, 5 in both orders (5 = 1+4 *and* 4+1, 5 = 2+3 *and* 3+2)
- **`unlocked_by`**: `getalbegrip-5`
- **`unlocks`**: `+1-2-tot-5`, `-1-2-tot-5`, `splitsen-tot-10`
- **`subsumed_by`**: `splitsen-tot-10`
- **Generator**: total ∈ [2, 5]; pick (a, b) with a+b = total, a ≥ 0, b ≥ 0
- **Applicable exercise types**: `splits-vrij`, `splits-ontbreken-rechts`, `splits-ontbreken-links`, `splits-alle`, `splitshuisje`, `splitsbenen`, `dot-pattern-decompose`, `rekenrek-decompose`

#### `splitsen-tot-10`
- **Name**: Splitsen tot 10
- **Intent**: same for 6, 7, 8, 9, 10. The "boss splitgetal" is 10 — its 11 splits get drilled to recall, not calculation.
- **`unlocked_by`**: `splitsen-tot-5`, `getalbegrip-10`
- **`unlocks`**: `tienvrienden`, `optellen-tot-10`, `aftrekken-wegnemen-10`
- **`subsumed_by`**: `null` (would be `splitsen-tot-20`)
- **Generator**: total ∈ [6, 10]
- **Applicable exercise types**: as `splitsen-tot-5`; rekenrek presentations especially natural here because of the 5-structure

#### `tienvrienden`
- **Name**: Tienvrienden / vrienden van 10
- **Intent**: instant recall of the 5 pairs that make 10 (1+9, 2+8, 3+7, 4+6, 5+5) in both orders
- **`unlocked_by`**: `splitsen-tot-10`
- **`unlocks`**: future `brug-van-10` (out of scope)
- **`subsumed_by`**: `null` — fact-recall drill, kept in rotation through brug van 10
- **Generator**: a ∈ [1, 9], b = 10 − a; presentation almost always as `a + ? = 10`
- **Applicable exercise types**: `splits-ontbreken-rechts` (`8 + ? = 10`), `splits-ontbreken-links` (`? + 7 = 10`), `tienveld-fill`, `rekenrek-make-ten`. Few or no other types — this skill is specifically about automaticity.

### Optellen

#### `+1-2-tot-5`
- **Intent**: add 1 or add 2 within 5 — counting on, no structural reasoning required
- **`unlocked_by`**: `splitsen-tot-5`
- **`unlocks`**: `optellen-tot-5`
- **`subsumed_by`**: `optellen-tot-5`
- **Generator**: a ∈ [1, 4], b ∈ {1, 2}, a + b ≤ 5
- **Applicable exercise types**: `fill-vis`, `fill-plain`, `choice`, `tf`, `collect-tap`, `collect-counter`, `numberline-jump`. Heavy bias to `fill-vis` and `collect-tap` at low score.

#### `optellen-tot-5`
- **Intent**: any optelling within 5 (a + b ≤ 5)
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
- **Intent**: take away 1 or 2 within 5 — counting back
- **`unlocked_by`**: `splitsen-tot-5`
- **`unlocks`**: `aftrekken-wegnemen-5`
- **`subsumed_by`**: `aftrekken-wegnemen-5`
- **Generator**: a ∈ [1, 5], b ∈ {1, 2}, b ≤ a
- **Applicable exercise types**: scaffolded heavily with `wegnemen-crossed-out` and `collect-counter-down`; later `numberline-jump-back`, `fill-plain`, `choice`, `tf`

#### `aftrekken-wegnemen-5`
- **Intent**: take-away meaning within 5 — "ik had 5, ik geef 3 weg, hoeveel blijft over?"
- **`unlocked_by`**: `-1-2-tot-5`, `optellen-tot-5`
- **`unlocks`**: `aftrekken-verschil-5`, `aftrekken-aanvullen-5`, `-1-2-tot-10`
- **`subsumed_by`**: `aftrekken-wegnemen-10`
- **Generator**: a ∈ [2, 5], b ∈ [1, a]
- **Applicable exercise types**: `wegnemen-crossed-out` (heavy at low score), `collect-counter-down`, `numberline-jump-back`, `fill-plain`, `choice`, `tf`

#### `aftrekken-verschil-5`
- **Intent**: difference meaning — "Anna heeft 5, Tom heeft 2, hoeveel meer Anna?" Both groups still exist; nothing is removed.
- **`unlocked_by`**: `aftrekken-wegnemen-5`
- **`unlocks`**: `aftrekken-verschil-10`
- **`subsumed_by`**: `aftrekken-verschil-10`
- **Generator**: same math as `aftrekken-wegnemen-5`; presentation always two-groups-side-by-side
- **Applicable exercise types**: `verschil-two-groups` (heavy at low score), `verschil-rekenrek`, `fill-plain` (with verbal phrasing "hoeveel meer / hoeveel minder"), `choice`

#### `aftrekken-aanvullen-5`
- **Intent**: missing-part meaning — "Tom heeft 2 en wil 5. Hoeveel erbij?" Operationally same as `splits-ontbreken-rechts` framed as subtraction.
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

## Subsume audit table

Every in-scope skill, its `subsumed_by` value, and the strict-superset check that justifies it.

| Skill | `subsumed_by` | Strict superset? |
|---|---|---|
| `getalbegrip-5` | `getalbegrip-10` | ✓ |
| `getalbegrip-10` | `null` | — (out of scope parent) |
| `splitsen-tot-5` | `splitsen-tot-10` | ✓ |
| `splitsen-tot-10` | `null` | — |
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

### Splitsen-specific

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `splits-vrij` | "Geef een splitsing van 7" — open, multiple correct | optional dot/rekenrek | numpad ×2 | low |
| `splits-ontbreken-rechts` | `7 = 4 + ?` | optional schematisch | numpad | mid |
| `splits-ontbreken-links` | `7 = ? + 3` (the harder one — kids want to count up from the total) | optional schematisch | numpad | mid–high |
| `splits-alle` | "Noem alle splitsingen van 7" | splitshuisje shows the slots | numpad multi | high |
| `splitshuisje` | The Flemish house notation: number on roof, parts in rooms | the house | numpad / drag | low–mid (canonical scaffold) |
| `splitsbenen` | Number with two "legs" coming down to the parts | the bone diagram | numpad | mid |

### Number-sense / pre-arithmetic

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `count-and-tap` | tap each item to count | scene with N items | tap | low |
| `dot-pattern-recognise` | "hoeveel?" with a dice/structured dot pattern | structured dots | choice / numpad | low–mid |
| `finger-pattern-recognise` | hand picture, kid identifies how many | hands | choice | low |
| `numberline-place` | "waar staat 7?" | empty number line | tap on line | mid |
| `compare-more-less` | which group has more / fewer | two groups | choice | low–mid |
| `rekenrek-show` | shows N beads in 5-structure, kid names the number | 20-bead rack | numpad / choice | mid |
| `ten-frame-show` | partly filled ten-frame | ten-frame | numpad / choice | mid |

### Optellen presentations

| ID | Description | Visual | Input | Suits |
|---|---|---|---|---|
| `fill-vis` | sum visible + scene visual of the two groups | themed scene | numpad | low |
| `fill-plain` | bare equation only | none | numpad | high |
| `choice` | sum + 4 answer buttons | optional visual | tap | mid |
| `tf` | sum + maybe-wrong answer; waar / niet waar | none | tap | mid |
| `collect-tap` | tap items into a basket, builds the answer | scene | tap-to-collect | low |
| `collect-counter` | start at C = a, tap + to add b, confirm | scene | +/- buttons | low–mid |
| `numberline-jump` | jump arrow shown, pick destination | number line | choice | mid |
| `rekenrek-add` | move beads to model a + b | rekenrek | drag / tap | mid |

### Aftrekken-specific presentations

Each implicitly suggests a strategy. The score → exercise-type matrix shifts which ones dominate per skill.

| ID | Description | Strategy nudged | Suits |
|---|---|---|---|
| `wegnemen-crossed-out` | one group with some items crossed out | direct take-away | low (wegnemen) |
| `verschil-two-groups` | two groups side-by-side, "hoeveel meer?" | comparison | low (verschil) |
| `verschil-rekenrek` | top row vs bottom row, count the difference | comparison | mid (verschil) |
| `aanvullen-target` | target (e.g. 5 stars) + partial (3 stars), fill missing | missing-part | low (aanvullen) |
| `numberline-jump-back` | start at a, jump back b | terugtellen | low–mid (wegnemen) |
| `numberline-jump-up-from-b` | start at b, jump up to a, count the jumps | aanvullend optellen | mid (aanvullen) |
| `collect-counter-down` | start at C = a, tap − b times, confirm | take-away | low (wegnemen) |

### Generic high-score

`fill-plain`, `choice`, `tf` — the "no-scaffolding" set, used at high score across most arithmetic skills.

---

## Score → exercise-type weighting (sketch)

Per the v2 logic, this is where difficulty lives. Below is a high-level shape; the actual numbers will need playtesting.

| Score band | Bias |
|---|---|
| 0–10 | scene visuals + collect/tap; numpad mostly avoided; reveal animations on |
| 10–25 | mix of fill-vis and choice; rekenrek/ten-frame appear; collect-counter replaces collect-tap |
| 25–40 | fill-plain becomes plurality; tf appears; visuals only on the "harder" instances of the skill |
| 40–50 | ~80% fill-plain; tf and choice fill the rest; visuals ≤ 10% |

Notes:

- Capped skills (score 50, not yet subsumed) stay in rotation, pinned at the top of this distribution. Once subsumed, they leave rotation entirely.
- For splitsen skills specifically, `splitshuisje` and `splitsbenen` should never disappear entirely — they're the classroom notation. Suggest a floor of ~10% even at score 50.
- For subtraction-semantic skills, the *strategy-suggestive* presentations should remain dominant within that skill (a `verschil-5` skill at high score still shows verschil presentations 60–70% of the time, just with less ornament).

---

## Per-question record + error-type taxonomy

Per-question records capture both correctness and *type of error*. The diagnostic value: an off-by-one error in `aftrekken-wegnemen-5` says something different (still terugtelling) than a reversal (non-commutativity not grasped) or a semantic-narrow error (treated as addition). The engine doesn't have to act on these signals in v2 — recording them reliably is enough; biasing scaffolding off them becomes a v2.x feature once there's data to look at.

### Record shape

```
{
  timestamp:      ISO string,
  skillId:        string,
  exerciseType:   string,                       // e.g. "fill-vis", "splitshuisje"
  problem:        { a, b, op: '+'|'-'|'split' },
  presentation:   object | null,                // optional render details (scene, sub-pattern, etc.)
  givenAnswer:    any,
  correctAnswer:  any,
  correct:        boolean,
  errorType:      enum | null,                  // null when correct == true
  responseTimeMs: number | null
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

---

## Resolved decisions (log)

For Claude Code context — what was considered and chosen during the design conversation.

1. **Atomicity**: `+1`/`+2` and `-1`/`-2` grouped into single skills (`+1-2-tot-5`, `-1-2-tot-5`, `+1-2-tot-10`, `-1-2-tot-10`), not kept as four atoms.
2. **Tot-10 progression**: intermediate `+3-4-tot-10` and `-3-4-tot-10` skills inserted between the easy version and the full one. Avoids the leap from "+1/+2" straight to "anything within 10."
3. **Subtraction semantics**: three separate skills per range (`wegnemen`, `verschil`, `aanvullen`), not a single skill with semantic exercise variants. Heavier but produces per-meaning fluency tracking. `verschil` and `aanvullen` unlock in parallel from `wegnemen`, not serially.
4. **Tienvrienden**: sibling of `splitsen-tot-10`, not a sub-skill. Independent score so automaticity is visible.
5. **Subsume model**: explicit `subsumed_by` field per skill, separate from `unlocks`. Rule: child capped (50) AND parent unlocked → archive, score preserved. Fact-recall skills (`tienvrienden`, `dubbels-tot-10`, `helften-tot-10`) have `subsumed_by: null` to keep them in rotation.
6. **Splitsen-tot-10 gating**: only gates the *full* tot-10 arithmetic skills, not the `+1-2` / `+3-4` / `-1-2` / `-3-4` intermediates. Avoids stalling the arithmetic track on splitsen maturity.
7. **Helften location**: hangs off `optellen-tot-10` (not aftrekken).
8. **Verschil/aanvullen at tot-10**: dual deps (tot-10 wegnemen *and* tot-5 cousin). Belt-and-braces.
9. **Vergelijken / compare-more-less**: an exercise type within `getalbegrip-5` / `getalbegrip-10`, not its own skill node.
10. **Error logging**: per-question record captures `errorType` enum; detection at recording time; initial enum kept minimal (`off-by-one`, `reversal`, `semantic-narrow`, `near-miss`, `tienvriend-mismatch`, `unclassified`).

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
