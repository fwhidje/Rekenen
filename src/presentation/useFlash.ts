import { useCallback, useEffect, useRef, useState } from 'react'
import { noteReplay } from './replays'

// ─── Flash: an aid that is shown for a set time, then covered ────────────────
// For pictures (and facts) that must be SEEN, not counted or read off at
// leisure (skill map → Exercise design for the next set, shared rule 1). The
// thing itself never leaves the layout — the caller covers it while `showing`
// is false — so nothing on screen moves (convention L).
//
//   showing  the aid is visible right now
//   seen     the first showing is over: the question may be answered
//   replay   show it once more; the count is reported as `replays`
//
// `start` gates the first showing (wait for a reveal to finish). With `hold`
// the aid simply stays (a retry: the same question with more help) and `seen`
// is true as soon as it has started.

export function useFlash(ms: number, resetKey: unknown, opts: { start?: boolean; hold?: boolean } = {}) {
  const { start = true, hold = false } = opts
  const [showing, setShowing] = useState(false)
  const [seen, setSeen] = useState(false)
  const [replays, setReplays] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }

  const show = useCallback(() => {
    clear()
    setShowing(true)
    if (hold) { setSeen(true); return }
    timer.current = setTimeout(() => { setShowing(false); setSeen(true) }, ms)
  }, [ms, hold])

  useEffect(() => {
    clear()
    setShowing(false); setSeen(false); setReplays(0)
    return clear
  }, [resetKey])

  useEffect(() => {
    if (start) show()
  // a new question resets (above) and then starts again when `start` holds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, resetKey])

  const replay = useCallback(() => {
    noteReplay(resetKey)
    setReplays(r => r + 1)
    show()
  }, [show, resetKey])

  return { showing, seen, replay, replays }
}
