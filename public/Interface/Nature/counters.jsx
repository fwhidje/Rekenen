// Six nature counters, drawn as hand-shaped SVG with watercolour washes
// and a soft brown outline. Each accepts variant: 'heavy' | 'medium' | 'light'.

const INK = '#3d2f1e';        // soft charcoal-brown outline
const INK_SOFT = '#6b5a44';   // secondary line

const FLAT = {
  pollen:  '#f0b932',
  pollenD: '#c79023',
  berry:   '#c14b3a',
  berryD:  '#8e2e22',
  leaf:    '#7a9a3a',
  leafD:   '#4a6b2a',
  leafL:   '#a4c258',
  bloom:   '#d97a85',
  bloomD:  '#a64850',
  plum:    '#8a5a99',
  plumD:   '#5e3e6a',
  earth:   '#8a6840',
  earthD:  '#6a4f2e',
  paper:   '#f4ecd8',
  cream:   '#f3e6c4',
  wing:    '#e3eef3',
};

function fillFor(name, variant) {
  if (variant === 'light') return FLAT[name];
  return `url(#wash-${name})`;
}
function strokeW(variant, base = 2.4) {
  if (variant === 'light') return base * 0.85;
  if (variant === 'heavy') return base * 1.05;
  return base;
}

// Tiny accent under each counter — suggests painted shadow on paper.
function GroundShadow({ cx = 55, cy = 100, rx = 22, ry = 3, opacity = 0.18 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} opacity={opacity} />;
}

// Grain overlay shape (used in 'heavy' variant)
function Grain({ children }) {
  return (
    <g filter="url(#paper-grain)" opacity="0.55" style={{ mixBlendMode: 'multiply' }}>
      {children}
    </g>
  );
}

// Painted halo that sits BEHIND a heavy counter — fakes watercolour pooling
function PaintPool({ children, color }) {
  return (
    <g opacity="0.35" filter="url(#bleed-heavy)" style={{ mixBlendMode: 'multiply' }}>
      <g fill={color} stroke="none">
        {children}
      </g>
    </g>
  );
}

/* ─────────────────────────────── BEE ─────────────────────────────── */
// Side-on view: head on the left (with eye + antennae), abdomen on the right
// (with stinger). Two wings rise from the back; three legs hang below.
const BEE_BODY = "M 18 64 Q 16 50 30 46 Q 50 42 70 46 Q 88 50 90 64 Q 90 76 74 80 Q 52 82 32 80 Q 18 78 18 64 Z";

