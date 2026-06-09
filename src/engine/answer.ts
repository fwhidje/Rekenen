import type { Problem } from '../curriculum/types'

export function computeAnswer(p: Problem): number {
  switch (p.op) {
    case '+':     return p.terms[0] + p.terms[1]
    case '-':     return p.whole - p.part
    case 'split': return p.partA + p.partB   // total of the two parts
    case 'count': return p.n                 // for getalbegrip, the value itself
    case 'half':  return p.total / 2
  }
}

// Legacy positional view of a problem, for the existing exercise components
// that read operandA/operandB. New exercises consume `question.problem`.
export function problemOperands(p: Problem): { a: number; b: number } {
  switch (p.op) {
    case '+':     return { a: p.terms[0], b: p.terms[1] }
    case '-':     return { a: p.whole, b: p.part }
    case 'split': return { a: p.partA, b: p.partB }
    case 'count': return { a: p.n, b: 0 }
    case 'half':  return { a: p.total, b: p.total / 2 }
  }
}
