// Six factory counters in the Nature theme's watercolour craft style.
// Same INK outline (#3d2f1e) so the cross-theme drawing voice stays
// consistent — only fills, gradients, and motifs change.

const FT_INK = '#3d2f1e';
const FT_INK_SOFT = '#6b5a44';

const FTF = {
  // shared neutrals
  paper: '#f4ecd8',
  cream: '#f0eadb',
  // counter accents
  steel: '#9aa0a8',
  steelD: '#4f555e',
  brass: '#d4a04a',
  brassD: '#8a6630',
  bolt: '#52575f',
  boltD: '#2a2d33',
  wood: '#a06d3a',
  woodD: '#5f3f1f',
  bulb: '#f5d76a',
  bulbD: '#c79023',
  rust: '#b8633c',
  rustD: '#6e2e16',
  helm: '#e8a92a',
  helmD: '#9a6a14',
  pipe: '#5e8a8a',
  pipeD: '#2e5454',
};

const FT_FLAT = {
  steel: FTF.steel, brass: FTF.brass, bolt: FTF.bolt,
  wood: FTF.wood, bulb: FTF.bulb, rust: FTF.rust,
  helm: FTF.helm, pipe: FTF.pipe,
};

function ftFill(name, variant = 'medium') {
  if (variant === 'light') return FT_FLAT[name];
  return `url(#wash-${name})`;
}

