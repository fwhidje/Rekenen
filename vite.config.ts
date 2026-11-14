import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The build commit stamps every answer event (engine/answerRecord.ts). The dev
// server and tests run uncommitted code, so they say 'dev' rather than a sha.
function buildVersion(command: string): string {
  if (command !== 'build') return 'dev'
  const fromCi = process.env.GITHUB_SHA
  if (fromCi) return fromCi.slice(0, 12)
  try {
    return execSync('git rev-parse --short=12 HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: '/Rekenen/',
  define: { __APP_VERSION__: JSON.stringify(buildVersion(command)) },
  // Two pages: the app, and the parent's data inspector (src/inspector/) — a
  // separate entry so the app bundle never contains inspector code.
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        inspector: resolve(__dirname, 'inspector.html'),
      },
    },
  },
}))
