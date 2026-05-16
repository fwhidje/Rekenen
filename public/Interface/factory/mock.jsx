// Mocked exercise card — Factory theme.
// Mirrors the structure of the Space mock but uses factory counters
// + FactoryInteriorBackground.

function ExerciseMock({ Counter = null, counterSize = 70, counterOverlap = -14 }) {
  const { Gear } = window.FactoryCounters;
  const { FactoryInteriorBackground } = window.FactoryBackgrounds;
  const C = Counter || Gear;

  const operandA = 3;
  const operandB = 2;

  return (
    <div className="phoneFrame">
      <div className="phoneScreen">
        {/* status bar / header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.6)',
        }}>
          <div style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: 18,
          }}>
            Rekenen 🧮
          </div>
          <div style={{
            background: 'rgba(244,236,216,0.92)',
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

        {/* full-bleed scene */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <FactoryInteriorBackground />
        </div>

        {/* darker gradient at top for status text legibility */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 70,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.45), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* exercise content */}
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
          {/* counter row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {Array.from({ length: operandA }).map((_, i) => (
                <div key={`a${i}`} style={{
                  marginLeft: i === 0 ? 0 : counterOverlap,
                  filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.35))',
                }}>
                  <C size={counterSize} />
                </div>
              ))}
            </div>
            <span style={{
              fontFamily: 'Fredoka One, cursive',
              fontSize: 36,
              color: '#fbf6e6',
              textShadow: '0 2px 4px rgba(0,0,0,0.65)',
            }}>+</span>
            <div style={{ display: 'flex', gap: 0 }}>
              {Array.from({ length: operandB }).map((_, i) => (
                <div key={`b${i}`} style={{
                  marginLeft: i === 0 ? 0 : counterOverlap,
                  filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.35))',
                }}>
                  <C size={counterSize} />
                </div>
              ))}
            </div>
          </div>

          {/* equation banner — cream paper, rounded-square */}
          <div style={{
            marginTop: 6,
            background: 'rgba(244,236,216,0.96)',
            border: '2px solid #3d2f1e',
            borderRadius: 18,
            padding: '10px 22px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '2px 4px 0 rgba(0,0,0,.3)',
          }}>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 38, color: '#c79023', lineHeight: 1 }}>{operandA}</span>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 30, color: '#3d2f1e', lineHeight: 1 }}>+</span>
            <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: 38, color: '#b8633c', lineHeight: 1 }}>{operandB}</span>
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

        {/* numpad — sits on cream paper strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(244,236,216,0) 0%, rgba(244,236,216,0.94) 28%, rgba(244,236,216,0.98) 100%)',
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
                background: k === '✓' ? '#b8633c' : (k === '⌫' ? '#ecdfbe' : '#fbf6e6'),
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
