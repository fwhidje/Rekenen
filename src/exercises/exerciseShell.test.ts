/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'

// Consistency tripwire: every exercise component renders its prompt through the
// shared <ExerciseTitle> band (presentation/components/ExerciseFrame). This is
// the enforceable half of the unified-UI rule — a title in its own separate
// band — so new exercises inherit the shell instead of re-rolling chrome.
// (ExerciseStage is intentionally NOT required: pure choice-of-cards exercises
// have no stage, their options are each their own background.)
//
// Files are read as raw text via Vite's import.meta.glob (no node:fs), so the
// check needs no extra type deps.

const modules = import.meta.glob('./*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const exerciseFiles = Object.entries(modules).filter(
  ([path]) => !path.endsWith('.test.tsx'),
)

describe('exercise shell', () => {
  it('discovers exercise files', () => {
    expect(exerciseFiles.length).toBeGreaterThan(0)
  })

  it.each(exerciseFiles)('%s renders an ExerciseTitle band', (path, src) => {
    expect(
      src.includes('ExerciseTitle'),
      `${path} must render <ExerciseTitle> — every exercise needs a title in its own band`,
    ).toBe(true)
  })
})
