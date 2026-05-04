# Rekenen v2 — Claude context

Dutch math practice app for a young child. Addition only (v2). React + Vite + TypeScript.

## Core model (read first)

Skills are narrow and atomic (e.g. "+1/+2 binnen 5"). Each skill has a score 0–50. Unlock graph is one-way — a skill unlocks successors at score ≥ 25 (UNLOCK_THRESHOLD in `engine/scoring.ts`). A falling score never re-locks downstream skills. The score controls *which exercise type* is chosen (via weight matrix), not what math the skill covers.

## Module map

| Path | Responsibility |
|---|---|
| `src/curriculum/skills.ts` | Skill definitions (data — add new skills here) |
| `src/curriculum/unlockGraph.ts` | Which skill unlocks which (data) |
| `src/curriculum/weightMatrix.ts` | Score → exercise-type weights (data) |
| `src/engine/scoring.ts` | applyCorrect / applyWrong, thresholds |
| `src/engine/unlockEvaluator.ts` | Walks graph, returns newly unlocked ids |
| `src/engine/exerciseSelector.ts` | Picks skill + exercise, generates question |
| `src/exercises/types.ts` | **ExerciseDefinition** interface — the OO contract |
| `src/exercises/registry.ts` | Global exercise registry (Map) |
| `src/exercises/index.ts` | Imports all exercise files to trigger registration |
| `src/exercises/FillVisual.tsx` | Visual fill exercise (dots / scene groups) |
| `src/exercises/FillPlain.tsx` | Plain numpad exercise |
| `src/exercises/Choice.tsx` | 4-option multiple choice |
| `src/exercises/TrueFalse.tsx` | Waar / niet waar? |
| `src/exercises/Collect.tsx` | Tap (low score) or counter (higher score) |
| `src/exercises/NumberLine.tsx` | Number line with choice buttons |
| `src/presentation/scenes.ts` | SCENES array + pickScene / pickColors helpers |
| `src/presentation/components/` | DotGroup, SceneGroup |
| `src/state/types.ts` | Profile, AppState, SkillState types |
| `src/state/storage.ts` | localStorage load/save, updateSkillScore |
| `src/ui/App.tsx` | Root: profile boot, screen routing |
| `src/ui/KidMode.tsx` | Full-screen exercise loop |
| `src/ui/AdminMode.tsx` | Profile management |
| `src/ui/components/` | NumPad, ChoiceButtons, TFButtons |

## Adding a new exercise type

1. Create `src/exercises/MyExercise.tsx` with a typed `Meta` interface, a component, and call `registerExercise(...)`.
2. Import it in `src/exercises/index.ts`.
3. Add its weight in `src/curriculum/weightMatrix.ts`.

## Adding a new skill

1. Add a `SkillDefinition` entry in `src/curriculum/skills.ts`.
2. Wire its unlock edges in `src/curriculum/unlockGraph.ts`.
3. No code changes needed.

## Dev commands

```
npm run dev       # Vite dev server (hot reload)
npm run typecheck # tsc --noEmit
npm run build     # production build
```

## Key decisions (locked)

- Multi-profile from day one, localStorage (storage.ts is the only layer to swap for a backend)
- No audio in v2
- Subtraction is v3 — exercises are parameterised for it but curriculum stays addition-only
- No hidden admin — plain ⚙️ Opties button, kids can see it, no harm done
- Art direction parked — UI separated from logic for easy reskin
