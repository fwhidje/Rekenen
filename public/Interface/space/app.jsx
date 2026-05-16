// Composes the Space theme overview page.

const { Rocket, Saturn, Alien, Star, Earth, Astronaut } = window.SpaceCounters;
const { StarfieldBackground, MoonscapeBackground } = window.SpaceBackgrounds;
const { ExerciseMock, SharedDefs } = window;

const COUNTERS = [
  { Comp: Rocket,    name: 'Raket' },
  { Comp: Saturn,    name: 'Planeet' },
  { Comp: Alien,     name: 'Alien' },
  { Comp: Star,      name: 'Ster' },
  { Comp: Earth,     name: 'Aarde' },
  { Comp: Astronaut, name: 'Astronaut' },
];

const PALETTE = [
  { c: '#1a1d4a', n: 'navy (mood)' },
  { c: '#3e2a55', n: 'plum' },
  { c: '#d97a85', n: 'nebula-pink' },
  { c: '#8a5a99', n: 'nebula-purple' },
  { c: '#e8945e', n: 'planet' },
  { c: '#c79a4a', n: 'ring' },
  { c: '#7ac99a', n: 'alien-green' },
  { c: '#f5d76a', n: 'star' },
  { c: '#5a8fc4', n: 'ocean' },
  { c: '#3d2f1e', n: 'ink' },
];

function Page() {
  return (
    <div className="page">
      <SharedDefs />

      <header className="pageHead">
        <div>
          <div className="eyebrow">Theme test · 02</div>
          <h1>Space <em>— starfield &amp; moonscape</em></h1>
        </div>
        <div className="meta">
          <span className="stamp">first pass</span><br />
          <span style={{ display: 'inline-block', marginTop: 8 }}>
            Same recipe as Nature: six counters, two scenes. Decisions from
            theme 01 (uniform weight, medium watercolour) carry over.
          </span>
        </div>
      </header>

      {/* ─── 01 · System ─────────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">01.</span>
          <h2>The system</h2>
          <p>What stays from Nature; what changes for Space.</p>
        </div>
        <div className="systemNote">
          <div>
            <h3>Palette — navy mood</h3>
            <p>
              Mood colour is <strong>deep navy</strong>. Backgrounds carry
              it; counters use small warm accents (planet orange, alien
              green, star yellow) so they pop against the dark sky.
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
              Stars, planets, craters, nebula — all painted-shape only.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 02 · Counters ───────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">02.</span>
          <h2>The six counters</h2>
          <p>Uniform visual weight. 3 + 2 reads cleanly whichever one the round picks.</p>
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
          <p>Starfield for most rounds; moonscape for variety. The app cycles between them.</p>
        </div>
        <div className="bgRow">
          <div className="bgCard">
            <StarfieldBackground />
            <div className="label">starfield</div>
          </div>
          <div className="bgCard">
            <MoonscapeBackground />
            <div className="label">moonscape</div>
          </div>
        </div>
      </section>

      {/* ─── 04 · In context ──────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">04.</span>
          <h2>How a round looks</h2>
          <p>A <code style={{ background: '#fff3d8', padding: '0 5px', borderRadius: 4 }}>fill-vis</code> exercise reskinned in Space. Equation + numpad stay constant; scene + counter swap.</p>
        </div>
        <div className="mockWrap">
          <ExerciseMock Counter={Rocket} counterSize={70} counterOverlap={-14} />
          <div className="mockNotes">
            <h3>Notes</h3>
            <p>
              Same chrome and layout as Nature. The dark scene wants a touch
              more shadow under the counters so they don't float — added a
              stronger drop shadow to compensate.
            </p>
            <p>
              The ✓ on the numpad shifts from leaf-green (Nature) to a soft
              cosmic blue here. Everything else holds.
            </p>
            <ul className="pulls">
              <li>Full-bleed starfield as the card</li>
              <li>Counters drop-shadowed for liftoff</li>
              <li>Equation banner: cream paper, rounded square</li>
              <li>Numpad: paper buttons, charcoal outline, cosmic-blue ✓</li>
              <li>Status bar gradient ensures header text reads on busy sky</li>
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
        <span>theme 02 — space · {new Date().toLocaleDateString('nl-NL')}</span>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
