import type { Operation } from '../curriculum/types'

export function computeAnswer(a: number, b: number, op: Operation): number {
  switch (op) {
    case '+':     return a + b
    case '-':     return a - b
    case 'split': return a + b   // total of the two parts
    case 'count': return a       // for getalbegrip, the value itself
    case 'half':  return b       // generator returns a=total, b=half
  }
}
