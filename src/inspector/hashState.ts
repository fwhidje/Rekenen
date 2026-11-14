import type { Filter, Period, View } from './model'
import { PERIOD_LABELS, VIEW_LABELS } from './model'

// ─── URL state ────────────────────────────────────────────────────────────────
// Filters and the selected answer live in the URL hash, so a view can be
// bookmarked or reopened after a reload. Ids only — never a child's name.

export interface HashState {
  child: string | null
  period: Period
  filter: Filter
  id: string | null
}

export function readHash(): HashState {
  const p = new URLSearchParams(window.location.hash.slice(1))
  const period = p.get('p') as Period | null
  const view = p.get('v') as View | null
  return {
    child: p.get('c'),
    period: period && period in PERIOD_LABELS ? period : '30',
    filter: {
      view: view && view in VIEW_LABELS ? view : 'review',
      exercise: p.get('e'),
      skill: p.get('s'),
    },
    id: p.get('id'),
  }
}

export function writeHash(s: HashState): void {
  const p = new URLSearchParams()
  if (s.child) p.set('c', s.child)
  p.set('p', s.period)
  p.set('v', s.filter.view)
  if (s.filter.exercise) p.set('e', s.filter.exercise)
  if (s.filter.skill) p.set('s', s.filter.skill)
  if (s.id) p.set('id', s.id)
  window.history.replaceState(null, '', `#${p.toString()}`)
}
