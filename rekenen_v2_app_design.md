# Rekenen v2 — App Design Reference

Working document for the app-design conversation. The **core logic** (skills, scoring, unlocks, score → exercise-type weighting) is settled and lives in a separate note (`core_logic.md` summary). This document covers everything *around* that core: how the app is built, runs, persists, looks, and gets iterated on.

---

## Context

A Dutch math practice app for a young child just starting addition. A working POC exists as a single-file React artifact (and a standalone HTML version) — adaptive, themed scenes, multiple exercise types, generated questions, sequential reveal animations. The POC's logic was 4 hardcoded levels, which is too flat. v2 replaces that with the skill-graph + score-weight model.

v2 also moves off a single artifact into a proper project, partly so the codebase is amenable to iterative work in Claude Code.

---

## What's already settled

**Logic model** (see `core_logic.md`):

- Atomic narrow skills as data, with an unlock graph between them
- Per-skill 0–100 score, up on correct, down on wrong
- Unlocks one-way (dropping score never re-locks downstream skills)
- Score → exercise-type weighting is where difficulty lives within a skill
- Initial score on unlock = 0; unlock threshold 60 (global tweakable)

**Product-level intents** (carried over from POC):

- Dutch, simple short words
- Questions generated, never a fixed list
- The actual sum/equation always visible alongside any visual
- Sequential reveal for early/scaffolded exercises (items appear with the digit appearing in sync)
- Generated themed scenes (stars/fish/cows/bees/butterflies/frogs/etc.) rather than plain emoji rows
- No reading required — kid plays standalone

---

## Dimensions to think through

### 1. Deployment form

What does "running the app" actually look like?

- **Single-page web app, hosted somewhere** — easiest to update, but needs a server and an internet connection.
- **PWA (installable web app)** — looks like a real app on the tablet home screen, works offline, still updates when online. Probably the sweet spot.
- **Standalone HTML file, opened locally** — what the POC ended up as. Zero install, no internet needed, but updates mean re-sending the file.
- **Native** — overkill for this.

Primary device matters: if it's a tablet (likely), touch targets, portrait orientation, and PWA install matter most. If it's also expected to run on a parent's laptop sometimes, that's another constraint.

### 2. Tech stack

The obvious modern baseline: **React + Vite + TypeScript**. TypeScript is worth it here because the skill/score/exercise data structures are exactly the kind of thing that benefits from typing as the curriculum grows.

Alternatives worth a moment:

- **Svelte / SvelteKit** — leaner runtime, nice for a small app. Trade-off: less Claude Code training data than React.
- **Plain vanilla HTML/JS** — what the POC fell back to for offline. Possible, but a real project will outgrow it fast.

State: React's own state for now. A persistence layer can be a thin wrapper, no Redux/Zustand needed at this scale.

### 3. Persistence

Currently zero — every session starts fresh. v2 needs to remember:

- Score per skill
- Which skills are unlocked
- Recent history (for any future repetition tracker, and for debug)

Storage options:

- **localStorage** — trivial, ~5MB, fine for this scale
- **IndexedDB** — overkill unless history grows huge or multi-profile becomes real
- **Cloud sync** — only if the app needs to follow the kid across devices

A small open question: **single profile or multi-profile?** If a sibling joins later, or if other parents use it, profiles matter. Cheap to design in from the start, expensive to retrofit.

### 4. Module structure

Rough proposed shape (names negotiable):

```
engine/        — skill scoring, unlock evaluation, exercise selection
curriculum/    — data: skill definitions, unlock graph, score→type-weight matrix
exercises/     — one module per exercise type (visual fill, plain fill, choice, tf, collect, numberline, …)
presentation/  — themed scenes, animations, reveal logic
ui/            — app shell, kid mode screen, parent/admin screens, debug overlay
state/         — persistence layer (read/write skill scores, history)
```

Key separation: **the curriculum is data, the engine is code, the exercises are components**. Adding `subtract -1/-2 within 10` should be a JSON edit, not a code change.

