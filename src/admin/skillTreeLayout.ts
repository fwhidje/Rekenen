import type { Operation, SkillDefinition } from '../curriculum/types'
import { SKILLS } from '../curriculum/skills'

// ─── Skill tree layout (admin tool) ───────────────────────────────────────────
// Derived from the curriculum graph, never hand-placed, so a new skill shows up
// in the progress-override tree without touching this file.
//
//   row    = depth = longest prerequisite chain from a root (roots are 0)
//   order  = within a row, by the mean x of the skill's parents (barycenter —
//            pulls children under their parents, fewer crossing edges), ties
//            broken by track (getalbegrip → splitsen → + → helften → −), then
//            curriculum order.
//
// x is the node's centre as a fraction of the width (0–1), evenly spread over
// the row: (i + 0.5) / rowLength.

export interface TreeNode {
  id: string
  row: number
  x: number
}

export interface TreeEdge {
  from: string   // prerequisite
  to: string     // the skill it unlocks
}

export interface SkillTreeLayout {
  nodes: TreeNode[]
  edges: TreeEdge[]
  rows: string[][]
}

const TRACK_ORDER: Operation[] = ['count', 'split', '+', 'half', '-']

export function layoutSkillTree(skills: SkillDefinition[] = SKILLS): SkillTreeLayout {
  const byId = new Map(skills.map(s => [s.id, s]))
  const index = new Map(skills.map((s, i) => [s.id, i]))

  const depth = new Map<string, number>()
  const depthOf = (id: string, seen: Set<string> = new Set()): number => {
    const cached = depth.get(id)
    if (cached !== undefined) return cached
    if (seen.has(id)) throw new Error(`skillTreeLayout: prerequisite cycle at '${id}'`)
    seen.add(id)
    const prereqs = (byId.get(id)?.unlockedBy ?? []).filter(p => byId.has(p))
    const d = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(p => depthOf(p, seen)))
    depth.set(id, d)
    return d
  }
  for (const s of skills) depthOf(s.id)

  const rowCount = Math.max(0, ...depth.values()) + 1
  const rows: string[][] = Array.from({ length: rowCount }, () => [])
  for (const s of skills) rows[depth.get(s.id)!].push(s.id)

  const x = new Map<string, number>()
  rows.forEach(row => {
    const bary = (id: string) => {
      const ps = (byId.get(id)?.unlockedBy ?? []).filter(p => x.has(p))
      return ps.length === 0 ? 0.5 : ps.reduce((sum, p) => sum + x.get(p)!, 0) / ps.length
    }
    const track = (id: string) => TRACK_ORDER.indexOf(byId.get(id)!.op)
    const keyed = row.map(id => ({ id, b: bary(id), t: track(id), i: index.get(id)! }))
    keyed.sort((a, b) => (a.b - b.b) || (a.t - b.t) || (a.i - b.i))
    row.splice(0, row.length, ...keyed.map(k => k.id))
    row.forEach((id, i) => x.set(id, (i + 0.5) / row.length))
  })

  const nodes: TreeNode[] = skills.map(s => ({ id: s.id, row: depth.get(s.id)!, x: x.get(s.id)! }))
  const edges: TreeEdge[] = skills.flatMap(s =>
    s.unlockedBy.filter(p => byId.has(p)).map(p => ({ from: p, to: s.id })),
  )
  return { nodes, edges, rows }
}