function Bee({ variant = 'medium', size = 110 }) {
  const fill = fillFor('pollen', variant);
  const sw = strokeW(variant);
  const clipId = `bee-body-${React.useId().replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <defs>
        <clipPath id={clipId}>
          <path d={BEE_BODY} />
        </clipPath>
      </defs>
      <GroundShadow cx="54" cy="100" rx="30" />
      <g filter={bleedFilter(variant)}>
        {/* LEGS — hang down under body, three of them */}
        <path d="M 30 78 Q 26 86 24 92" stroke={INK} strokeWidth={sw - 0.5}
              strokeLinecap="round" fill="none" />
        <path d="M 52 82 L 52 92" stroke={INK} strokeWidth={sw - 0.5}
              strokeLinecap="round" fill="none" />
        <path d="M 72 80 Q 76 86 78 92" stroke={INK} strokeWidth={sw - 0.5}
              strokeLinecap="round" fill="none" />
        <circle cx="24" cy="92" r="1.4" fill={INK} />
        <circle cx="52" cy="92" r="1.4" fill={INK} />
        <circle cx="78" cy="92" r="1.4" fill={INK} />

        {/* HINDWING — attached at body back, sweeps up-back */}
        <path d="M 60 46 C 78 36, 84 16, 72 12 C 58 14, 56 36, 58 46 Z"
              fill={FLAT.wing} stroke={INK} strokeWidth={sw - 0.6}
              opacity="0.65" strokeLinejoin="round" />
        {/* FOREWING — larger, attached at body back, sweeps up-forward */}
        <path d="M 50 46 C 28 40, 16 20, 32 10 C 52 6, 62 30, 56 46 Z"
              fill={FLAT.wing} stroke={INK} strokeWidth={sw - 0.4}
              opacity="0.85" strokeLinejoin="round" />
        {/* wing vein hint */}
        <path d="M 50 44 Q 38 30 32 16" stroke={INK} strokeWidth="0.9"
              fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M 60 44 Q 70 30 72 16" stroke={INK} strokeWidth="0.9"
              fill="none" opacity="0.4" strokeLinecap="round" />

        {/* BODY fill */}
        <path d={BEE_BODY} fill={fill} stroke="none" />

        {/* STRIPES — vertical bands wrapping around the body, clipped */}
        <g clipPath={`url(#${clipId})`}>
          <ellipse cx="46" cy="62" rx="4.5" ry="24" fill={INK} opacity="0.92" />
          <ellipse cx="62" cy="62" rx="4.5" ry="24" fill={INK} opacity="0.92" />
          <ellipse cx="78" cy="62" rx="4.5" ry="24" fill={INK} opacity="0.92" />
        </g>

        {/* re-outline body so stripe edges look clean */}
        <path d={BEE_BODY} fill="none" stroke={INK}
              strokeWidth={sw} strokeLinejoin="round" />

        {/* SOFT HEAD SEPARATOR — hint of a neck */}
        <path d="M 32 52 Q 30 64 32 76" stroke={INK} strokeWidth={sw - 1}
              fill="none" opacity="0.3" strokeLinecap="round" />

        {/* EYE — single, on the head */}
        <ellipse cx="26" cy="60" rx="3.4" ry="3.8" fill={INK} />
        <circle cx="25" cy="59" r="1.1" fill={FLAT.paper} />

        {/* mouth — tiny */}
        <path d="M 20 68 Q 22 70 24 69" stroke={INK} strokeWidth="1"
              fill="none" strokeLinecap="round" opacity="0.7" />

        {/* ANTENNAE — rise from top of head, two of them, slight fan */}
        <path d="M 24 50 Q 18 36 14 26" stroke={INK} strokeWidth={sw - 0.5}
              fill="none" strokeLinecap="round" />
        <path d="M 30 48 Q 28 34 30 22" stroke={INK} strokeWidth={sw - 0.5}
              fill="none" strokeLinecap="round" />
        <circle cx="14" cy="26" r="2.2" fill={INK} />
        <circle cx="30" cy="22" r="2.2" fill={INK} />
      </g>
      {variant === 'heavy' && (
        <Grain>
          <path d={BEE_BODY} fill="#000" />
        </Grain>
      )}
    </svg>
  );
}

/* ────────────────────────────── BUTTERFLY ────────────────────────── */
function Butterfly({ variant = 'medium', size = 110 }) {
  const sw = strokeW(variant, 2.2);
  const wingFill = fillFor('plum', variant);
  const accent = variant === 'light' ? FLAT.bloom : 'url(#wash-bloom)';
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <GroundShadow rx={20} />
      <g filter={bleedFilter(variant)}>
        {/* top wings */}
        <path d="M 55 50 C 36 18, 8 22, 14 48 C 18 64, 38 64, 55 56 Z"
              fill={wingFill} stroke={INK} strokeWidth={sw}
              strokeLinejoin="round" />
        <path d="M 55 50 C 74 18, 102 22, 96 48 C 92 64, 72 64, 55 56 Z"
              fill={wingFill} stroke={INK} strokeWidth={sw}
              strokeLinejoin="round" />
        {/* bottom wings */}
        <path d="M 55 60 C 38 64, 22 76, 30 90 C 38 100, 52 86, 55 70 Z"
              fill={wingFill} stroke={INK} strokeWidth={sw}
              strokeLinejoin="round" />
        <path d="M 55 60 C 72 64, 88 76, 80 90 C 72 100, 58 86, 55 70 Z"
              fill={wingFill} stroke={INK} strokeWidth={sw}
              strokeLinejoin="round" />

        {/* wing spots */}
        <circle cx="26" cy="40" r="4.5" fill={accent} stroke={INK} strokeWidth="1.2" />
        <circle cx="84" cy="40" r="4.5" fill={accent} stroke={INK} strokeWidth="1.2" />
        <circle cx="38" cy="80" r="3" fill={accent} />
        <circle cx="72" cy="80" r="3" fill={accent} />

        {/* body */}
        <path d="M 53 36 Q 50 36 50 40 L 50 88 Q 50 94 55 94 Q 60 94 60 88 L 60 40 Q 60 36 57 36 Z"
              fill={INK} />
        <circle cx="55" cy="34" r="4" fill={INK} />
        {/* antennae */}
        <path d="M 54 30 Q 48 22 44 18" fill="none" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" />
        <path d="M 56 30 Q 62 22 66 18" fill="none" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" />
        <circle cx="44" cy="18" r="1.8" fill={INK} />
        <circle cx="66" cy="18" r="1.8" fill={INK} />
      </g>
      {variant === 'heavy' && (
        <Grain>
          <path d="M 55 50 C 36 18, 8 22, 14 48 C 18 64, 38 64, 55 56 Z" fill="#000" />
          <path d="M 55 50 C 74 18, 102 22, 96 48 C 92 64, 72 64, 55 56 Z" fill="#000" />
        </Grain>
      )}
    </svg>
  );
}

