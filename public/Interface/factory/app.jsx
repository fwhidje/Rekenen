// Composes the Factory theme overview page.

const { Gear, Robot, Crate, Lamp, Drum, Helm } = window.FactoryCounters;
const { FactoryInteriorBackground, FactoryExteriorBackground } = window.FactoryBackgrounds;
const { ExerciseMock, SharedDefs } = window;

const COUNTERS = [
  { Comp: Gear,  name: 'Tandwiel' },
  { Comp: Robot, name: 'Robot' },
  { Comp: Crate, name: 'Kist' },
  { Comp: Lamp,  name: 'Lamp' },
  { Comp: Drum,  name: 'Vat' },
  { Comp: Helm,  name: 'Helm' },
];

const PALETTE = [
  { c: '#4a4854', n: 'iron (mood)' },
  { c: '#9aa0a8', n: 'steel' },
  { c: '#d4a04a', n: 'brass' },
  { c: '#b8633c', n: 'rust' },
  { c: '#e8a92a', n: 'caution' },
  { c: '#f5d76a', n: 'bulb' },
  { c: '#a06d3a', n: 'wood' },
  { c: '#5e8a8a', n: 'pipe' },
  { c: '#2a2d33', n: 'bolt' },
  { c: '#3d2f1e', n: 'ink' },
];

function Page() {
  return (
    <div className="page">
      <SharedDefs />

      <header className="pageHead">
        <div>
          <div className="eyebrow">Theme test · 03</div>
          <h1>Factory <em>— gears &amp; smokestacks</em></h1>
        </div>
        <div className="meta">
          <span className="stamp">first pass</span><br />
          <span style={{ display: 'inline-block', marginTop: 8 }}>
            Industrial mood — iron and brass. Same recipe: six counters,
            two scenes; decisions from Nature &amp; Space carry over.
          </span>
        </div>
      </header>

      {/* ─── 01 · System ─────────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">01.</span>
          <h2>The system</h2>
          <p>What stays from Nature &amp; Space; what changes for Factory.</p>
        </div>
        <div className="systemNote">
          <div>
            <h3>Palette — iron mood</h3>
            <p>
              Mood colour is <strong>iron grey</strong>. Backgrounds carry
              it; counters use warm shop-floor accents (brass, rust, caution
              yellow) so they pop against the grey machinery.
            </p>
            <div className="swatchRow">
              {PALETTE.map(({ c, n }) => (
                <div key={n} className="swatch">
                  <div className="chip" style={{ background: c }} />
                  <div className="lbl">{n}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>What carries over</h3>
            <ul>
              <li>Soft charcoal outline (<code style={{ background: '#fff3d8', padding: '0 5px', borderRadius: 4 }}>#3d2f1e</code>) on counters only</li>
              <li>Medium watercolour wash — locked from Nature</li>
              <li>Uniform counter weight — locked from Nature</li>
              <li>Cream paper banner + Fredoka One for the equation</li>
              <li>Theme touches graphics &amp; backgrounds only — no logic changes</li>
            </ul>
            <p style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(74,107,42,0.08)', borderLeft: '3px solid #4a6b2a', borderRadius: 4 }}>
              <strong>Outline rule:</strong> only counters get the outline.
              Pipes, smokestacks, machinery — all painted-shape only.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 02 · Counters ───────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">02.</span>
          <h2>The six counters</h2>
          <p>Shop-floor objects. Uniform visual weight — reads cleanly in any combination.</p>
        </div>
        <div className="counterGrid">
          {COUNTERS.map(({ Comp, name }) => (
            <div className="counterCell" key={name}>
              <div className="art">
                <Comp size={120} />
              </div>
              <div className="name">{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 03 · Backgrounds ─────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">03.</span>
          <h2>Two scenes per theme</h2>
          <p>Shop floor for most rounds; brickyard at dusk for variety. The app cycles between them.</p>
        </div>
        <div className="bgRow">
          <div className="bgCard">
            <FactoryInteriorBackground />
            <div className="label">shop floor</div>
          </div>
          <div className="bgCard">
            <FactoryExteriorBackground />
            <div className="label">brickyard</div>
          </div>
        </div>
      </section>

      {/* ─── 04 · In context ──────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">04.</span>
          <h2>How a round looks</h2>
          <p>A <code style={{ background: '#fff3d8', padding: '0 5px', borderRadius: 4 }}>fill-vis</code> exercise reskinned in Factory. Equation + numpad stay constant; scene + counter swap.</p>
        </div>
        <div className="mockWrap">
          <ExerciseMock Counter={Gear} counterSize={70} counterOverlap={-14} />
          <div className="mockNotes">
            <h3>Notes</h3>
            <p>
              Same chrome and layout as Nature &amp; Space. The shop-floor
              scene is darker than starfield, so counter drop-shadow stays
              strong; numpad ✓ shifts to rust orange to read against
              the warm paper strip.
            </p>
            <p>
              Pipes and machinery in the background are kept low-contrast
              so the counters never have to fight for attention.
            </p>
            <ul className="pulls">
              <li>Full-bleed shop floor as the card</li>
              <li>Counters drop-shadowed onto the conveyor belt</li>
              <li>Equation banner: cream paper, rounded square</li>
              <li>Numpad: paper buttons, charcoal outline, rust ✓</li>
              <li>Status bar gradient ensures header text reads on busy scene</li>
            </ul>
          </div>
        </div>
      </section>

      <footer style={{
        marginTop: 60, paddingTop: 24,
        borderTop: '1.5px solid #c7b58a',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'Patrick Hand, cursive', color: '#6b5a44', fontSize: 14,
      }}>
        <span>Rekenen · theme system · v0.2</span>
        <span>theme 03 — factory · {new Date().toLocaleDateString('nl-NL')}</span>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
