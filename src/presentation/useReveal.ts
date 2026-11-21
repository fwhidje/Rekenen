import { useState, useEffect, useRef, useCallback } from 'react'
import { noteReplay } from './replays'

// delays: ms to wait before each step becomes active.
// step 0 = initial (nothing shown). step N = Nth element visible.
// Pass an empty array for instant reveal (complete = true immediately).
//
// `replay` plays the reveal again from step 0 (the ↻ button, convention V) and
// notes it against `resetKey` — the question — so the answer carries the count.
// An exercise with animation state of its own (a hop, a pairing) resets that
// in the same click.
export function useReveal(delays: number[], resetKey: unknown): { step: number; complete: boolean; replay: () => void } {
  const [step, setStep] = useState(0)
  const [run, setRun] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setStep(0)

    if (delays.length === 0) return

    let elapsed = 0
    delays.forEach((delay, i) => {
      elapsed += delay
      const t = setTimeout(() => setStep(i + 1), elapsed)
      timersRef.current.push(t)
    })

    return () => { timersRef.current.forEach(clearTimeout) }
  // resetKey changes on every new question; delays is stable per exercise type
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, run])

  const replay = useCallback(() => {
    noteReplay(resetKey)
    setRun(r => r + 1)
  }, [resetKey])

  return { step, complete: delays.length === 0 || step >= delays.length, replay }
}
