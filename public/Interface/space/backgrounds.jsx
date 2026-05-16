// Full-bleed scene backgrounds for the Space theme.
// Outline rule: no outlines on background elements — paint-shapes only.

/* ────────────────────────── STARFIELD ────────────────────────────── */
function StarfieldBackground({ children, style }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      ...style,
    }}>
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* sky gradient */}
        <rect width="400" height="300" fill="url(#space-sky)" />

        {/* nebula washes */}
        <g filter="url(#glow)">
          <ellipse cx="80" cy="60" rx="100" ry="50" fill="url(#nebula-purple)" />
          <ellipse cx="320" cy="220" rx="120" ry="60" fill="url(#nebula-pink)" />
        </g>

        {/* distant planet — upper-right corner */}
        <g opacity="0.85">
          <circle cx="340" cy="60" r="22" fill="#a66238" opacity="0.75" />
          <ellipse cx="338" cy="62" rx="36" ry="4" fill="#c79a4a" opacity="0.55" />
          <path d="M 322 58 Q 340 66 360 58" stroke="#7a4830" strokeWidth="1.6" fill="none" opacity="0.4" />
        </g>

        {/* small comet streak */}
        <g opacity="0.7">
          <path d="M 56 240 Q 76 230 96 224" stroke="#fce29a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="98" cy="223" r="2.6" fill="#fce29a" />
        </g>

        {/* stars — varied sizes, scattered */}
        <g fill="#fbf6e6">
          {[
            [40, 30, 1.6], [120, 22, 1.2], [180, 50, 1.0], [220, 18, 1.8],
            [260, 40, 1.2], [70, 90, 1.4], [200, 110, 1.0], [310, 130, 1.6],
            [40, 160, 1.2], [110, 170, 1.0], [160, 200, 1.4], [250, 180, 1.0],
            [350, 220, 1.4], [380, 80, 1.2], [380, 270, 1.0], [60, 270, 1.2],
            [140, 260, 1.4], [220, 270, 1.0], [290, 250, 1.4], [12, 110, 1.0],
            [12, 200, 1.4],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>

        {/* a couple of twinkle stars — 4-point */}
        <g fill="#fce29a" opacity="0.9">
          <path d="M 90 50 L 92 55 L 97 57 L 92 59 L 90 64 L 88 59 L 83 57 L 88 55 Z" />
          <path d="M 280 200 L 282 205 L 287 207 L 282 209 L 280 214 L 278 209 L 273 207 L 278 205 Z" />
          <path d="M 160 140 L 161.5 143.5 L 165 145 L 161.5 146.5 L 160 150 L 158.5 146.5 L 155 145 L 158.5 143.5 Z" />
        </g>

        {/* vignette */}
        <rect width="400" height="300" fill="url(#bg-vignette-dark)" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  );
}

/* ───────────────────────── MOONSCAPE ─────────────────────────────── */
function MoonscapeBackground({ children, style }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      ...style,
    }}>
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* sky */}
        <rect width="400" height="220" fill="url(#moonscape-sky)" />

        {/* nebula washes — fainter than starfield */}
        <g filter="url(#glow)" opacity="0.7">
          <ellipse cx="100" cy="50" rx="80" ry="40" fill="url(#nebula-purple)" />
          <ellipse cx="340" cy="100" rx="80" ry="40" fill="url(#nebula-pink)" />
        </g>

        {/* stars */}
        <g fill="#fbf6e6">
          {[
            [40, 30, 1.4], [120, 20, 1.0], [180, 40, 1.4], [220, 28, 1.0],
            [280, 50, 1.2], [320, 30, 1.6], [360, 60, 1.2], [40, 80, 1.0],
            [100, 90, 1.4], [200, 100, 1.2], [240, 80, 1.0], [380, 110, 1.4],
            [70, 140, 1.2], [170, 150, 1.0], [260, 140, 1.2], [320, 170, 1.4],
            [20, 180, 1.0], [380, 200, 1.2],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>

        {/* distant Earth */}
        <g>
          <circle cx="320" cy="160" r="26" fill="#3a6ba0" />
          {/* continents */}
          <path d="M 304 152 Q 312 144 322 148 Q 326 154 320 160 Q 312 162 304 158 Z" fill="#4a8a52" opacity="0.85" />
          <path d="M 326 168 Q 336 166 340 172 Q 338 178 330 178 Q 326 174 326 168 Z" fill="#4a8a52" opacity="0.85" />
          {/* clouds */}
          <ellipse cx="316" cy="172" rx="6" ry="2" fill="#dde6ee" opacity="0.6" />
          {/* atmosphere glow */}
          <circle cx="320" cy="160" r="28" fill="none" stroke="#7faedb" strokeWidth="1.5" opacity="0.45" />
        </g>

        {/* moon surface horizon */}
        <path d="M 0 220 Q 80 200 160 214 Q 240 226 320 208 Q 380 200 400 212 L 400 300 L 0 300 Z"
              fill="url(#moon-ground)" />

        {/* surface highlight (lighter wash at horizon) */}
        <path d="M 0 220 Q 80 200 160 214 Q 240 226 320 208 Q 380 200 400 212 L 400 232 L 0 232 Z"
              fill="#9a8c75" opacity="0.5" />

        {/* foreground craters */}
        <g>
          <ellipse cx="60" cy="270" rx="32" ry="8" fill="#2c241c" opacity="0.55" />
          <ellipse cx="60" cy="268" rx="30" ry="7" fill="#5e5446" opacity="0.7" />
          <ellipse cx="260" cy="250" rx="22" ry="6" fill="#2c241c" opacity="0.5" />
          <ellipse cx="260" cy="248" rx="20" ry="5" fill="#5e5446" opacity="0.65" />
          <ellipse cx="370" cy="280" rx="22" ry="5" fill="#2c241c" opacity="0.5" />
        </g>

        {/* scattered surface rocks */}
        <g fill="#3a3128">
          <ellipse cx="140" cy="250" rx="4" ry="2" />
          <ellipse cx="180" cy="262" rx="3" ry="1.6" />
          <ellipse cx="200" cy="272" rx="5" ry="2.2" />
          <ellipse cx="310" cy="266" rx="4" ry="1.8" />
          <ellipse cx="340" cy="258" rx="3" ry="1.4" />
        </g>

        {/* vignette */}
        <rect width="400" height="300" fill="url(#bg-vignette-dark)" />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  );
}

window.SpaceBackgrounds = { StarfieldBackground, MoonscapeBackground };
