// Composes the overview page: header → system notes → aesthetic variants →
// counters → backgrounds → exercise mock → next steps.

const { Bee, Butterfly, Ladybug, Mushroom, Leaf, Daisy } = window.NatureCounters;
const { MeadowBackground, PondBackground } = window.NatureBackgrounds;
const { ExerciseMock, SharedDefs } = window;

const COUNTERS = [
  { Comp: Bee,       name: 'Bij' },
  { Comp: Butterfly, name: 'Vlinder' },
  { Comp: Ladybug,   name: 'Lieveheersbeestje' },
  { Comp: Mushroom,  name: 'Paddenstoel' },
  { Comp: Leaf,      name: 'Blaadje' },
  { Comp: Daisy,     name: 'Madelief' },
];

const PALETTE = [
  { c: '#4a6b2a', n: 'leaf-deep' },
  { c: '#7a9a3a', n: 'leaf-mid' },
  { c: '#c8d782', n: 'leaf-light' },
  { c: '#b8dde8', n: 'sky' },
  { c: '#7fb3c9', n: 'water' },
  { c: '#f0b932', n: 'pollen' },
  { c: '#c14b3a', n: 'berry' },
  { c: '#d97a85', n: 'bloom' },
  { c: '#8a6840', n: 'earth' },
  { c: '#3d2f1e', n: 'ink' },
];

