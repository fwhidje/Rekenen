import { useMemo } from 'react'
import type { SkillDefinition } from '../curriculum/types'
import { getExercise, getAllExerciseIds } from '../exercises/registry'
import { getWeights } from '../curriculum/weightMatrix'

// One-skill version of the offline balance diagram: tier bands per exercise
// (top half of each row) and the lerped weight curve from weightMatrix.ts
// (bottom half), with a vertical marker at the current debug score.

const TIER_COLORS = ['#cfe5f3', '#d8ecd1', '#fbe2b9', '#f3c8c8', '#e1d2ef']
const WEIGHT_FILL = '#2a6b8a'
const TEXT  = '#3d2f1e'
const MUTED = '#8a795f'
const GRID  = '#d8cfb8'
const MARK  = '#c14b3a'

const W = 430
const LABEL_W = 138
const NUM_W = 50
const SCORE_W = W - LABEL_W - NUM_W - 8
const ROW_H = 36
const TIER_H = 15
const WEIGHT_H = 15
const HEADER_H = 6
const AXIS_H = 16

interface Props {
  skill: SkillDefinition
  score: number
}

const N_SAMPLES = 21   // every 5 score-points across 0–100

export function SkillBalance({ skill, score }: Props) {
  const { rows, samples, maxWeight } = useMemo(() => {
    const registered = new Set(getAllExerciseIds())
    const ids = skill.applicableExercises.filter(id => registered.has(id))
    const samples = Array.from({ length: N_SAMPLES }, (_, i) => {
      const s = (i / (N_SAMPLES - 1)) * 100
      return { score: s, weights: getWeights(skill.id, s) }
    })
    const rows = ids.map(id => ({ id, tiers: getExercise(id).tiers }))
    let mw = 50
    for (const sp of samples) for (const r of rows) mw = Math.max(mw, sp.weights[r.id] ?? 0)
    return { rows, samples, maxWeight: mw }
  }, [skill])

  const totalH = HEADER_H + AXIS_H + rows.length * ROW_H + 8
  const xOf = (s: number) => LABEL_W + (s / 100) * SCORE_W
  const sc = WEIGHT_H / maxWeight
  const markerX = xOf(score)
  const gridBottom = HEADER_H + AXIS_H + rows.length * ROW_H

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${totalH}`} style={{ display: 'block' }}>
      {/* Axis ticks + vertical grid */}
      {[0, 25, 50, 75, 100].map(t => {
        const x = xOf(t)
        return (
          <g key={t}>
            <line x1={x} y1={HEADER_H + AXIS_H - 2} x2={x} y2={gridBottom}
              stroke={GRID} strokeDasharray={t === 0 || t === 100 ? '' : '2,3'} />
            <text x={x} y={HEADER_H + 10} fontFamily="monospace" fontSize="9"
              textAnchor="middle" fill={MUTED}>{t}</text>
          </g>
        )
      })}

      {/* Current-score marker */}
      <line x1={markerX} y1={HEADER_H + AXIS_H - 2} x2={markerX} y2={gridBottom}
        stroke={MARK} strokeWidth="1.5" />
      <text x={markerX} y={HEADER_H + 10} fontFamily="monospace" fontSize="9"
        textAnchor="middle" fill={MARK} fontWeight="700">▼{score}</text>

      {rows.map((r, idx) => {
        const y = HEADER_H + AXIS_H + idx * ROW_H
        const tierY = y + 2
        const stripY = tierY + TIER_H + 2
        const baseY = stripY + WEIGHT_H
        const w0 = samples[0].weights[r.id] ?? 0
        const w100 = samples[samples.length - 1].weights[r.id] ?? 0
        const peak = samples.reduce((m, sp) => Math.max(m, sp.weights[r.id] ?? 0), 0)
        const hasWeight = peak > 0
        const topPts = samples
          .map(sp => `${xOf(sp.score)},${baseY - Math.min(maxWeight, sp.weights[r.id] ?? 0) * sc}`)
          .join(' ')
        return (
          <g key={r.id}>
            <text x={LABEL_W - 6} y={y + ROW_H / 2 + 3} fontFamily="Nunito, sans-serif"
              fontSize="10" fontWeight="700" textAnchor="end" fill={TEXT}>{r.id}</text>

            {r.tiers.map((t, i) => {
              const start = t.minScore
              const end = i + 1 < r.tiers.length ? r.tiers[i + 1].minScore : 100
              const x = xOf(start)
              const w = xOf(end) - x
              return (
                <g key={t.id}>
                  <rect x={x} y={tierY} width={w} height={TIER_H}
                    fill={TIER_COLORS[i % TIER_COLORS.length]} stroke="#ffffff" strokeWidth="1" />
                  {w >= 30 && (
                    <text x={x + w / 2} y={tierY + 11} fontFamily="Nunito, sans-serif"
                      fontSize="9" textAnchor="middle" fill={TEXT}>{t.label}</text>
                  )}
                </g>
              )
            })}

            <rect x={LABEL_W} y={stripY} width={SCORE_W} height={WEIGHT_H}
              fill="#faf6e8" stroke={GRID} />
            {hasWeight ? (
              <polygon
                points={`${LABEL_W},${baseY} ${topPts} ${LABEL_W + SCORE_W},${baseY}`}
                fill={WEIGHT_FILL} fillOpacity="0.55" stroke={WEIGHT_FILL} strokeWidth="1" />
            ) : (
              <text x={LABEL_W + SCORE_W / 2} y={stripY + WEIGHT_H / 2 + 3}
                fontFamily="Nunito, sans-serif" fontSize="9" textAnchor="middle"
                fill={MUTED} fontStyle="italic">geen gewicht</text>
            )}

            <text x={LABEL_W + SCORE_W + 6} y={y + ROW_H / 2 + 3} fontFamily="monospace"
              fontSize="10" fill={hasWeight ? WEIGHT_FILL : MUTED} fontWeight="700">
              {w0 === w100 ? w0 : `${w0}→${w100}`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