/* ─────────────────────────────── LADYBUG ─────────────────────────── */
function Ladybug({ variant = 'medium', size = 110 }) {
  const sw = strokeW(variant);
  const fill = fillFor('berry', variant);
  const DOME = "M 26 64 Q 26 46 55 46 Q 84 46 84 64 Q 84 82 55 82 Q 26 82 26 64 Z";
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <GroundShadow cy={102} rx={22} />
      <g filter={bleedFilter(variant)}>
        {/* legs — three pairs */}
        <path d="M 30 72 Q 24 78 22 84" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" fill="none" />
        <path d="M 28 62 Q 22 62 18 60" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" fill="none" />
        <path d="M 32 50 Q 24 48 18 44" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" fill="none" />
        <path d="M 80 72 Q 86 78 88 84" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" fill="none" />
        <path d="M 82 62 Q 88 62 92 60" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" fill="none" />
        <path d="M 78 50 Q 86 48 92 44" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" fill="none" />

        {/* head */}
        <path d="M 36 38 Q 55 26 74 38 Q 74 46 55 46 Q 36 46 36 38 Z"
              fill={INK} stroke={INK} strokeWidth={sw - 0.4} strokeLinejoin="round" />
        <circle cx="44" cy="34" r="2" fill={FLAT.paper} />
        <circle cx="66" cy="34" r="2" fill={FLAT.paper} />

        {/* dome */}
        <path d={DOME}
              fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />

        {/* center line */}
        <path d="M 55 48 L 55 80" stroke={INK} strokeWidth={sw - 0.6} strokeLinecap="round" />

        {/* spots */}
        <circle cx="40" cy="58" r="5" fill={INK} />
        <circle cx="40" cy="74" r="3.6" fill={INK} />
        <circle cx="70" cy="58" r="5" fill={INK} />
        <circle cx="70" cy="74" r="3.6" fill={INK} />

        {/* tiny highlight */}
        <path d="M 32 56 Q 36 50 42 50" fill="none" stroke={FLAT.paper} strokeWidth="1.8" opacity="0.55" strokeLinecap="round" />
      </g>
      {variant === 'heavy' && (
        <Grain>
          <path d={DOME} fill="#000" />
        </Grain>
      )}
    </svg>
  );
}

/* ─────────────────────────────── MUSHROOM ────────────────────────── */
function Mushroom({ variant = 'medium', size = 110 }) {
  const sw = strokeW(variant);
  const cap = fillFor('berry', variant);
  const stem = variant === 'light' ? FLAT.cream : 'url(#wash-earth)';
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <GroundShadow cy={101} rx={24} />
      <g filter={bleedFilter(variant)}>
        {/* stem */}
        <path d="M 38 60 Q 36 96 42 100 L 68 100 Q 74 96 72 60 Z"
              fill={variant === 'light' ? FLAT.cream : '#d9c28a'}
              stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        {/* stem shading (right side) */}
        <path d="M 64 64 Q 70 78 66 99 L 69 99 Q 74 92 72 60 Z"
              fill={INK} opacity="0.12" />
        {/* gills hint at bottom of cap */}
        <path d="M 30 62 Q 55 70 80 62" fill="none" stroke={INK} strokeWidth={sw - 0.6} opacity="0.55" strokeLinecap="round" />

        {/* cap */}
        <path d="M 12 60 Q 22 24 55 22 Q 88 24 98 60 Q 88 66 78 64 Q 66 60 55 64 Q 44 60 32 64 Q 22 66 12 60 Z"
              fill={cap} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        {/* spots */}
        <ellipse cx="34" cy="40" rx="6" ry="5.5" fill={FLAT.paper} stroke={INK} strokeWidth="1.2" />
        <ellipse cx="56" cy="34" rx="7" ry="6.5" fill={FLAT.paper} stroke={INK} strokeWidth="1.2" />
        <ellipse cx="76" cy="44" rx="5" ry="4.5" fill={FLAT.paper} stroke={INK} strokeWidth="1.2" />
        <ellipse cx="22" cy="52" rx="4" ry="3.5" fill={FLAT.paper} stroke={INK} strokeWidth="1" />
      </g>
      {variant === 'heavy' && (
        <Grain>
          <path d="M 12 60 Q 22 24 55 22 Q 88 24 98 60 Q 88 66 78 64 Q 66 60 55 64 Q 44 60 32 64 Q 22 66 12 60 Z" fill="#000" />
        </Grain>
      )}
    </svg>
  );
}

