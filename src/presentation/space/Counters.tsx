import type { CounterProps } from '../nature/Counters'

const INK = '#3d2f1e'

const SPF = {
  paper:    '#f4ecd8',
  cream:    '#f0eadb',
  ember:    '#d4716a',
  emberD:   '#8e2e22',
  planet:   '#e8945e',
  planetD:  '#a66238',
  ring:     '#c79a4a',
  ringD:    '#8a6630',
  alien:    '#7ac99a',
  alienD:   '#46896a',
  star:     '#f5d76a',
  starD:    '#c79a23',
  ocean:    '#5a8fc4',
  oceanD:   '#2e5a8a',
  land:     '#8ec07c',
  landD:    '#4f7a52',
  helmet:   '#f0eadb',
  visor:    '#2e4a72',
  visorL:   '#6a92b3',
}

const FLAT: Record<string, string> = {
  rocket: SPF.cream, ember: SPF.ember, planet: SPF.planet,
  ring:   SPF.ring,  alien: SPF.alien, star:   SPF.star,
  ocean:  SPF.ocean, land:  SPF.land,  helmet: SPF.helmet, visor: SPF.visor,
}

type Variant = 'heavy' | 'medium' | 'light'

function fill(name: keyof typeof FLAT, variant: Variant): string {
  if (variant === 'light') return FLAT[name]
  return `url(#wash-${name})`
}

