import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { client, fetchBackup, fetchChildren, fetchEvents } from './data'
import {
  applyFilter, linkRetries, periodStart, summarise,
  PERIOD_LABELS, VIEW_LABELS,
} from './model'
import type { Child, EventRow, Filter, Period, View } from './model'
import { EventList } from './EventList'
import { EventDetail } from './EventDetail'
import { readHash, writeHash } from './hashState'
import { btn, C, card, input } from './ui'

// ─── Inspector ────────────────────────────────────────────────────────────────
// Separate page (inspector.html) for reading the account's answer stream:
// filter to wrong / flagged answers, see a row's evidence, replay the exercise
// as it was served. Shares the login with the app, nothing else at runtime.

export function Inspector() {
  if (!client) {
    return <Shell><div style={card}>
      Deze build heeft geen account-backend (de variabelen <code>VITE_SUPABASE_URL</code> /
      <code> VITE_SUPABASE_KEY</code> ontbreken). Er is niets om in te kijken.
    </div></Shell>
  }
  return <AuthGate />
}

function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    void client!.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = client!.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (session === undefined) return <Shell><div style={{ color: C.muted }}>Laden…</div></Shell>
  if (!session) return <Shell><Login /></Shell>
  return <Main email={session.user.email ?? ''} />
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await client!.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    setPassword('')
    setError(error ? 'Inloggen mislukt — controleer e-mail en wachtwoord.' : null)
  }
  return (
    <form onSubmit={submit} style={{ ...card, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 4 }}>
        Log in met het ouderaccount van de app. Je ziet alleen de kinderen van dat account.
      </div>
      <input style={input} type="email" placeholder="E-mail" autoComplete="username"
        value={email} onChange={e => setEmail(e.target.value)} />
      <input style={input} type="password" placeholder="Wachtwoord" autoComplete="current-password"
        value={password} onChange={e => setPassword(e.target.value)} />
      {error && <div style={{ color: C.bad, fontSize: 13 }}>{error}</div>}
      <button type="submit" disabled={busy || !email || !password} style={btn('primary')}>
        {busy ? 'Bezig…' : 'Inloggen'}
      </button>
    </form>
  )
}

