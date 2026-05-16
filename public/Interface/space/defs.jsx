// Shared SVG filter / pattern defs for the Space theme.

function SharedDefs() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Watercolour edge bleed — medium (locked variant) */}
        <filter id="bleed-medium" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.8" />
        </filter>

        {/* Slight bleed used by background atmosphere */}
        <filter id="bleed-soft" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
        </filter>

        {/* Bigger blur used for nebula glow */}
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Counter watercolour wash gradients */}
        <radialGradient id="wash-rocket" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fbf4dc" />
          <stop offset="60%" stopColor="#ead7b3" />
          <stop offset="100%" stopColor="#b59a72" />
        </radialGradient>
        <radialGradient id="wash-ember" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#e88f6e" />
          <stop offset="60%" stopColor="#d4716a" />
          <stop offset="100%" stopColor="#8e2e22" />
        </radialGradient>
        <radialGradient id="wash-planet" cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#f4b582" />
          <stop offset="55%" stopColor="#e8945e" />
          <stop offset="100%" stopColor="#a66238" />
        </radialGradient>
        <radialGradient id="wash-ring" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#e2b677" />
          <stop offset="60%" stopColor="#c79a4a" />
          <stop offset="100%" stopColor="#8a6630" />
        </radialGradient>
        <radialGradient id="wash-alien" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#a8dabc" />
          <stop offset="60%" stopColor="#7ac99a" />
          <stop offset="100%" stopColor="#46896a" />
        </radialGradient>
        <radialGradient id="wash-star" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fdedb2" />
          <stop offset="55%" stopColor="#f5d76a" />
          <stop offset="100%" stopColor="#c79a23" />
        </radialGradient>
        <radialGradient id="wash-earth" cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#8db7d8" />
          <stop offset="55%" stopColor="#5a8fc4" />
          <stop offset="100%" stopColor="#2e5a8a" />
        </radialGradient>
        <radialGradient id="wash-land" cx="40%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#b6d6a2" />
          <stop offset="55%" stopColor="#8ec07c" />
          <stop offset="100%" stopColor="#4f7a52" />
        </radialGradient>
        <radialGradient id="wash-helmet" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f0eadb" />
          <stop offset="100%" stopColor="#b6ad94" />
        </radialGradient>
        <radialGradient id="wash-visor" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#5a90b0" />
          <stop offset="55%" stopColor="#2e4a72" />
          <stop offset="100%" stopColor="#15234a" />
        </radialGradient>

        {/* Background washes */}
        <linearGradient id="space-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1d4a" />
          <stop offset="55%" stopColor="#2a2860" />
          <stop offset="100%" stopColor="#3e2a55" />
        </linearGradient>
        <linearGradient id="moonscape-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1027" />
          <stop offset="60%" stopColor="#1a1d4a" />
          <stop offset="100%" stopColor="#2c2754" />
        </linearGradient>
        <linearGradient id="moon-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a6f5e" />
          <stop offset="100%" stopColor="#3a3128" />
        </linearGradient>
        <radialGradient id="nebula-pink" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#d97a85" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d97a85" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula-purple" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#8a5a99" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8a5a99" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-vignette-dark" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
    </svg>
  );
}

window.SharedDefs = SharedDefs;
