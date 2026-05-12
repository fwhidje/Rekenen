// Quick SVG hand test — 3 fingers raised
// Open this in DebugMode via finger-pattern-recognise to preview

export function HandSVG({ n }: { n: number }) {
  // For now just renders n=3 as a test
  return (
    <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="10" y="60" width="60" height="50" rx="10" fill="#FFD166" stroke="#F4A400" strokeWidth="2"/>

      {/* Thumb — always on right side, shorter */}
      <rect x="56" y="44" width="14" height="30" rx="7"
        fill={n >= 1 ? "#FFD166" : "#F0E0C0"}
        stroke={n >= 1 ? "#F4A400" : "#D4B890"}
        strokeWidth="2"/>

      {/* Index finger */}
      <rect x="40" y={n >= 2 ? 16 : 36} width="14" height={n >= 2 ? 46 : 26} rx="7"
        fill={n >= 2 ? "#FFD166" : "#F0E0C0"}
        stroke={n >= 2 ? "#F4A400" : "#D4B890"}
        strokeWidth="2"/>

      {/* Middle finger — tallest */}
      <rect x="24" y={n >= 3 ? 10 : 36} width="14" height={n >= 3 ? 52 : 26} rx="7"
        fill={n >= 3 ? "#FFD166" : "#F0E0C0"}
        stroke={n >= 3 ? "#F4A400" : "#D4B890"}
        strokeWidth="2"/>

      {/* Ring finger */}
      <rect x="8" y={n >= 4 ? 18 : 36} width="14" height={n >= 4 ? 44 : 26} rx="7"
        fill={n >= 4 ? "#FFD166" : "#F0E0C0"}
        stroke={n >= 4 ? "#F4A400" : "#D4B890"}
        strokeWidth="2"/>

      {/* Pinky — shortest */}
      <rect x="-4" y={n >= 5 ? 28 : 40} width="12" height={n >= 5 ? 34 : 22} rx="6"
        fill={n >= 5 ? "#FFD166" : "#F0E0C0"}
        stroke={n >= 5 ? "#F4A400" : "#D4B890"}
        strokeWidth="2"/>
    </svg>
  )
}
