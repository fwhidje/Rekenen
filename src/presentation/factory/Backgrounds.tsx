import type { CSSProperties, ReactNode } from 'react'

interface BgProps {
  children?: ReactNode
  style?: CSSProperties
}

export function FactoryInteriorBackground({ children, style }: BgProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="400" height="220" fill="url(#factory-interior-sky)" />
        <rect x={0} y={220} width={400} height={80} fill="url(#factory-floor-grad)" />
        <rect x={0} y={218} width={400} height={3} fill="#2c272a" opacity="0.6" />
        <g>
          <rect x={0} y={22} width={400} height={10} fill="#5e8a8a" />
          <rect x={0} y={22} width={400} height={3} fill="#8fb5b5" opacity="0.7" />
          <rect x={0} y={29} width={400} height={2} fill="#2e5454" opacity="0.6" />
          <rect x={60} y={20} width={14} height={14} fill="#4a7373" />
          <rect x={200} y={20} width={14} height={14} fill="#4a7373" />
          <rect x={320} y={20} width={14} height={14} fill="#4a7373" />
        </g>
        <g>
          <rect x={0} y={58} width={400} height={6} fill="#b8633c" />
          <rect x={0} y={58} width={400} height={2} fill="#e08a62" opacity="0.65" />
        </g>
        {[80, 200, 320].map((cx, i) => (
          <g key={i}>
            <line x1={cx} y1={32} x2={cx} y2={64} stroke="#1f1d22" strokeWidth="1.6" />
            <path d={`M ${cx - 14} 64 L ${cx + 14} 64 L ${cx + 10} 78 L ${cx - 10} 78 Z`} fill="#2a2d33" />
            <ellipse cx={cx} cy={78} rx={11} ry={3} fill="#1a1c20" />
            <circle cx={cx} cy={84} r={22} fill="url(#ceiling-light)" opacity="0.9" />
          </g>
        ))}
        <g opacity="0.85">
          <rect x={20} y={150} width={80} height={70} fill="#39363c" />
          <rect x={28} y={158} width={20} height={20} fill="#1f1d22" />
          <rect x={56} y={158} width={36} height={10} fill="#1f1d22" />
          <circle cx={86} cy={200} r={10} fill="#1f1d22" />
          <circle cx={86} cy={200} r={5} fill="#7a7268" />
          <rect x={120} y={120} width={50} height={100} fill="#444046" />
          <rect x={130} y={100} width={14} height={22} fill="#39363c" />
          <circle cx={146} cy={156} r={5} fill="#c14b3a" />
          <circle cx={146} cy={156} r={2.2} fill="#fbeed0" />
          <rect x={240} y={170} width={70} height={50} fill="#39363c" />
          <rect x={248} y={178} width={10} height={10} fill="#1f1d22" />
          <rect x={262} y={178} width={10} height={10} fill="#1f1d22" />
          <rect x={276} y={178} width={10} height={10} fill="#1f1d22" />
          <rect x={330} y={140} width={50} height={80} fill="#444046" />
          <rect x={338} y={148} width={34} height={6} fill="#1f1d22" />
          <rect x={338} y={160} width={34} height={6} fill="#1f1d22" />
        </g>
        <g>
          <rect x={0} y={234} width={400} height={20} fill="#2a2d33" />
          <rect x={0} y={234} width={400} height={4} fill="#52575f" opacity="0.7" />
          <rect x={0} y={250} width={400} height={4} fill="#1a1c20" />
          {[20, 70, 120, 170, 220, 270, 320, 370].map((x, i) => (
            <rect key={i} x={x} y={238} width={22} height={12} fill="#3a3d44" />
          ))}
          <circle cx={14} cy={244} r={10} fill="#7a7268" />
          <circle cx={14} cy={244} r={4} fill="#2a2d33" />
          <circle cx={386} cy={244} r={10} fill="#7a7268" />
          <circle cx={386} cy={244} r={4} fill="#2a2d33" />
        </g>
        <g opacity="0.45">
          <path d="M 0 270 L 400 270" stroke="#2c241c" strokeWidth="0.8" />
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d={`M ${i * 36 - 10} 300 L ${i * 36 + 14} 264`} stroke="#2c241c" strokeWidth="0.7" />
          ))}
        </g>
        <rect width="400" height="300" fill="url(#bg-vignette-dark)" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  )
}

