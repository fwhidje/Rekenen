// ─── Per-skill runtime state ───────────────────────────────────────────────────

export interface SkillState {
  score: number        // 0–50
  unlocked: boolean
  unlockedAt?: number  // timestamp, for future history
}

// ─── Profile ──────────────────────────────────────────────────────────────────
// All state lives under a profile so multi-child support is first-class.

export interface Profile {
  id: string
  name: string
  createdAt: number
  skills: Record<string, SkillState>  // keyed by SkillDefinition.id
}

// ─── App state (all profiles) ─────────────────────────────────────────────────

export interface AppState {
  profiles: Profile[]
  activeProfileId: string | null
}
