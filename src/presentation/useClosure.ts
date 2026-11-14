import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnswerDetail } from '../exercises/types'
import { FEEDBACK } from './feedback'

// ─── Closure: how every exercise hands its answer to the engine ──────────────
// Convention (CLAUDE.md → Exercise behaviour conventions):
//   • correct → the exercise shows its COMPLETED state (the "?" filled with the
//     answer, the chosen card marked) and holds it for FEEDBACK.closureMs, then
//     resolves. Without the hold the full-screen overlay covers the finished
//     sum before the child has seen it.
//   • wrong   → resolves at once (the overlay names the correct fact; the retry
//     follows).
// Exercises call `resolve` instead of `onResolve`, read `solved` to draw the
// completed state and `answered` to lock their inputs during the hold.
// A second `resolve` for the same question is ignored.

export function useClosure(
  question: unknown,
  onResolve: (correct: boolean, detail?: AnswerDetail) => void,
) {
  const [solved, setSolved] = useState(false)
  const [answered, setAnswered] = useState(false)
  const done = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The parent's handler changes identity between renders; the timer must call
  // the current one.
  const latest = useRef(onResolve)
  latest.current = onResolve

  useEffect(() => {
    done.current = false
    setSolved(false)
    setAnswered(false)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [question])

  const resolve = useCallback((correct: boolean, detail?: AnswerDetail) => {
    if (done.current) return
    done.current = true
    setAnswered(true)
    if (correct) {
      setSolved(true)
      timer.current = setTimeout(() => latest.current(true, detail), FEEDBACK.closureMs)
    } else {
      latest.current(false, detail)
    }
  }, [])

  return { solved, answered, resolve }
}
