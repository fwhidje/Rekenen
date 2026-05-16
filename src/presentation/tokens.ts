// ─── SceneTokens ─────────────────────────────────────────────────────────────
// Every visual theme provides one SceneTokens object. Exercise components and
// shared UI widgets (NumPad, ChoiceButtons, TFButtons) read colours from here
// instead of hardcoding values. Never add palette constants directly to an
// exercise file — import NATURE_TOKENS as a fallback or read from scene.tokens.

export interface SceneTokens {
  ink:        string    // charcoal outline + primary text
  paper:      string    // button fill, input areas
  paperMid:   string    // slightly deeper paper (backspace key, pressed state)
  cream:      string    // banner / panel fill (semi-transparent)
  accent:     string    // primary highlight background (answer box, target chip)
  accentText: string    // primary highlight as text colour on cream/paper
  confirm:    string    // positive action: ✓ button, done state
  refuse:     string    // negative: ✗ button, error state
  pop:        string    // secondary accent: operandB colour in equations
  dot:        string    // dot / unit marker
  accents:    string[]  // 4 distinct colours for multi-choice options
}

export const NATURE_TOKENS: SceneTokens = {
  ink:        '#3d2f1e',
  paper:      '#fbf6e6',
  paperMid:   '#ecdfbe',
  cream:      'rgba(244,236,216,0.94)',
  accent:     '#f0b932',
  accentText: '#c79023',
  confirm:    '#7a9a3a',
  refuse:     '#c14b3a',
  pop:        '#8a5a99',
  dot:        '#7fb3c9',
  accents:    ['#c14b3a', '#4a6b2a', '#8a5a99', '#8a6840'],
}

export const SPACE_TOKENS: SceneTokens = {
  ink:        '#3d2f1e',
  paper:      '#fbf6e6',
  paperMid:   '#ecdfbe',
  cream:      'rgba(244,236,216,0.94)',
  accent:     '#e8945e',
  accentText: '#a66238',
  confirm:    '#5a8fc4',
  refuse:     '#d97a85',
  pop:        '#8a5a99',
  dot:        '#f5d76a',
  accents:    ['#e8945e', '#7ac99a', '#5a8fc4', '#f5d76a'],
}

export const FACTORY_TOKENS: SceneTokens = {
  ink:        '#3d2f1e',
  paper:      '#fbf6e6',
  paperMid:   '#ecdfbe',
  cream:      'rgba(244,236,216,0.94)',
  accent:     '#d4a04a',
  accentText: '#8a6630',
  confirm:    '#b8633c',
  refuse:     '#2a2d33',
  pop:        '#5e8a8a',
  dot:        '#e8a92a',
  accents:    ['#d4a04a', '#b8633c', '#5e8a8a', '#f5d76a'],
}