function FtGround({ cx = 55, cy = 101, rx = 28, opacity = 0.18 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry="3" fill={FT_INK} opacity={opacity} />;
}

/* ─────────────────────────────── GEAR ────────────────────────────── */
function Gear({ variant = 'medium', size = 110 }) {
  const teeth = 8;
  const body = ftFill('steel', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <FtGround rx={30} />
      <g filter="url(#bleed-medium)">
        {/* teeth — rounded rects spun around the center */}
        {Array.from({ length: teeth }).map((_, i) => {
          const angle = (i * 360) / teeth;
          return (
            <rect
              key={i}
              x="49" y="13"
              width="12" height="14"
              rx="2.5"
              fill={body}
              stroke={FT_INK} strokeWidth="2.2"
              strokeLinejoin="round"
              transform={`rotate(${angle} 55 55)`}
            />);

        })}

        {/* gear body disc */}
        <circle cx="55" cy="55" r="27"
        fill={body} stroke={FT_INK} strokeWidth="2.4" />

        {/* inner ring detail */}
        <circle cx="55" cy="55" r="20" fill="none"
        stroke={FT_INK} strokeWidth="1.3" opacity="0.45" />

        {/* center hex bolt */}
        <polygon points="55,42 66,48.5 66,61.5 55,68 44,61.5 44,48.5"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="2" />

        {/* hex bolt highlight */}
        <path d="M 47 47 L 55 43 L 63 47" fill="none"
        stroke="#a8acb4" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />

        {/* body highlight */}
        <path d="M 38 42 Q 50 36 64 40" fill="none"
        stroke="#e6eaef" strokeWidth="2.6" opacity="0.55" strokeLinecap="round" />
      </g>
    </svg>);

}

/* ─────────────────────────────── ROBOT ───────────────────────────── */
function Robot({ variant = 'medium', size = 110 }) {
  const shell = ftFill('steel', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <FtGround rx={28} />
      <g filter="url(#bleed-medium)">
        {/* antenna */}
        <line x1="55" y1="22" x2="55" y2="10"
        stroke={FT_INK} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="55" cy="9" r="4"
        fill={ftFill('rust', variant)} stroke={FT_INK} strokeWidth="2" />

        {/* head */}
        <rect x="32" y="22" width="46" height="34" rx="8"
        fill={shell} stroke={FT_INK} strokeWidth="2.4" />

        {/* eye sockets */}
        <circle cx="44" cy="38" r="5.4" fill="#fff" stroke={FT_INK} strokeWidth="2" />
        <circle cx="44" cy="38" r="2.4" fill={FT_INK} />
        <circle cx="43" cy="37" r="0.9" fill="#fff" />
        <circle cx="66" cy="38" r="5.4" fill="#fff" stroke={FT_INK} strokeWidth="2" />
        <circle cx="66" cy="38" r="2.4" fill={FT_INK} />
        <circle cx="65" cy="37" r="0.9" fill="#fff" />

        {/* mouth grille */}
        <rect x="46" y="47" width="18" height="4" rx="1.5"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="1.4" />
        <line x1="50" y1="47" x2="50" y2="51" stroke={FT_INK} strokeWidth="0.9" opacity="0.6" />
        <line x1="55" y1="47" x2="55" y2="51" stroke={FT_INK} strokeWidth="0.9" opacity="0.6" />
        <line x1="60" y1="47" x2="60" y2="51" stroke={FT_INK} strokeWidth="0.9" opacity="0.6" />

        {/* neck */}
        <rect x="48" y="56" width="14" height="6"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="1.6" />

        {/* body */}
        <rect x="26" y="62" width="58" height="32" rx="6"
        fill={shell} stroke={FT_INK} strokeWidth="2.4" />

        {/* shoulder bolts */}
        <circle cx="28" cy="68" r="2" fill={FTF.boltD} />
        <circle cx="82" cy="68" r="2" fill={FTF.boltD} />

        {/* chest panel */}
        <rect x="38" y="68" width="34" height="18" rx="2.5"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="1.6" />
        <circle cx="46" cy="77" r="2.8" fill={FTF.bulb} stroke={FT_INK} strokeWidth="1" />
        <circle cx="55" cy="77" r="2.8" fill={FTF.rust} stroke={FT_INK} strokeWidth="1" />
        <circle cx="64" cy="77" r="2.8" fill={FTF.pipe} stroke={FT_INK} strokeWidth="1" />

        {/* head highlight */}
        <path d="M 36 28 Q 42 24 52 25" fill="none"
        stroke="#e6eaef" strokeWidth="2.2" opacity="0.5" strokeLinecap="round" />
      </g>
    </svg>);

}

/* ─────────────────────────────── CRATE ───────────────────────────── */
function Crate({ variant = 'medium', size = 110 }) {
  const wood = ftFill('wood', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <FtGround rx={32} />
      <g filter="url(#bleed-medium)">
        {/* main box */}
        <path d="M 16 26 L 94 26 L 94 92 L 16 92 Z"
        fill={wood} stroke={FT_INK} strokeWidth="2.4"
        strokeLinejoin="round" />

        {/* top + bottom braces */}
        <rect x="14" y="24" width="82" height="8"
        fill={wood} stroke={FT_INK} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="14" y="86" width="82" height="8"
        fill={wood} stroke={FT_INK} strokeWidth="2.2" strokeLinejoin="round" />

        {/* vertical planks (subtle) */}
        <line x1="42" y1="32" x2="42" y2="86" stroke={FT_INK} strokeWidth="1.4" opacity="0.55" />
        <line x1="68" y1="32" x2="68" y2="86" stroke={FT_INK} strokeWidth="1.4" opacity="0.55" />

        {/* wood grain wisps */}
        <path d="M 22 50 Q 30 47 38 50" fill="none"
        stroke={FTF.woodD} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
        <path d="M 48 62 Q 56 60 64 62" fill="none"
        stroke={FTF.woodD} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
        <path d="M 74 72 Q 82 70 90 72" fill="none"
        stroke={FTF.woodD} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
        <path d="M 22 76 Q 30 74 38 76" fill="none"
        stroke={FTF.woodD} strokeWidth="1" opacity="0.4" strokeLinecap="round" />

        {/* corner nails */}
        <circle cx="20" cy="28" r="1.6" fill={FTF.boltD} />
        <circle cx="90" cy="28" r="1.6" fill={FTF.boltD} />
        <circle cx="20" cy="90" r="1.6" fill={FTF.boltD} />
        <circle cx="90" cy="90" r="1.6" fill={FTF.boltD} />

        {/* "this way up" arrow stamp */}
        <g opacity="0.65">
          <path d="M 49 60 L 55 54 L 61 60" fill="none"
          stroke={FT_INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="55" y1="54" x2="55" y2="72"
          stroke={FT_INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* highlight on top */}
        <path d="M 20 28 Q 30 26 50 26" fill="none"
        stroke="#f0c994" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
      </g>
    </svg>);

}

/* ─────────────────────────────── LAMP ────────────────────────────── */
function Lamp({ variant = 'medium', size = 110 }) {
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <FtGround cy={102} rx={20} />
      <g filter="url(#bleed-medium)">
        {/* soft halo */}
        <circle cx="55" cy="46" r="32" fill={FTF.bulb} opacity="0.28"
        filter="url(#glow)" />

        {/* bulb glass */}
        <path d="M 55 14
                 Q 34 14 32 36
                 Q 30 52 42 62
                 Q 44 70 42 76
                 L 68 76
                 Q 66 70 68 62
                 Q 80 52 78 36
                 Q 76 14 55 14 Z"






        fill={ftFill('bulb', variant)} stroke={FT_INK}
        strokeWidth="2.4" strokeLinejoin="round" />

        {/* filament zig-zag */}
        <path d="M 47 44 L 49 56 L 52 48 L 55 56 L 58 48 L 61 56 L 63 44"
        fill="none" stroke={FTF.bulbD} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
        {/* filament posts */}
        <line x1="47" y1="44" x2="46" y2="40"
        stroke={FT_INK} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="63" y1="44" x2="64" y2="40"
        stroke={FT_INK} strokeWidth="1.6" strokeLinecap="round" />

        {/* glass highlight */}
        <ellipse cx="42" cy="30" rx="3.5" ry="8" fill="#fff" opacity="0.55" transform="rotate(-12 42 30)" />

        {/* brass screw base */}
        <path d="M 42 76 L 42 86 Q 42 90 46 90 L 64 90 Q 68 90 68 86 L 68 76 Z"
        fill={ftFill('brass', variant)} stroke={FT_INK}
        strokeWidth="2.2" strokeLinejoin="round" />
        {/* threads */}
        <line x1="42" y1="80" x2="68" y2="80"
        stroke={FT_INK} strokeWidth="1.2" opacity="0.6" />
        <line x1="42" y1="84" x2="68" y2="84"
        stroke={FT_INK} strokeWidth="1.2" opacity="0.6" />

        {/* tip cap */}
        <ellipse cx="55" cy="92.5" rx="6.5" ry="3"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="1.8" />
      </g>
    </svg>);

}

/* ─────────────────────────────── DRUM ────────────────────────────── */
function Drum({ variant = 'medium', size = 110 }) {
  const body = ftFill('rust', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <FtGround rx={30} />
      <g filter="url(#bleed-medium)">
        {/* body sides */}
        <path d="M 22 26 L 22 90 Q 22 96 28 96 L 82 96 Q 88 96 88 90 L 88 26 Z"
        fill={body} stroke={FT_INK} strokeWidth="2.4"
        strokeLinejoin="round" />

        {/* top lid ellipse */}
        <ellipse cx="55" cy="26" rx="33" ry="8"
        fill={body} stroke={FT_INK} strokeWidth="2.4" />
        <ellipse cx="55" cy="26" rx="28" ry="6" fill={FTF.rustD} opacity="0.55" />
        {/* lid plug */}
        <circle cx="46" cy="24" r="2.6" fill={FTF.boltD} stroke={FT_INK} strokeWidth="1.2" />

        {/* horizontal bands */}
        <rect x="20" y="44" width="70" height="6"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="1.6" />
        <rect x="20" y="74" width="70" height="6"
        fill={ftFill('bolt', variant)} stroke={FT_INK} strokeWidth="1.6" />

        {/* highlight stripe down the side */}
        <path d="M 32 32 L 32 90" fill="none"
        stroke="#f3b89a" strokeWidth="3" opacity="0.5" strokeLinecap="round" />

        {/* darker side stripe */}
        <path d="M 80 32 L 80 90" fill="none"
        stroke={FTF.rustD} strokeWidth="2" opacity="0.45" strokeLinecap="round" />

        {/* hazard label patch */}
        <rect x="44" y="56" width="22" height="14" rx="2"
        fill={FTF.paper} stroke={FT_INK} strokeWidth="1.8" />
        {/* triangle hazard symbol */}
        <path d="M 55 60 L 61 67 L 49 67 Z" fill="none"
        stroke={FTF.rustD} strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="55" y1="62" x2="55" y2="65"
        stroke={FTF.rustD} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="55" cy="66.5" r="0.6" fill={FTF.rustD} />
      </g>
    </svg>);

}

/* ─────────────────────────────── HELM ────────────────────────────── */
function Helm({ variant = 'medium', size = 110 }) {
  const shell = ftFill('helm', variant);
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      <FtGround cy={98} rx={34} />
      <g filter="url(#bleed-medium)">
        {/* dome */}
        <path d="M 22 76
                 Q 22 44 38 34
                 Q 50 28 55 28
                 Q 60 28 72 34
                 Q 88 44 88 76 Z"




        fill={shell} stroke={FT_INK} strokeWidth="2.4"
        strokeLinejoin="round" />

        {/* center ridge */}
        <path d="M 55 30 L 55 74" stroke={FT_INK} strokeWidth="1.8" opacity="0.55" />

        {/* side ridges */}
        <path d="M 38 44 Q 40 60 44 74" fill="none"
        stroke={FT_INK} strokeWidth="1.4" opacity="0.4" strokeLinecap="round" />
        <path d="M 72 44 Q 70 60 66 74" fill="none"
        stroke={FT_INK} strokeWidth="1.4" opacity="0.4" strokeLinecap="round" />

        {/* brim */}
        <path d="M 14 74 Q 55 86 96 74 L 96 80 Q 55 92 14 80 Z"
        fill={shell} stroke={FT_INK} strokeWidth="2.4"
        strokeLinejoin="round" />

        {/* darker shading under brim */}
        <path d="M 16 81 Q 55 89 94 81" fill="none"
        stroke={FTF.helmD} strokeWidth="1.8" opacity="0.55" strokeLinecap="round" />

        {/* top highlight */}
        <path d="M 30 42 Q 36 36 46 35" fill="none"
        stroke="#fff5c8" strokeWidth="3" opacity="0.6" strokeLinecap="round" />

        {/* front emblem badge */}
        <circle cx="55" cy="58" r="7"
        fill={FTF.paper} stroke={FT_INK} strokeWidth="1.8" />
        <path d="M 51 58 L 54 62 L 60 54" fill="none"
        stroke={FTF.rustD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>);

}

window.FactoryCounters = { Gear, Robot, Crate, Lamp, Drum, Helm };
window.FT_INK = FT_INK;
window.FTF = FTF;
