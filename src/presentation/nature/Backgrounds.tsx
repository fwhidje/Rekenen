import type { CSSProperties, ReactNode } from 'react'

interface BgProps {
  children?: ReactNode
  style?: CSSProperties
}

export function MeadowBackground({ children, style }: BgProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="url(#sky-grad)" />
        <g filter="url(#bleed-medium)" opacity="0.9">
          <circle cx={320} cy={60} r={34} fill="#f8d97a" opacity="0.9" />
          <circle cx={320} cy={60} r={22} fill="#fce29a" />
        </g>
        <g filter="url(#bleed-medium)" opacity="0.85">
          <ellipse cx={80} cy={48} rx={38} ry={10} fill="#fbf6e6" />
          <ellipse cx={100} cy={42} rx={22} ry={8} fill="#fbf6e6" />
          <ellipse cx={200} cy={38} rx={28} ry={8} fill="#fbf6e6" />
        </g>
        <g filter="url(#bleed-medium)">
          <path d="M 0 180 Q 60 150 130 165 Q 220 184 300 158 Q 360 144 400 162 L 400 220 L 0 220 Z"
            fill="#a4c258" opacity="0.85" />
        </g>
        <g filter="url(#bleed-medium)" opacity="0.8">
          <ellipse cx={60} cy={170} rx={22} ry={14} fill="#7a9a3a" />
          <ellipse cx={86} cy={166} rx={14} ry={11} fill="#7a9a3a" />
          <ellipse cx={240} cy={160} rx={18} ry={11} fill="#7a9a3a" />
        </g>
        <g filter="url(#bleed-medium)">
          <path d="M 0 210 Q 80 188 180 200 Q 280 214 400 196 L 400 260 L 0 260 Z" fill="#88a64a" />
        </g>
        <g filter="url(#bleed-medium)">
          <path d="M 0 240 Q 100 230 200 240 Q 300 248 400 236 L 400 300 L 0 300 Z" fill="#5e8a26" />
        </g>
        <g stroke="#4a6b2a" strokeWidth="1.4" strokeLinecap="round" opacity="0.75">
          <path d="M 20 296 Q 22 282 18 270" fill="none" />
          <path d="M 26 296 Q 28 286 30 274" fill="none" />
          <path d="M 70 296 Q 68 284 72 272" fill="none" />
          <path d="M 150 296 Q 148 282 152 268" fill="none" />
          <path d="M 220 296 Q 222 284 218 270" fill="none" />
          <path d="M 360 296 Q 358 282 362 270" fill="none" />
        </g>
        <rect width="400" height="300" fill="url(#bg-vignette)" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  )
}

export function PondBackground({ children, style }: BgProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="400" height="160" fill="url(#sky-grad)" />
        <g filter="url(#bleed-medium)" opacity="0.55">
          <path d="M 0 158 Q 50 130 90 150 Q 140 134 200 152 Q 260 138 320 154 Q 360 144 400 158 L 400 168 L 0 168 Z"
            fill="#6a8a3a" />
        </g>
        <g stroke="#4a6b2a" strokeWidth="1.4" strokeLinecap="round" opacity="0.85">
          <path d="M 22 158 Q 22 130 26 110" fill="none" />
          <path d="M 30 158 Q 32 124 36 102" fill="none" />
          <path d="M 350 156 Q 350 124 354 102" fill="none" />
          <path d="M 358 156 Q 360 130 364 112" fill="none" />
        </g>
        <g fill="#6a4f2e">
          <ellipse cx={26} cy={106} rx={2} ry={6} />
          <ellipse cx={36} cy={100} rx={2} ry={6} />
          <ellipse cx={354} cy={100} rx={2} ry={6} />
          <ellipse cx={364} cy={110} rx={2} ry={6} />
        </g>
        <rect y={160} width="400" height="140" fill="url(#pond-grad)" />
        <g opacity="0.55" filter="url(#bleed-medium)">
          <ellipse cx={220} cy={190} rx={40} ry={2.5} fill="#fce29a" />
          <ellipse cx={180} cy={210} rx={30} ry={2.5} fill="#fce29a" />
        </g>
        <g stroke="#a5d0d6" strokeWidth="1.2" fill="none" opacity="0.7" strokeLinecap="round">
          <path d="M 60 200 Q 80 198 100 200" />
          <path d="M 280 218 Q 300 216 320 218" />
          <path d="M 110 250 Q 130 248 150 250" />
        </g>
        <g filter="url(#bleed-medium)">
          <path d="M 54 218 Q 80 212 106 218 Q 100 230 80 230 Q 60 230 54 218 Z" fill="#7a9a3a" />
          <path d="M 306 236 Q 330 230 354 236 Q 348 248 330 248 Q 312 248 306 236 Z" fill="#7a9a3a" />
        </g>
        <rect width="400" height="300" fill="url(#bg-vignette)" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  )
}
