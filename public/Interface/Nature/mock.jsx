// Mocked exercise card — shows how the theme reads with a real equation
// in front of a full-bleed scene background. Mirrors the structure of
// FillVisual.tsx + KidMode.tsx but reskinned for the Nature theme.

function ExerciseMock({ variant = 'medium', Counter = null, counterSize = 70, counterOverlap = -14, label = null }) {
  const { Bee } = window.NatureCounters;
  const { MeadowBackground } = window.NatureBackgrounds;
  const C = Counter || Bee;

  const operandA = 3;
  const operandB = 2;

  return (
    <div className="phoneFrame">
      <div className="phoneScreen">
        {/* Status bar / header strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.35)',
        }}>
          <div style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: 18,
          }}>
            Rekenen 🧮
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            border: '2px solid #3d2f1e',
            borderRadius: 14,
            padding: '4px 10px 5px',
            fontFamily: 'Patrick Hand, cursive',
            fontSize: 13,
            color: '#3d2f1e',
          }}>
            ⚙️ Opties
          </div>
        </div>

        {/* Full-bleed scene */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MeadowBackground />
        </div>

        {/* Soft paper banner at top to make header readable on bright scenes */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(180deg, rgba(61,47,30,0.35), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Exercise content — counters on top of scene */}
        <div style={{
          position: 'absolute', inset: 0,
          paddingTop: 64, paddingBottom: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          zIndex: 3,
        }}>
          {/* Counter row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {Array.from({ length: operandA }).map((_, i) => (
                <div key={`a${i}`} style={{
                  marginLeft: i === 0 ? 0 : counterOverlap,
                  filter: 'drop-shadow(2px 3px 0 rgba(61,47,30,0.18))',
                }}>
                  <C variant={variant} size={counterSize} />
                </div>
              ))}
            </div>
            <span style={{
              fontFamily: 'Fredoka One, cursive',
              fontSize: 36,
              color: '#3d2f1e',
              textShadow: '0 2px 0 rgba(255,255,255,.55)',
            }}>+</span>
            <div style={{ display: 'flex', gap: 0 }}>
              {Array.from({ length: operandB }).map((_, i) => (
                <div key={`b${i}`} style={{
                  marginLeft: i === 0 ? 0 : counterOverlap,
                  filter: 'drop-shadow(2px 3px 0 rgba(61,47,30,0.18))',
                }}>
                  <C variant={variant} size={counterSize} />
                </div>
              ))}
            </div>
          </div>

          {/* Equation banner — paper pill */}
          <div style={{
            marginTop: 6,
            background: 'rgba(244,236,216,0.94)',
            border: '2px solid #3d2f1e',
            borderRadius: 18,
            padding: '10px 22px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '2px 4px 0 rgba(61,47,30,.15)',
          }}>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 38, color: '#c79023', lineHeight: 1 }}>{operandA}</span>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 30, color: '#3d2f1e', lineHeight: 1 }}>+</span>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 38, color: '#8a5a99', lineHeight: 1 }}>{operandB}</span>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 30, color: '#6b5a44', lineHeight: 1 }}>=</span>
            <span style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fredoka One, cursive', fontSize: 28,
              background: '#f0b932',
              color: '#3d2f1e',
              borderRadius: 12,
              border: '2px solid #3d2f1e',
              boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)',
            }}>?</span>
          </div>
        </div>

        {/* Numpad — sits on a paper strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(244,236,216,0) 0%, rgba(244,236,216,0.94) 30%, rgba(244,236,216,0.98) 100%)',
          padding: '24px 18px 20px',
          zIndex: 5,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k => (
              <div key={k} style={{
                height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: k === '✓' ? '#7a9a3a' : (k === '⌫' ? '#ecdfbe' : '#fbf6e6'),
                color: k === '✓' ? '#fff' : '#3d2f1e',
                border: '2px solid #3d2f1e',
                borderRadius: 14,
                fontFamily: 'Fredoka One, cursive',
                fontSize: 20,
                boxShadow: '0 2px 0 rgba(61,47,30,0.18)',
              }}>{k}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ExerciseMock = ExerciseMock;
