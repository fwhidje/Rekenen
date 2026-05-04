export interface Scene {
  e: string   // emoji
  bg: string  // CSS gradient
  dk: boolean // dark background (affects drop-shadow)
}

export const SCENES: Scene[] = [
  { e: '⭐', bg: 'linear-gradient(160deg,#0f0c29,#302b63)', dk: true  },
  { e: '🐠', bg: 'linear-gradient(160deg,#005c97,#1cb5e0)', dk: true  },
  { e: '🐄', bg: 'linear-gradient(160deg,#B3E5FC 30%,#4CAF50)', dk: false },
  { e: '🦋', bg: 'linear-gradient(160deg,#E0F7FA,#B2EBF2)', dk: false },
  { e: '🐝', bg: 'linear-gradient(160deg,#FFF59D,#AED581)', dk: false },
  { e: '🐑', bg: 'linear-gradient(160deg,#B3E5FC 40%,#8BC34A)', dk: false },
  { e: '🐸', bg: 'linear-gradient(160deg,#1B5E20,#4CAF50)', dk: true  },
  { e: '🦆', bg: 'linear-gradient(160deg,#29B6F6,#0288D1)', dk: false },
  { e: '🐞', bg: 'linear-gradient(160deg,#388E3C,#66BB6A)', dk: false },
  { e: '🍎', bg: 'linear-gradient(160deg,#87CEEB 30%,#8BC34A)', dk: false },
  { e: '🍄', bg: 'linear-gradient(160deg,#33691E,#558B2F)', dk: true  },
  { e: '🐰', bg: 'linear-gradient(160deg,#B3E5FC 40%,#81C784)', dk: false },
  { e: '🚀', bg: 'linear-gradient(160deg,#0d0d1a,#1a1a3e)', dk: true  },
  { e: '🦕', bg: 'linear-gradient(160deg,#1B5E20,#33691E)', dk: true  },
  { e: '🍦', bg: 'linear-gradient(160deg,#FCE4EC,#E1F5FE)', dk: false },
  { e: '🍪', bg: 'linear-gradient(160deg,#FFF3E0,#FFE0B2)', dk: false },
  { e: '🐛', bg: 'linear-gradient(160deg,#2E7D32,#66BB6A)', dk: false },
  { e: '🐢', bg: 'linear-gradient(160deg,#006064,#00897B)', dk: true  },
  { e: '🐱', bg: 'linear-gradient(160deg,#F8BBD9,#CE93D8)', dk: false },
  { e: '🐧', bg: 'linear-gradient(160deg,#B3E5FC,#E1F5FE)', dk: false },
  { e: '🌾', bg: 'linear-gradient(160deg,#F9A825,#FDD835 40%,#87CEEB)', dk: false },
  { e: '🦀', bg: 'linear-gradient(160deg,#E65100,#FF8F00 40%,#1565C0)', dk: false },
  { e: '🦉', bg: 'linear-gradient(160deg,#1a237e,#283593)', dk: true  },
  { e: '🦔', bg: 'linear-gradient(160deg,#4E342E,#795548)', dk: true  },
]

const DOT_COLORS = ['#FF6B6B', '#4CC9F0', '#9B5DE5', '#FFD166', '#06D6A0', '#F77F00', '#FF85A1']

export function pickScene(index: number): Scene {
  return SCENES[index % SCENES.length]
}

export function pickColors(): [string, string] {
  const a = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)]
  let b = a
  while (b === a) b = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)]
  return [a, b]
}