export function FactoryExteriorBackground({ children, style }: BgProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="400" height="260" fill="url(#factory-exterior-sky)" />
        <circle cx={300} cy={100} r={28} fill="#fae0a0" opacity="0.9" />
        <circle cx={300} cy={100} r={42} fill="#f5d76a" opacity="0.3" filter="url(#glow)" />
        <g opacity="0.55">
          <rect x={0} y={170} width={60} height={50} fill="#6e5448" />
          <rect x={46} y={156} width={40} height={64} fill="#5a4438" />
          <rect x={80} y={178} width={30} height={42} fill="#705646" />
        </g>
        <g>
          <rect x={100} y={148} width={200} height={80} fill="url(#factory-brick)" />
          <rect x={100} y={148} width={200} height={6} fill="#3e1810" opacity="0.55" />
          {[160, 172, 184, 196, 208, 220].map((y, i) => (
            <line key={i} x1={100} y1={y} x2={300} y2={y} stroke="#3e1810" strokeWidth="0.6" opacity="0.45" />
          ))}
          {[120, 160, 200, 240, 280].flatMap((x) =>
            [166, 198].map((y, j) => (
              <g key={`${x}-${j}`}>
                <rect x={x} y={y} width={14} height={14} fill="#1c1814" />
                <rect x={x} y={y} width={14} height={14} fill="#f5d76a" opacity="0.85" />
                <line x1={x + 7} y1={y} x2={x + 7} y2={y + 14} stroke="#1c1814" strokeWidth="0.8" />
                <line x1={x} y1={y + 7} x2={x + 14} y2={y + 7} stroke="#1c1814" strokeWidth="0.8" />
              </g>
            ))
          )}
          <rect x={180} y={194} width={40} height={34} fill="#3e1810" />
          <line x1={200} y1={194} x2={200} y2={228} stroke="#1c0a06" strokeWidth="1" />
        </g>
        <g>
          <rect x={130} y={78} width={22} height={70} fill="#7e3520" />
          <rect x={130} y={78} width={22} height={6} fill="#5e2410" />
          <rect x={128} y={76} width={26} height={6} fill="#a85a3a" />
          <rect x={222} y={60} width={26} height={88} fill="#7e3520" />
          <rect x={222} y={60} width={26} height={6} fill="#5e2410" />
          <rect x={220} y={58} width={30} height={6} fill="#a85a3a" />
        </g>
        <g>
          <ellipse cx={141} cy={58} rx={22} ry={14} fill="url(#smoke-puff)" />
          <ellipse cx={160} cy={40} rx={28} ry={18} fill="url(#smoke-puff)" />
          <ellipse cx={180} cy={22} rx={34} ry={20} fill="url(#smoke-puff)" />
          <ellipse cx={235} cy={46} rx={22} ry={14} fill="url(#smoke-puff)" />
          <ellipse cx={252} cy={28} rx={28} ry={16} fill="url(#smoke-puff)" />
        </g>
        <rect x={0} y={228} width={400} height={72} fill="url(#factory-ground)" />
        <g opacity="0.55">
          {[20, 80, 140, 200, 260, 320].map((x, i) => (
            <rect key={i} x={x} y={262} width={40} height={4} fill="#e8c878" />
          ))}
        </g>
        <g>
          <rect x={40} y={246} width={36} height={32} fill="#a06d3a" />
          <rect x={40} y={246} width={36} height={6} fill="#7d4e23" />
          <line x1={58} y1={252} x2={58} y2={278} stroke="#5f3f1f" strokeWidth="1" />
          <rect x={60} y={234} width={30} height={14} fill="#a06d3a" />
          <rect x={320} y={252} width={44} height={26} fill="#a06d3a" />
          <rect x={320} y={252} width={44} height={5} fill="#7d4e23" />
        </g>
        <g>
          <rect x={0} y={252} width={400} height={6} fill="#5e8a8a" opacity="0.55" />
        </g>
        <rect width="400" height="300" fill="url(#bg-vignette-dark)" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  )
}
