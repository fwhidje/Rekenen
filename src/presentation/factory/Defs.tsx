import React from 'react'

export function SharedDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        <radialGradient id="wash-steel" cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#d5d8dc" />
          <stop offset="55%" stopColor="#9aa0a8" />
          <stop offset="100%" stopColor="#4f555e" />
        </radialGradient>
        <radialGradient id="wash-brass" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#f0d27a" />
          <stop offset="55%" stopColor="#d4a04a" />
          <stop offset="100%" stopColor="#8a6630" />
        </radialGradient>
        <radialGradient id="wash-bolt" cx="40%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#7c8089" />
          <stop offset="55%" stopColor="#52575f" />
          <stop offset="100%" stopColor="#2a2d33" />
        </radialGradient>
        <radialGradient id="wash-wood" cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#d4a26a" />
          <stop offset="55%" stopColor="#a06d3a" />
          <stop offset="100%" stopColor="#5f3f1f" />
        </radialGradient>
        <radialGradient id="wash-bulb" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff4c6" />
          <stop offset="55%" stopColor="#f5d76a" />
          <stop offset="100%" stopColor="#c79023" />
        </radialGradient>
        <radialGradient id="wash-rust" cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#e08a62" />
          <stop offset="55%" stopColor="#b8633c" />
          <stop offset="100%" stopColor="#6e2e16" />
        </radialGradient>
        <radialGradient id="wash-helm" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#f9d56a" />
          <stop offset="55%" stopColor="#e8a92a" />
          <stop offset="100%" stopColor="#9a6a14" />
        </radialGradient>
        <radialGradient id="wash-pipe" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#9ab8b8" />
          <stop offset="55%" stopColor="#5e8a8a" />
          <stop offset="100%" stopColor="#2e5454" />
        </radialGradient>

        <linearGradient id="factory-interior-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a44" />
          <stop offset="55%" stopColor="#4a4854" />
          <stop offset="100%" stopColor="#6b6470" />
        </linearGradient>
        <linearGradient id="factory-floor-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a7268" />
          <stop offset="100%" stopColor="#46403a" />
        </linearGradient>
        <linearGradient id="factory-exterior-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7c08a" />
          <stop offset="55%" stopColor="#cf8e62" />
          <stop offset="100%" stopColor="#8c563a" />
        </linearGradient>
        <linearGradient id="factory-brick" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a85a3a" />
          <stop offset="100%" stopColor="#5e2a18" />
        </linearGradient>
        <linearGradient id="factory-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a5e4a" />
          <stop offset="100%" stopColor="#3a2e22" />
        </linearGradient>
        <radialGradient id="smoke-puff" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#eae3d2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#eae3d2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ceiling-light" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fce29a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fce29a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-vignette-dark" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
    </svg>
  )
}

void React
