// ─── Per-skill runtime state ──────────────────────────────────────────────────

export interface SkillState {
  score: number          // 0–100, the scaffolding dial (not the mastery gate)
  unlocked: boolean
  archived: boolean      // subsumed by a parent and removed from rotation
  unlockedAt?: number    // timestamp
  archivedAt?: number    // timestamp
  updatedAt?: number     // when score/unlocked/archived last changed on a device —
                         // the last-write-wins key for account sync (sync/progressMerge.ts)
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
