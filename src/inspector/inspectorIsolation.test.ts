/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'

// Tripwires for the inspector's two promises (CLAUDE.md → Inspector):
// 1. Separate: no app code imports from src/inspector/. The inspector is its
//    own page (inspector.html), reached by a link, never bundled into the app.
// 2. Read-only: the inspector only reads the database — no insert / upsert /
//    update / delete / rpc calls (login and logout are auth, not data).
// Files are read as raw text via import.meta.glob, like exerciseShell.test.ts.

const appFiles = import.meta.glob(['../**/*.{ts,tsx}', '!./**', '!../**/*.test.{ts,tsx}'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

const inspectorFiles = import.meta.glob(['./*.{ts,tsx}', '!./*.test.{ts,tsx}'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

describe('inspector isolation', () => {
  it('discovers both sides', () => {
    expect(Object.keys(appFiles).length).toBeGreaterThan(20)
    expect(Object.keys(inspectorFiles).length).toBeGreaterThan(3)
  })

  it.each(Object.entries(appFiles))('%s does not import the inspector', (_path, src) => {
    expect(src).not.toMatch(/from\s+['"][^'"]*\/inspector\//)
    expect(src).not.toMatch(/import\(\s*['"][^'"]*\/inspector\//)
  })

  it.each(Object.entries(inspectorFiles))('%s never writes to the database', (_path, src) => {
    expect(src).not.toMatch(/\.(insert|upsert|update|delete|rpc)\s*\(/)
  })
})
