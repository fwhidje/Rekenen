# Road to AI-driven Rekenen

> **Long-term plan.** This file records where the project is heading and why,
> in enough detail to reconstruct the reasoning later. It is a direction, not a
> specification: details are expected to change as each step teaches us
> something.
>
> **It carries no status.** What is built lives in `CLAUDE.md` (see
> "Documentation ownership" there). Written November 2026 from a design
> discussion between Filip and Claude.

---

## 1. The goal

Turn Rekenen from a fixed adaptive engine into a system in which an **AI
teacher designs, deploys and evaluates its own exercises**.

- The app collects detailed evidence of how a child reasons.
- An agent uses that evidence to keep re-scoring the child, to revise its
  diagnosis of misunderstandings, and to redesign exercises that do not measure
  what they were built to measure.
- Every step must be **traceable to stated goals and recorded evidence**, so
  the result can be judged as more than a convincing-looking imitation of
  teaching.

It is two things at once: a proof of concept of whether an agent can do this
rigorously, and a serious tool for remote use.

### What stays, what opens up

| Stays | Opens up to the agent |
|---|---|
| The app is the child-facing interface | Which exercises fill each skill |
| The skill tree keeps its leerplan-based skeleton | How skills are divided within that skeleton |
| The live play loop stays deterministic | Weights, tiers, distractors, copy |
| Filip has the final say on anything flagged | Proposing new exercise types |

---

## 2. Structure

Four parts. The agent sits **outside** the play loop.

```
 Child app ──events──▶ Evidence store ──read──▶ Agent (batch, between sessions)
     ▲                 (append-only)               │ diagnoses, evaluations, proposals
     │                                             ▼
     └──── release ◀── Design registry ◀── Gate (automatic checks + Filip's review)
```

1. **Child app.** Renders exercises, runs the deterministic selector, emits
   events. It loads a *release*: an immutable, numbered snapshot of skill
   nodes, exercise versions and weights.
2. **Evidence store** (Supabase). The answer stream, server-side and uncapped.
   Every event is stamped with what was served (exercise version, skill-node
   version, release) and the child's score at that moment. Later it also holds
   process traces — taps, drags, replays, timing — because "how a child
   reasons" is not in a right/wrong record.
3. **Design registry.** Versioned skill nodes with lineage; one design record
   per exercise; Filip's verdict cases.
4. **Agent.** Runs periodically, reads evidence, writes only proposals.
   Nothing reaches a child except through a release.

### The loop

Play → events → agent run → gate → new release → probation → the next run
evaluates it. Each agent run does three things:

- **Diagnose** — update its view of each child.
- **Evaluate** — check exercises against the criteria fixed before deployment.
- **Propose** — suggest changes, within the change budget.

---

## 3. Design choices and their reasons

**The agent does not pick the next exercise live.** The runtime stays the
deterministic selector. This keeps latency, offline play and cost out of the
picture, and every served exercise is explainable from release + score.

**Exercises split into templates and variants.** A *template* is a React
component — code. A *variant* is data: template, tier thresholds, fact-space
filter, distractor policy, copy, weight. The agent changes variants through
the registry (fast loop) and proposes new templates as pull requests that
Filip reviews (slow loop). The agent never ships arbitrary UI to a child at
runtime.

**The agent interprets numbers; it does not compute them.** Metrics come from
fixed queries whose results are stored, and the agent cites them by id.
Otherwise "traceable" means trusting the agent's account of its own
arithmetic.

**The live score and the agent's diagnosis stay separate.** The +1/−3 score
keeps driving scaffolding and unlocks. If the agent wants to move a child, it
issues an explicit, recorded adjustment (the admin progress override is the
existing seam).

**Skill nodes are versioned, like exercises.** If the agent splits "splitsen
tot 10" into two nodes, earlier answer events must still map unambiguously to
what they measured. Splits and merges carry explicit lineage mappings, so the
history stays interpretable.

---

## 4. Exercises: records, lifecycle, review

### Design record (one per exercise version)

- What it targets (skill, misconception).
- **Which kind of "working" it promises.** These diverge — an exercise can
  diagnose well and teach nothing, or the reverse:
  - it discriminates between misconceptions as designed;
  - it predicts later performance;
  - it moves the child forward.
