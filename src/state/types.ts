// ─── Per-skill runtime state ──────────────────────────────────────────────────

export interface SkillState {
  score: number          // 0–50
  unlocked: boolean
  archived: boolean      // subsumed by a parent and removed from rotation
  unlockedAt?: number    // timestamp
  archivedAt?: number    // timestamp
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
