// ─── Device settings ──────────────────────────────────────────────────────────
// Per-device preferences, not per profile and never synced: they describe how
// THIS device is used (e.g. a parent sitting next to the child), not the child.
// Storage failures fall back to the defaults — a setting must never break play.

const STORAGE_KEY = 'rekenen_v2_device'

export interface DeviceSettings {
  flagButton: boolean   // show the ⚑ review-flag button in KidMode
}

const DEFAULTS: DeviceSettings = { flagButton: false }

export function loadDeviceSettings(): DeviceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<DeviceSettings>
    return { ...DEFAULTS, flagButton: parsed.flagButton === true }
  } catch {
    return DEFAULTS
  }
}

export function saveDeviceSettings(settings: DeviceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // no storage — the setting lasts until reload
  }
}