- Success criteria, **fixed before deployment** and timestamped.
- Whether the record is **retrospective**. The current hand-built exercises get
  records written after the fact (source: the didactics on each exercise
  definition and `rekenen_v2_skill_exercise_map.md`). Evaluations against
  retrospective criteria are weaker evidence and are marked as such.

### Lifecycle

```
draft → probation → active → flagged → under review (Filip) → retired | revised
```

**Retire, never delete.** Retired exercises and their verdicts are what stop
the agent from regenerating the same failed design a month later.

### Filip's review queue

Exercises the agent judges non-functional go to Filip for testing and a
verdict. A stored case holds:

- the exercise version;
- the evidence the agent flagged;
- the agent's own diagnosis;
- Filip's verdict;
- **Filip's reasoning.**

Reasons matter: with verdicts alone the agent drifts toward predicting
approval instead of pedagogical effectiveness. With reasons, a later case can
cite a precedent and say why it applies.

The queue is also the **measure of the agent**: every flag-and-verdict pair
shows how often it flags correctly and where its diagnoses miss. That data
decides when it can be trusted to retire or revise without review.

---

## 5. Seeding and pace of change

- **The current exercises are the initial pool**, so the app is functional
  from day one. The agent seeds a few of its own next to them.
- **The baseline doubles as a comparison group.** Agent and baseline exercises
  on the same skill can be compared on the same child over the same period —
  the closest this setup gets to testing whether the agent adds anything. It
  only works if the baseline is not revised at the same time.
- **Never shift too much at once, as an explicit rule.** For example: a cap on
  new or revised exercises per period, and at most one change per skill at a
  time. The second part is about attribution: if two things change in one
  skill and performance moves, the trace cannot say which caused it.

---

## 6. Privacy rules

The data is **pseudonymous, not anonymous**: an account has a parent's email,
and events belong to a child under that account. Treat it as personal data of
children.

- **Identity lives in one place.** The parent's email is in Supabase's auth
  table and nowhere else.
- **Children are a random id plus a nickname** the parent picks. Names sit in
  their own table.
- **The agent never sees the auth table or the names table.** Its database
  role reads events, progress and child ids only: "child 7f3a, these 400
  answers".
- **School year, never a birth date** — and only as optional context.
- **No free text from children.** Answers are numbers or choices. A test
  tripwires that the child's name never enters an event.
- Filip sees names under his own parent login; no separate id-to-name file is
  kept.
- Not intended for public use for now. Opening it to other families needs a
  proper look at consent and data-protection duties first.

---

## 7. Build order

1. **Accounts + evidence store.** Parent accounts (email + password), children
   under them, progress synced across devices, the answer stream uploaded with
   version stamps. Local play without an account keeps working. No agent.
2. **Registry and releases as data.** Skill nodes and exercise variants move
   from code constants to versioned data; retrospective design records for the
   current pool.
3. **Agent, read-only.** It writes diagnoses and evaluations; Filip judges
   them. No write power. This measures the agent before it can change
   anything, and tells us whether the rest is worth building.
4. **Variant proposals** under the change budget, through the gate.
5. **New templates** via pull request.

Process traces (every tap and drag with timing) are a separate later step. What
to capture depends on what the agent turns out to need; it touches every
exercise file.

---

## 8. Known weaknesses

- **Sample size.** With a handful of children, "discriminates between
  misconceptions" or "predicts later performance" cannot be established
  statistically. Evaluations are case-study evidence. Criteria must be
  judgeable at small n, and **"insufficient evidence" must be a legal agent
  output** — otherwise it will produce confident verdicts from noise.
- **The agent grades its own designs.** Fixing criteria in advance helps but
  does not remove this. Filip's review queue is the only independent check, so
  it is load-bearing.
- **Retrospective records are weaker evidence** than criteria set at design
  time (see §4).

## 9. Open decisions

- **Weighting.** How agent exercises enter the selector: a fixed share, a
  probation cap, or the same weighting as the baseline. The share for
  exercises on probation and the rule for promoting them are the two
  parameters the rest of the evaluation depends on.
- **The change budget's actual numbers** (per period, per skill).
- **What "good-working" means per exercise** — chosen per design record, but
  the menu in §4 may need refining once real evaluations exist.
- **What process traces to capture**, and their storage cost.
- **When the agent may act without review**, based on its track record in the
  queue.