function Main({ email }: { email: string }) {
  const initial = useMemo(readHash, [])
  const [children, setChildren] = useState<Child[] | null>(null)
  const [childId, setChildId] = useState<string | null>(initial.child)
  const [period, setPeriod] = useState<Period>(initial.period)
  const [filter, setFilter] = useState<Filter>(initial.filter)
  const [selectedId, setSelectedId] = useState<string | null>(initial.id)
  const [rows, setRows] = useState<EventRow[]>([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const wide = useWide()

  useEffect(() => {
    fetchChildren(client!).then(list => {
      setChildren(list)
      setChildId(id => (id && list.some(c => c.id === id) ? id : list[0]?.id ?? null))
    }).catch(e => setError(String(e.message ?? e)))
  }, [])

  useEffect(() => {
    if (!childId) return
    setLoading(true)
    setError(null)
    fetchEvents(client!, { childId, since: periodStart(period) })
      .then(r => { setRows(r.rows); setTruncated(r.truncated) })
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [childId, period, reloadTick])

  useEffect(() => {
    writeHash({ child: childId, period, filter, id: selectedId })
  }, [childId, period, filter, selectedId])

  const links = useMemo(() => linkRetries(rows), [rows])
  const visible = useMemo(() => applyFilter(rows, filter), [rows, filter])
  const summary = useMemo(() => summarise(rows), [rows])
  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows])
  const selected = selectedId ? byId.get(selectedId) ?? null : null

  // j / k (or ↓ / ↑) walk the visible list on a keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return
      const step = e.key === 'j' || e.key === 'ArrowDown' ? 1 : e.key === 'k' || e.key === 'ArrowUp' ? -1 : 0
      if (!step || visible.length === 0) return
      e.preventDefault()
      const i = visible.findIndex(r => r.id === selectedId)
      const next = visible[Math.max(0, Math.min(visible.length - 1, i < 0 ? 0 : i + step))]
      setSelectedId(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, selectedId])

  const exerciseOptions = useMemo(() => [...new Set(rows.map(r => r.exercise_id))].sort(), [rows])
  const skillOptions = useMemo(() => [...new Set(rows.map(r => r.skill_id))].sort(), [rows])

  const header = (
    <Header email={email} />
  )

  const filters = (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children && children.length === 0 && (
        <div style={{ color: C.muted, fontSize: 14 }}>Dit account heeft nog geen kinderen in de cloud.</div>
      )}
      {children && children.length > 1 && (
        <Labeled label="Kind">
          <select style={input} value={childId ?? ''} onChange={e => { setChildId(e.target.value); setSelectedId(null) }}>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Labeled>
      )}
      <Labeled label="Periode">
        <select style={input} value={period} onChange={e => setPeriod(e.target.value as Period)}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
        </select>
      </Labeled>
      <Labeled label="Toon">
        <select style={input} value={filter.view} onChange={e => setFilter(f => ({ ...f, view: e.target.value as View }))}>
          {(Object.keys(VIEW_LABELS) as View[]).map(v => <option key={v} value={v}>{VIEW_LABELS[v]}</option>)}
        </select>
      </Labeled>
      <Labeled label="Oefening">
        <select style={input} value={filter.exercise ?? ''} onChange={e => setFilter(f => ({ ...f, exercise: e.target.value || null }))}>
          <option value="">alle</option>
          {exerciseOptions.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Labeled>
      <Labeled label="Vaardigheid">
        <select style={input} value={filter.skill ?? ''} onChange={e => setFilter(f => ({ ...f, skill: e.target.value || null }))}>
          <option value="">alle</option>
          {skillOptions.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Labeled>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: C.muted }}>
        <span>
          {loading ? 'Laden…' : `${visible.length} van ${rows.length} antwoorden`}
          {truncated && ' · afgekapt, kies een kortere periode'}
        </span>
        <button style={btn('quiet')} onClick={() => setReloadTick(t => t + 1)}>↻ Vernieuwen</button>
      </div>
      {error && <div style={{ color: C.bad, fontSize: 13 }}>Fout bij laden: {error}</div>}
    </div>
  )

  const list = (
    <EventList
      rows={visible}
      summary={summary}
      links={links}
      selectedId={selectedId}
      onSelect={setSelectedId}
      exerciseFilter={filter.exercise}
      onExerciseFilter={ex => setFilter(f => ({ ...f, exercise: ex }))}
    />
  )

  const detail = selected
    ? <EventDetail row={selected} links={links} onSelect={setSelectedId}
        onClose={wide ? undefined : () => setSelectedId(null)} />
    : <div style={{ ...card, color: C.muted }}>Kies een antwoord in de lijst.</div>

  if (!wide) {
    return (
      <Shell header={header}>
        {selected ? detail : <>{filters}{list}</>}
      </Shell>
    )
  }
  return (
    <Shell header={header} wide>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 440px) 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>{filters}{list}</div>
        <div style={{ position: 'sticky', top: 12, minWidth: 0 }}>{detail}</div>
      </div>
    </Shell>
  )
}

function Header({ email }: { email: string }) {
  const [backup, setBackup] = useState<'idle' | 'busy' | string>('idle')
  const download = async () => {
    setBackup('busy')
    try {
      const data = await fetchBackup(client!)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `rekenen-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      setBackup('idle')
    } catch (e) {
      setBackup(`Back-up mislukt: ${(e as Error).message}`)
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div>
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: C.ink }}>📖 Gegevens</div>
        <div style={{ fontSize: 12, color: C.muted }}>{email}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={btn('quiet')} onClick={() => { void download() }} disabled={backup === 'busy'}
          title="Alles wat dit account in de cloud heeft, als één JSON-bestand">
          {backup === 'busy' ? 'Bezig…' : '⬇ Back-up (JSON)'}
        </button>
        <button style={btn('quiet')} title="Logt ook de app in deze browser uit"
          onClick={() => { void client!.auth.signOut() }}>Uitloggen</button>
        <a href={import.meta.env.BASE_URL} style={{ ...btn('quiet'), textDecoration: 'none' }}>← Naar de app</a>
      </div>
      {backup !== 'idle' && backup !== 'busy' && (
        <div style={{ width: '100%', color: C.bad, fontSize: 13 }}>{backup}</div>
      )}
    </div>
  )
}

function Shell({ children, header, wide }: { children: React.ReactNode; header?: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ minHeight: '100%', background: C.bg, fontFamily: 'Nunito, sans-serif', color: C.ink }}>
      <div style={{ maxWidth: wide ? 1400 : 640, margin: '0 auto', padding: '16px 16px 40px', boxSizing: 'border-box' }}>
        {header ?? <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, marginBottom: 12 }}>📖 Gegevens</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
      </div>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
      <span>{label}</span>{children}
    </label>
  )
}

function useWide(): boolean {
  const query = '(min-width: 900px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  const onChange = useCallback((e: MediaQueryListEvent) => setWide(e.matches), [])
  useEffect(() => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [onChange])
  return wide
}