function Ground({ cx = 55, cy = 100, rx = 24, opacity = 0.18 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={3} fill={INK} opacity={opacity} />
}

export function Rocket({ variant = 'medium', size = 110 }: CounterProps) {
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <Ground cy={102} rx={22} />
      <g filter="url(#bleed-medium)">
        <path d="M 38 72 L 20 92 Q 19 96 26 96 L 38 96 Z"
          fill={fill('ember', variant)} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M 72 72 L 90 92 Q 91 96 84 96 L 72 96 Z"
          fill={fill('ember', variant)} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M 42 94 Q 46 108 50 98 Q 55 110 60 98 Q 64 108 68 94 Z"
          fill="#f5a04a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M 48 96 Q 52 104 55 98 Q 58 104 62 96 L 55 100 Z" fill="#fce29a" />
        <path d="M 55 8 Q 38 30 38 46 L 38 84 Q 38 92 44 92 L 66 92 Q 72 92 72 84 L 72 46 Q 72 30 55 8 Z"
          fill={fill('rocket', variant)} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M 40 42 Q 55 48 70 42" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
        <circle cx={55} cy={56} r={9.5} fill={fill('visor', variant)} stroke={INK} strokeWidth="2.2" />
        <circle cx={55} cy={56} r={6} fill={SPF.visorL} opacity="0.55" />
        <ellipse cx={51} cy={52} rx={2.4} ry={1.4} fill="#fff" opacity="0.8" />
        <path d="M 40 78 Q 55 82 70 78" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.4" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function Saturn({ variant = 'medium', size = 110 }: CounterProps) {
  const planet = fill('planet', variant)
  const ring = fill('ring', variant)
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <Ground cx={55} cy={101} rx={26} />
      <g filter="url(#bleed-medium)">
        <g transform="rotate(-12 55 56)">
          <path d="M 8 56 A 47 13 0 0 1 102 56" fill="none" stroke={ring} strokeWidth="9" strokeLinecap="round" />
          <path d="M 8 56 A 47 13 0 0 1 102 56" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <circle cx={55} cy={56} r={24} fill={planet} stroke={INK} strokeWidth="2.4" />
        <path d="M 34 50 Q 55 56 76 50" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.45" strokeLinecap="round" />
        <path d="M 34 62 Q 55 67 76 62" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.4" strokeLinecap="round" />
        <ellipse cx={44} cy={54} rx={4} ry={2.5} fill={SPF.planetD} opacity="0.55" />
        <ellipse cx={46} cy={46} rx={5} ry={3.4} fill="#fce0c0" opacity="0.5" />
        <g transform="rotate(-12 55 56)">
          <path d="M 8 56 A 47 13 0 0 0 102 56" fill="none" stroke={ring} strokeWidth="9" strokeLinecap="round" />
          <path d="M 8 56 A 47 13 0 0 0 102 56" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

export function Alien({ variant = 'medium', size = 110 }: CounterProps) {
  const body = fill('alien', variant)
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <Ground cy={102} rx={26} />
      <g filter="url(#bleed-medium)">
        <path d="M 36 30 Q 30 18 28 12" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 74 30 Q 80 18 82 12" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={28} cy={12} r={4.2} fill={body} stroke={INK} strokeWidth="2" />
        <circle cx={82} cy={12} r={4.2} fill={body} stroke={INK} strokeWidth="2" />
        <path d="M 18 50 Q 16 30 36 24 Q 55 22 74 24 Q 94 30 92 50 Q 94 82 70 88 Q 55 92 40 88 Q 16 82 18 50 Z"
          fill={body} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx={28} cy={66} r={2.6} fill={SPF.alienD} opacity="0.55" />
        <circle cx={82} cy={66} r={2.6} fill={SPF.alienD} opacity="0.55" />
        <circle cx={55} cy={80} r={2} fill={SPF.alienD} opacity="0.5" />
        <ellipse cx={42} cy={50} rx={9} ry={11} fill="#fff" stroke={INK} strokeWidth="2" />
        <ellipse cx={68} cy={50} rx={9} ry={11} fill="#fff" stroke={INK} strokeWidth="2" />
        <ellipse cx={44} cy={53} rx={3.8} ry={5} fill={INK} />
        <ellipse cx={70} cy={53} rx={3.8} ry={5} fill={INK} />
        <circle cx={46} cy={50} r={1.4} fill="#fff" />
        <circle cx={72} cy={50} r={1.4} fill="#fff" />
        <path d="M 48 72 Q 55 76 62 72" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

const STAR_PATH =
  "M 55 17 L 64.4 42.1 L 91.2 43.3 L 70.2 59.9 L 77.3 85.7 " +
  "L 55 71 L 32.7 85.7 L 39.8 59.9 L 18.8 43.3 L 45.6 42.1 Z"

export function Star({ variant = 'medium', size = 110 }: CounterProps) {
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <Ground cy={101} rx={26} />
      <g filter="url(#bleed-medium)">
        <g transform="rotate(-6 55 55)">
          <path d={STAR_PATH} fill={fill('star', variant)} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M 55 30 L 60 46 L 76 47 L 64 56 L 68 72 L 55 64 L 42 72 L 46 56 L 34 47 L 50 46 Z"
            fill="#fdf2c1" opacity="0.55" />
          <circle cx={49} cy={48} r={2} fill="#fff" opacity="0.7" />
        </g>
      </g>
    </svg>
  )
}

export function Earth({ variant = 'medium', size = 110 }: CounterProps) {
  const ocean = fill('ocean', variant)
  const land = fill('land', variant)
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <Ground cy={102} rx={26} />
      <g filter="url(#bleed-medium)">
        <circle cx={55} cy={55} r={38} fill={ocean} stroke={INK} strokeWidth="2.4" />
        <clipPath id="space-earth-clip">
          <circle cx={55} cy={55} r={37} />
        </clipPath>
        <g clipPath="url(#space-earth-clip)">
          <path d="M 26 42 Q 22 34 32 32 Q 44 32 48 42 Q 52 48 46 54 Q 50 62 42 64 Q 30 62 28 54 Q 22 50 26 42 Z"
            fill={land} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 60 34 Q 58 28 68 28 Q 82 30 82 42 Q 84 50 74 52 Q 64 50 60 42 Q 56 38 60 34 Z"
            fill={land} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 56 70 Q 52 66 60 66 Q 70 66 72 72 Q 70 78 62 76 Q 56 76 56 70 Z"
            fill={land} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx={36} cy={42} rx={3.5} ry={2} fill={SPF.landD} opacity="0.55" />
          <ellipse cx={72} cy={40} rx={3} ry={1.8} fill={SPF.landD} opacity="0.5" />
          <ellipse cx={64} cy={72} rx={2.2} ry={1.4} fill={SPF.landD} opacity="0.5" />
        </g>
        <ellipse cx={44} cy={40} rx={7} ry={4} fill="#dfecf6" opacity="0.5" />
      </g>
    </svg>
  )
}

export function Astronaut({ variant = 'medium', size = 110 }: CounterProps) {
  const helmet = fill('helmet', variant)
  const visor = fill('visor', variant)
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <Ground cy={102} rx={28} />
      <g filter="url(#bleed-medium)">
        <circle cx={55} cy={55} r={38} fill={helmet} stroke={INK} strokeWidth="2.4" />
        <path d="M 28 44 Q 30 30 55 30 Q 80 30 82 44 Q 84 58 74 64 Q 55 70 36 64 Q 26 58 28 44 Z"
          fill={visor} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M 34 38 Q 42 33 56 33" fill="none" stroke="#a8c0d6" strokeWidth="3" opacity="0.75" strokeLinecap="round" />
        <path d="M 60 36 Q 66 35 72 38" fill="none" stroke="#a8c0d6" strokeWidth="1.6" opacity="0.6" strokeLinecap="round" />
        <path d="M 24 70 Q 55 84 86 70" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
        <path d="M 80 24 L 72 32" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx={80} cy={22} r={3} fill={fill('ember', variant)} stroke={INK} strokeWidth="1.8" />
        <circle cx={46} cy={52} r={1.8} fill="#cce0ee" opacity="0.8" />
        <circle cx={62} cy={52} r={1.8} fill="#cce0ee" opacity="0.8" />
      </g>
    </svg>
  )
}