### 5. UI shell — two modes

- **Kid mode** — focused, fullscreen, no menus, no escape hatches. Just the current exercise. The kid can't navigate out, can't see scores, can't change settings.
- **Parent/admin mode** — set-up (which child profile, reset progress), progress view (per-skill scores, unlock graph state), debug overlay (current skill, why this exercise was chosen, recent history).

Question to resolve: **how does the parent get into admin mode without the kid stumbling in?** A long-press on a corner, a hidden gesture, a PIN — pick something deliberately rather than letting it surface accidentally.

### 6. Art direction (parked but in scope)

From earlier conversations, noted but not yet acted on:

- Storybook / paper-texture feel rather than glossy UI
- Organic, irregular shapes; scenes feel embedded in a world, not floating in cards
- Animations are world-behaviour (a star twinkles, a cow sways) rather than UI feedback (button bounces, modal slides in)

This shapes a lot — it affects component structure, asset pipeline, possibly even tech choice (e.g. SVG-heavy vs CSS-heavy). Worth pinning at least *direction* before component design freezes, even if the assets land later.

### 7. Audio

Not previously discussed but worth a flag:

- Reward sounds on correct answers? Ambient background? Spoken Dutch prompts (helpful since the kid can't read)?
- All optional, but each is a real authoring task.
- Easy to design "off" as the safe default.

### 8. Curriculum extensibility

The skill graph naturally extends to subtraction, then to other operations (doubles, near-doubles, ten-friends, etc.). But each operation may want its own visual idioms — subtraction maps well to "items leaving" or "fish swimming away", which is a different render pattern from "two groups combined". The exercise components should be parameterised by the operation, not hardcoded around `+`.

### 9. Debug / dev overlay

Already agreed Claude will build this once the logic lands, but worth listing what it should show so it's designed in from day one:

- All skills, current score, unlock state
- Which skill is currently selected and why
- The full score → type-weight curve at the current score (so you can see *why* the engine picked this exercise type)
- Recent question history with outcomes
- Manual override: jump a skill's score, force unlock, reset

### 10. Claude Code workflow

The project should be friendly to AI-assisted iteration:

- Clear module boundaries — a change to "how the collect mechanic feels" should touch one file
- Light test coverage on the engine (skill scoring, unlock logic, exercise selection) — these are pure functions with clean inputs and outputs, very testable
- Curriculum data validated on load (so a typo in skill JSON fails loudly)
- A README describing the model in two paragraphs, so any new chat picks up context fast

---

## Open questions for tomorrow's chat

1. **Deployment form** — PWA, hosted web app, or standalone HTML? Which devices is the kid (and you) actually going to use?
2. **Single vs multi-profile** — design in from the start, or add later?
3. **Admin entry** — long-press, gesture, PIN, or something else?
4. **Art direction** — does the storybook/paper direction get committed to v2, or stay parked while we ship a functional v2 first?
5. **Audio** — in or out for v2?
6. **Subtraction** — part of v2 scope, or v3?
7. **Tech stack confirmation** — React+Vite+TS by default, unless there's a reason not to.

Anything beyond these (scheduler design, repetition tracker, persistence schema, debug overlay specifics) can wait until after these are pinned.

> those were answered: Browser-based app, PWA as a nice-to-have later. Multi-profile from the start so it scales if another kid joins. No hidden admin mode — just a straightforward options button, kid can see their scores, no harm done. Art direction and fancy visuals parked for now, but the UI stays separate from the logic so it's easy to reskin later. No audio in v2. Subtraction is v3, v2 stays addition-only. Tech stack is React, Vite, and TypeScript, and you'll learn the web stuff as we build with Claude Code. we'll design the storage layer from day one to be multi-profile aware, even if we start with just localStorage. That way when you eventually do want a synced backend, it's a matter of swapping out the storage implementation, not refactoring everything. Future-proof and clean.
