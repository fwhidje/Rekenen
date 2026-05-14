import React from 'react'

export function bleedFilter(variant: 'heavy' | 'medium' | 'light'): string {
  if (variant === 'heavy') return 'url(#bleed-heavy)'
  if (variant === 'light') return 'none'
  return 'url(#bleed-medium)'
}

export function SharedDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="bleed-heavy" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="11" />
        </filter>
        <filter id="bleed-medium" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.8" />
        </filter>
        <filter id="bleed-light" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="1" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.0" />
        </filter>
        <filter id="paper-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="2" result="grain" />
          <feColorMatrix in="grain"
            values="0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.85 0"
            result="tinted" />
          <feComposite in="tinted" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="paint-pool" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="8" />
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <filter id="wash" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="6" result="noise" />
          <feColorMatrix in="noise"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.28 0"
            result="dark" />
          <feComposite in="dark" in2="SourceGraphic" operator="in" result="darkInside" />
          <feBlend in="SourceGraphic" in2="darkInside" mode="multiply" />
        </filter>

        <radialGradient id="bg-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </radialGradient>

        <radialGradient id="wash-pollen" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fad06b" />
          <stop offset="60%" stopColor="#f0b932" />
          <stop offset="100%" stopColor="#d9a020" />
        </radialGradient>
        <radialGradient id="wash-berry" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#d76b59" />
          <stop offset="60%" stopColor="#c14b3a" />
          <stop offset="100%" stopColor="#8e2e22" />
        </radialGradient>
        <radialGradient id="wash-leaf" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#9bbf52" />
          <stop offset="60%" stopColor="#7a9a3a" />
          <stop offset="100%" stopColor="#4a6b2a" />
        </radialGradient>
        <radialGradient id="wash-bloom" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#e89aa3" />
          <stop offset="60%" stopColor="#d97a85" />
          <stop offset="100%" stopColor="#a64850" />
        </radialGradient>
        <radialGradient id="wash-plum" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#a37ab0" />
          <stop offset="60%" stopColor="#8a5a99" />
          <stop offset="100%" stopColor="#5e3e6a" />
        </radialGradient>
        <radialGradient id="wash-earth" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#b48c5e" />
          <stop offset="60%" stopColor="#8a6840" />
          <stop offset="100%" stopColor="#5d4525" />
        </radialGradient>

        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbe9c8" />
          <stop offset="55%" stopColor="#cfe4e6" />
          <stop offset="100%" stopColor="#b8dde8" />
        </linearGradient>
        <linearGradient id="pond-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5d0d6" />
          <stop offset="50%" stopColor="#7fb3c9" />
          <stop offset="100%" stopColor="#4d8aa3" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Suppress unused import warning — React is needed for JSX
void React
