import { useState, useEffect, useRef } from 'react'

// delays: ms to wait before each step becomes active.
// step 0 = initial (nothing shown). step N = Nth element visible.
// Pass an empty array for instant reveal (complete = true immediately).
export function useReveal(delays: number[], resetKey: unknown): { step: number; complete: boolean } {
  const [step, setStep] = useState(0)
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
  }, [resetKey])

  return { step, complete: delays.length === 0 || step >= delays.length }
}
