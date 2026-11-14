import { useEffect, useMemo, useState } from 'react'
import { getExercise } from '../exercises/registry'
import { THEMES } from '../presentation/themes'
import type { AnswerDetail } from '../exercises/types'
import { rowToQuestion } from './model'
import type { EventRow, ResolvedScene } from './model'
import { btn, C, card } from './ui'

// ─── Replay ───────────────────────────────────────────────────────────────────
// Renders the stored question with the real exercise component, inside a frame
// the size of the child's window, dressed in the recorded theme / background /
// counter — a copy of KidMode's layout, minus its engine. Interactive: an
// answer here is judged and shown, never recorded or uploaded.
//
// The frame mirrors KidMode.tsx's structure (header row, centred 430-px column).
// Exercises size themselves from their container (no viewport units), so a
// sized box reproduces their layout; if KidMode's chrome changes, update here.

interface Props {
  row: EventRow
  scene: ResolvedScene
  viewport: { w: number; h: number }
  viewportRecorded: boolean
}

export function Replay({ row, scene, viewport, viewportRecorded }: Props) {
  const [allowApprox, setAllowApprox] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [outcome, setOutcome] = useState<{ correct: boolean; detail?: AnswerDetail } | null>(null)
  const [fit, setFit] = useState(true)
  const result = useMemo(() => rowToQuestion(row, allowApprox), [row, allowApprox, runKey])
  const [holder, setHolder] = useState<HTMLDivElement | null>(null)
  const avail = useWidth(holder)

  const restart = () => { setOutcome(null); setRunKey(k => k + 1) }

  if (result.kind === 'impossible') {
    return (
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Oefening tonen</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>{result.reason}</div>
        {!allowApprox && !row.meta && row.problem && (
          <button style={btn('quiet')} onClick={() => setAllowApprox(true)}>
            Benadering tonen (zelfde probleem, nieuwe willekeurige opmaak)
          </button>
        )}
      </div>
    )
  }

  const theme = THEMES[scene.themeIdx]
  const ThemeDefs = theme.SharedDefs
  const { Background } = theme.backgrounds[scene.background]
  const Counter = theme.counters[scene.counter]
  const Exercise = getExercise(row.exercise_id).Component
  const scale = fit && avail ? Math.min(1, avail / viewport.w) : 1

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>
          Oefening zoals getoond
          <span style={{ fontWeight: 400, color: C.muted }}>
            {' '}· {viewport.w} × {viewport.h}{viewportRecorded ? '' : ' (standaard, niet opgenomen)'}
            {scale < 1 && ` · verkleind ${Math.round(scale * 100)}%`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btn('quiet')} onClick={() => setFit(f => !f)}>{fit ? '1:1' : 'Passend'}</button>
          <button style={btn('quiet')} onClick={restart}>↺ Opnieuw</button>
        </div>
      </div>

      {result.kind === 'approx' && (
        <div style={{ fontSize: 13, color: C.flag, marginBottom: 8 }}>
          Benadering: wat er toen getoond werd is niet bewaard. Zelfde probleem en niveau, maar keuzes en
          opmaak zijn nieuw geloot — niet noodzakelijk wat het kind zag.
        </div>
      )}

      <div style={{ fontSize: 13, marginBottom: 8, minHeight: 18 }}>
        {outcome
          ? <span style={{ color: outcome.correct ? C.good : C.bad, fontWeight: 700 }}>
              In de replay: {outcome.correct ? 'goed' : 'fout'}
              {outcome.detail?.givenAnswer !== undefined && ` (gegeven ${outcome.detail.givenAnswer})`}
              <span style={{ color: C.muted, fontWeight: 400 }}> — niet opgeslagen</span>
            </span>
          : <span style={{ color: C.muted }}>Je kunt de oefening zelf invullen; niets wordt opgeslagen.</span>}
      </div>

      <div ref={setHolder} style={{ width: '100%', overflowX: fit ? 'hidden' : 'auto' }}>
        <div style={{ width: viewport.w * scale, height: viewport.h * scale, position: 'relative', margin: '0 auto' }}>
          <div style={{
            width: viewport.w, height: viewport.h, transform: `scale(${scale})`, transformOrigin: 'top left',
            position: 'absolute', top: 0, left: 0, overflow: 'auto', borderRadius: 6,
            boxShadow: '0 0 0 1px rgba(0,0,0,.15)',
          }}>
            <div style={{ position: 'relative', minHeight: '100%' }}>
              <ThemeDefs />
              <Background style={{ position: 'absolute', inset: 0 }} />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 2,
                background: 'linear-gradient(180deg, rgba(61,47,30,0.35), transparent)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative', zIndex: 3, minHeight: viewport.h, boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '18px 14px 24px', fontFamily: 'Nunito, sans-serif',
              }}>
                {/* KidMode's header, inert — it takes the same room as in the app */}
                <div style={{ width: '100%', maxWidth: 430, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 22, fontFamily: 'Fredoka One, cursive', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}>
                    Rekenen 🧮
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.88)', border: '2px solid #3d2f1e', borderRadius: 14,
                    padding: '4px 10px 5px', fontFamily: 'Patrick Hand, cursive', fontSize: 13, color: '#3d2f1e',
                  }}>⚙️ Opties</div>
                </div>
                <div key={runKey} style={{
                  width: '100%', maxWidth: 430, flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
                }}>
                  <Exercise
                    question={result.question}
                    onResolve={(correct: boolean, detail?: AnswerDetail) => setOutcome(o => o ?? { correct, detail })}
                    disabled={!!outcome}
                    scene={{ Counter, tokens: theme.tokens }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Width of the element (a callback-ref'd node, so it attaches whenever it mounts).
function useWidth(el: HTMLDivElement | null): number {
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return w
}