/* ──────────────────────────────── LEAF ───────────────────────────── */
function Leaf({ variant = 'medium', size = 110 }) {
  const sw = strokeW(variant);
  const fill = fillFor('leaf', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <GroundShadow rx={18} />
      <g filter={bleedFilter(variant)}>
        {/* stem */}
        <path d="M 55 92 Q 56 80 62 70" fill="none"
              stroke={FLAT.earthD} strokeWidth={sw + 0.4} strokeLinecap="round" />
        {/* leaf blade */}
        <path d="M 62 70 Q 24 56 18 28 Q 46 14 70 24 Q 96 38 92 64 Q 80 78 62 70 Z"
              fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        {/* main vein — base to upper-left tip */}
        <path d="M 62 70 C 54 58, 42 42, 22 26"
              fill="none" stroke={INK} strokeWidth={sw - 0.4}
              strokeLinecap="round" opacity="0.78" />
        {/* upper-right side veins */}
        <path d="M 54 60 Q 64 56 76 54" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
        <path d="M 44 48 Q 58 42 72 38" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
        <path d="M 34 34 Q 46 28 58 24" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
        {/* lower-left side veins */}
        <path d="M 56 62 Q 44 62 34 56" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
        <path d="M 46 50 Q 36 50 26 44" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
        <path d="M 36 36 Q 30 34 24 32" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
      </g>
      {variant === 'heavy' && (
        <Grain>
          <path d="M 62 70 Q 24 56 18 28 Q 46 14 70 24 Q 96 38 92 64 Q 80 78 62 70 Z" fill="#000" />
        </Grain>
      )}
    </svg>
  );
}

/* ─────────────────────────────── DAISY ───────────────────────────── */
function Daisy({ variant = 'medium', size = 110 }) {
  const sw = strokeW(variant, 2);
  const petal = variant === 'light' ? '#fbf3df' : '#f9eecf';
  const center = fillFor('pollen', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <GroundShadow cy={100} rx={20} />
      <g filter={bleedFilter(variant)}>
        {/* stem */}
        <path d="M 55 64 Q 55 80 52 100" fill="none"
              stroke={FLAT.leafD} strokeWidth={sw + 0.6} strokeLinecap="round" />
        {/* small leaf */}
        <path d="M 55 84 Q 64 78 72 80 Q 68 88 55 86 Z"
              fill={fillFor('leaf', variant)} stroke={INK} strokeWidth={sw - 0.5} strokeLinejoin="round" />

        {/* petals — 8 of them */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <g key={i} transform={`rotate(${angle} 55 46)`}>
              <ellipse
                cx="55" cy="22" rx="9" ry="14"
                fill={petal} stroke={INK} strokeWidth={sw - 0.4}
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* flower center */}
        <circle cx="55" cy="46" r="10" fill={center}
                stroke={INK} strokeWidth={sw - 0.2} />
        <circle cx="51.5" cy="43.5" r="2" fill={FLAT.pollenD} opacity="0.8" />
        <circle cx="58" cy="48" r="1.5" fill={FLAT.pollenD} opacity="0.8" />
        <circle cx="56" cy="42" r="1.2" fill={FLAT.pollenD} opacity="0.7" />
      </g>
      {variant === 'heavy' && (
        <Grain>
          <circle cx="55" cy="46" r="10" fill="#000" />
        </Grain>
      )}
    </svg>
  );
}

window.NatureCounters = { Bee, Butterfly, Ladybug, Mushroom, Leaf, Daisy };
window.NatureINK = INK;
window.NatureFLAT = FLAT;
window.fillFor = fillFor;
window.strokeW = strokeW;
window.Grain = Grain;