function Page() {
  return (
    <div className="page">
      <SharedDefs />

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="pageHead">
        <div>
          <div className="eyebrow">Theme test · 01</div>
          <h1>Nature <em>— meadow &amp; pond</em></h1>
        </div>
        <div className="meta">
          <span className="stamp">first pass</span><br/>
          <span style={{ display: 'inline-block', marginTop: 8 }}>
            Six counters, two scenes, paper-and-paint feel. Pick a texture
            level &amp; tell me what to push.
          </span>
        </div>
      </header>

      {/* ─── 01 · The system ─────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">01.</span>
          <h2>The system</h2>
          <p>How a theme is put together. Counters and scene share one palette &amp; one outline.</p>
        </div>
        <div className="systemNote">
          <div>
            <h3>Palette — green mood</h3>
            <p>
              Every theme has one obvious mood colour. Nature leads on
              <strong> leaf-deep</strong>. Counters borrow from a small
              shared palette so a bee and a ladybug on the same hill don't
              clash.
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
            <h3>Outline &amp; type</h3>
            <p>
              All counters use the same soft charcoal-brown outline
              (<code style={{ background: '#fff3d8', padding: '0 5px', borderRadius: 4 }}>#3d2f1e</code>)
              with round caps and slightly varied weight. No pure black
              anywhere — keeps it warm and paper-like.
            </p>
            <ul>
              <li><span style={{ fontFamily: 'Fredoka One' }}>Fredoka One</span> — numbers (already in app)</li>
              <li><span style={{ fontFamily: 'Caveat', fontSize: 22 }}>Caveat</span> — display, headings on this page</li>
              <li><span style={{ fontFamily: 'Patrick Hand' }}>Patrick Hand</span> — labels &amp; small UI</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              For Kid Mode the app keeps <strong>Fredoka One</strong> for the
              equation — the only constant across all themes. Theme only
              touches graphics &amp; backgrounds.
            </p>
            <p style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(74,107,42,0.08)', borderLeft: '3px solid #4a6b2a', borderRadius: 4 }}>
              <strong>Outline rule:</strong> only <em>counters</em> get the
              charcoal outline. Background scenery is unlined paint shapes —
              keeps the counters reading as the foreground subject and the
              scene as atmospheric.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 02 · Aesthetic exploration ──────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">02.</span>
          <h2>How crafty?</h2>
          <p>Three texture treatments tested. <strong>Medium</strong> (B) is locked in.</p>
        </div>
        <div className="variantRow">
          <div className="variantCard">
            <div className="tag">A · Light</div>
            <div className="demo"><Mushroom variant="light" size={140} /></div>
            <h4>Clean &amp; flat</h4>
            <div className="desc">
              Hand-drawn outline, solid fills, no paper texture. Crispest
              read at small sizes. Feels like a sticker book.
            </div>
          </div>
          <div className="variantCard picked">
            <div className="tag">B · Medium</div>
            <div className="demo"><Mushroom variant="medium" size={140} /></div>
            <h4>Watercolour wash</h4>
            <div className="desc">
              Gradient fills, subtle edge bleed. Painted but tidy. Reads
              clearly on full-bleed scenes. <strong>Locked.</strong>
            </div>
          </div>
          <div className="variantCard">
            <div className="tag">C · Heavy</div>
            <div className="demo"><Mushroom variant="heavy" size={140} /></div>
            <h4>Paper &amp; grain</h4>
            <div className="desc">
              Visible bleed, paper grain inside fills. Most "real picture
              book" — risks getting busy with many counters on screen.
            </div>
          </div>
        </div>
      </section>

      {/* ─── 03 · Counters ───────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">03.</span>
          <h2>The six counters</h2>
          <p>Uniform visual weight — 3 + 2 reads cleanly whichever counter the round uses. <span className="stamp" style={{ marginLeft: 6 }}>locked</span></p>
        </div>
        <div className="counterGrid">
          {COUNTERS.map(({ Comp, name }) => (
            <div className="counterCell" key={name}>
              <div className="art">
                <Comp variant="medium" size={120} />
              </div>
              <div className="name">{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 04 · Backgrounds ────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">04.</span>
          <h2>Two scenes per theme</h2>
          <p>Same palette, different mood. The app cycles between them across the theme's rounds.</p>
        </div>
        <div className="bgRow">
          <div className="bgCard">
            <MeadowBackground />
            <div className="label">meadow</div>
          </div>
          <div className="bgCard">
            <PondBackground />
            <div className="label">pond</div>
          </div>
        </div>
      </section>

      {/* ─── 05 · In context ─────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">05.</span>
          <h2>How a round looks</h2>
          <p>A <code style={{ background: '#fff3d8', padding: '0 5px', borderRadius: 4 }}>fill-vis</code> exercise reskinned. Equation stays a constant, scene + counter swap per round.</p>
        </div>
        <div className="mockWrap">
          <ExerciseMock variant="medium" Counter={Bee} counterSize={70} counterOverlap={-14} />
          <div className="mockNotes">
            <h3>What changed vs. today</h3>
            <p>
              The white exercise card is gone — the scene is the card.
              Counters drop directly on the meadow. Numbers sit on a small
              paper banner so they stay readable against any scene.
            </p>
            <p>
              The numpad strip is rendered on cream paper so the bright
              scene doesn't fight the kid's input. Border &amp; shadow language
              comes from the outline ink, not a separate UI palette.
            </p>
            <ul className="pulls">
              <li>Background = full-bleed scene (no card frame)</li>
              <li>Counters drawn at one shared visual weight</li>
              <li>Equation banner: always cream paper, always Fredoka</li>
              <li>Numpad: paper buttons, charcoal outline, leaf-green ✓</li>
              <li>Theme touches graphics only — exercise logic untouched</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 06 · Next steps ─────────────────────────────────── */}
      <section>
        <div className="secHead">
          <span className="secNum">06.</span>
          <h2>If you like this, here's what's next</h2>
          <p>Each future theme is the same recipe with a new mood colour + 6 counters + 2 scenes.</p>
        </div>
        <div className="nextSteps">
          <div>
            <h3>Next themes (suggested)</h3>
            <ol>
              <li><strong>Pond / water</strong> — fish, frog, snail, dragonfly, lily, duck. Mood: water blue.</li>
              <li><strong>Space</strong> — rocket, planet, alien, moon, star, comet. Mood: deep navy.</li>
              <li><strong>Factory</strong> — gear, robot, crate, bolt, spring, lightbulb. Mood: warm grey.</li>
              <li><strong>School</strong> — pencil, book, apple, ruler, crayon, eraser. Mood: paper cream.</li>
              <li><strong>Bakery</strong> — bread, donut, cupcake, pretzel, cookie, jar. Mood: warm pink.</li>
              <li><strong>Farm</strong> — cow, chicken, pig, sheep, carrot, haystack. Mood: barn red.</li>
              <li><strong>Bedroom</strong> — teddy, pillow, alarm clock, slipper, book, star-light. Mood: dusky lilac.</li>
              <li><strong>Music</strong> — drum, trumpet, music note, tambourine, maraca, whistle. Mood: jazz plum.</li>
            </ol>
            <p style={{ fontFamily: 'Patrick Hand', fontSize: 15, color: '#6b5a44', marginTop: 10 }}>
              Each takes roughly the same effort as this Nature set. A
              theme runs for ~N rounds (you mentioned "a few"), then we
              shift. Cycle order is configurable.
            </p>
          </div>
          <div>
            <h3>Integration sketch</h3>
            <ol>
              <li>Add a <code>themes/</code> folder alongside <code>presentation/</code>. One module per theme, each exporting <code>{`{ name, moodColor, backgrounds[], counters[] }`}</code>.</li>
              <li>Replace <code>SCENES</code> in <code>scenes.ts</code> with a theme-aware <code>pickCounter(theme, sceneIndex)</code>.</li>
              <li>A small <code>ThemeRotator</code> in profile state tracks which theme is active &amp; how many rounds remain.</li>
              <li><code>SceneGroup</code> swaps its single-emoji span for the active counter SVG; <code>KidMode</code> wraps the exercise card in the active background.</li>
              <li>Hands &amp; abacus stay theme-agnostic — they live in <code>presentation/components/</code> as today.</li>
            </ol>
            <p style={{ fontFamily: 'Patrick Hand', fontSize: 15, color: '#6b5a44', marginTop: 10 }}>
              Nothing in the engine/curriculum needs to know themes exist.
              They're a presentation-layer concern only.
            </p>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer style={{
        marginTop: 60, paddingTop: 24,
        borderTop: '1.5px solid #c7b58a',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'Patrick Hand, cursive', color: '#6b5a44', fontSize: 14,
      }}>
        <span>Rekenen · theme system · v0.1</span>
        <span>made on a cream paper page · {new Date().toLocaleDateString('nl-NL')}</span>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
