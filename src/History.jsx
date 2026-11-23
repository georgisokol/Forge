import { useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { CATEGORIES, HIIT_EXERCISES, HIIT_WORK, catInfo, chipLabel, loadLabel, fmtSet, isIntervalWorkout, isTimed, levelLabel, totalReps } from './data.js'
import { getDaily, getHistory, getUid } from './storage.js'
import { dayKey, streakInfo } from './daily.js'
import Header from './Header.jsx'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'

// Custom (non-shuffler, non-interval) workouts live in Weight Progress, with or without weights.
const isCustom = (w) => !CATEGORIES[w.category] && !isIntervalWorkout(w)
const maxWeight = (sets) => Math.max(0, ...sets.map((x) => x.weight ?? 0))

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })

const TrendIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18l6-6 4 4 8-9M15 7h6v6" />
  </svg>
)

// Short name for the neighbour hints; the title above the slide uses the full name.
const SLIDES = [
  { id: 'log', title: 'Log', short: 'Log' },
  { id: 'graph', title: 'Shuffler Progress', short: 'Shuffler', icon: true },
  { id: 'weight', title: 'Weight Progress', short: 'Weight', icon: true },
  { id: 'cardio', title: 'Cardio Progress', short: 'Cardio', icon: true },
  { id: 'interval', title: 'Interval Progress', short: 'Interval', icon: true },
  { id: 'daily', title: 'Daily Challenge', short: 'Daily' },
]

const RESET = { background: 'none', border: 'none', padding: 0, boxShadow: 'none', minHeight: 0, minWidth: 0 }

function Hint({ slide, side, onClick }) {
  if (!slide) return <span className="flex-1" />
  const label = <span className="flex items-center gap-1">{slide.icon && <TrendIcon size={14} />}{slide.short}</span>
  return (
    <button type="button" onClick={onClick} style={RESET} className={`muted flex flex-1 items-center gap-1 text-xs ${side === 'right' ? 'justify-end' : ''}`} aria-label={`Show ${slide.title}`}>
      {side === 'left' && '‹'}{label}{side === 'right' && '›'}
    </button>
  )
}

function DailyProgress() {
  const done = useMemo(() => new Set(getDaily().done), [])
  const { current, best, last } = useMemo(() => streakInfo(), [])
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const today = dayKey()
  const first = (month.getDay() + 6) % 7 // Monday-first grid
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length }, (_, i) => dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1)))]
  const step = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const nav = { background: 'none', border: 'none', boxShadow: 'none', minHeight: 0, minWidth: 0, padding: '0 10px', fontSize: '1.4rem', color: 'var(--yellow)' }
  return (
    <>
      <div className="stats">
        <Card className="stat"><b>{current}</b>Streak</Card>
        <Card className="stat"><b>{current === 0 ? last : best}</b>{current === 0 ? 'Last streak' : 'Best'}</Card>
        <Card className="stat"><b>{done.size}</b>Days done</Card>
      </div>
      <Card>
        <div className="flex items-center justify-between pb-3">
          <button type="button" style={nav} aria-label="Previous month" onClick={() => step(-1)}>‹</button>
          <h2 className="label" style={{ margin: 0 }}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          <button type="button" style={nav} aria-label="Next month" onClick={() => step(1)}>›</button>
        </div>
        <div className="cal">
          {cells.map((k, i) => k === null
            ? <span key={`e${i}`} />
            : <div key={k} className={`cal-day${done.has(k) ? ' done' : ''}${k === today ? ' today' : ''}${k > today ? ' future' : ''}`}>{Number(k.slice(8))}</div>)}
        </div>
      </Card>
    </>
  )
}

export default function History({ onBack, slide = 'log' }) {
  const history = useMemo(() => [...getHistory()].reverse(), [])
  const hasWeighted = useMemo(() => history.some(isCustom), [history])
  const slides = useMemo(() => SLIDES.filter((x) => x.id !== 'weight' || hasWeighted), [hasWeighted])
  const [index, setIndex] = useState(() => Math.max(0, slides.findIndex((x) => x.id === slide)))
  const [dir, setDir] = useState(0)
  const touch = useRef(null)

  // Each slide is its own page: only the active one is rendered, and a horizontal swipe switches pages.
  const goTo = (i) => {
    if (i < 0 || i >= slides.length || i === index) return
    setDir(i > index ? 1 : -1)
    setIndex(i)
  }
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    const start = touch.current
    touch.current = null
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1))
  }

  const content = {
    log: history.length === 0 ? <p className="muted">No workouts yet.</p> : <Log history={history} />,
    graph: <Graph history={history} weighted={false} />,
    weight: <Graph history={history} weighted />,
    cardio: <Cardio history={history} />,
    interval: <IntervalProgress history={history} />,
    daily: <DailyProgress />,
  }
  const current = slides[index] ?? slides[0]

  return (
    <div className="screen">
      <Header title="History" onBack={onBack} />
      <div>
        <h2 className="m-0 flex items-center justify-center gap-1.5 whitespace-nowrap font-[family-name:var(--display)] text-xl uppercase tracking-[0.06em] text-[var(--yellow)]">
          {current.icon && <TrendIcon />}{current.title}
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <Hint slide={slides[index - 1]} side="left" onClick={() => goTo(index - 1)} />
          <div className="flex justify-center gap-2">
            {slides.map((x, i) => (
              <button key={x.id} type="button" aria-label={x.title} onClick={() => goTo(i)} style={{ ...RESET, height: 8, width: i === index ? 20 : 8, background: i === index ? 'var(--yellow)' : 'var(--line)' }} className="rounded-full transition-all" />
            ))}
          </div>
          <Hint slide={slides[index + 1]} side="right" onClick={() => goTo(index + 1)} />
        </div>
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ touchAction: 'pan-y', overflow: 'hidden', minHeight: '60vh' }}>
        <section key={current.id} className={`slide page-in flex flex-col gap-3.5 pb-6 ${dir > 0 ? 'from-right' : dir < 0 ? 'from-left' : ''}`} style={{ maxWidth: '100%' }}>
          {content[current.id]}
        </section>
      </div>
    </div>
  )
}

// Most recent set of the same exercise in an older workout (history is newest-first).
const previousSet = (history, index, exercise) => {
  for (const w of history.slice(index + 1)) {
    const match = w.sets.findLast((x) => x.exercise === exercise)
    if (match) return match
  }
  return null
}

const Delta = ({ value }) => {
  if (!value) return null
  return <span style={{ color: value > 0 ? '#3fb950' : '#d0556a' }}> ({value > 0 ? '+' : ''}{+value.toFixed(2)})</span>
}

function SetText({ x, prev, custom }) {
  const repDelta = prev ? x.actual - prev.actual : 0
  const weightDelta = prev && x.weight != null && prev.weight != null ? x.weight - prev.weight : 0
  if (!custom) return <>{fmtSet(x)}<Delta value={repDelta} /> · {x.status === 'done' ? 'Banked' : 'Failed'}</>
  return (
    <>
      {x.actual}{isTimed(x) ? 's' : ' reps'}<Delta value={repDelta} />
      {x.weight != null && <> @ {x.weight}kg<Delta value={weightDelta} /></>}
    </>
  )
}

function Log({ history }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="log">
    <Table>
      <TableHeader>
        <TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Level</TableHead><TableHead className="w-12" /></TableRow>
      </TableHeader>
      <TableBody>
        {history.map((w, i) => (
          <Row key={w.id} w={w} history={history} index={i} open={open === w.id} toggle={() => setOpen(open === w.id ? null : w.id)} />
        ))}
      </TableBody>
    </Table>
    </div>
  )
}

function Row({ w, history, index, open, toggle }) {
  const c = catInfo(w)
  return (
    <>
      <TableRow className="cursor-pointer" data-state={open ? 'open' : 'closed'} onClick={toggle}>
        <TableCell className="whitespace-nowrap">{fmtDate(w.date)}</TableCell>
        <TableCell>
          <Badge className="whitespace-nowrap" style={{ '--c': c.color }}>{chipLabel(w)}</Badge>
          {w.group && <div className="with-tag">with {w.group.participants.filter((p) => p.uid !== getUid()).map((p) => p.name).join(', ')}</div>}
        </TableCell>
        <TableCell className="log-level">
          {levelLabel(w)}
          {loadLabel(w.sets) && <div className="with-tag">{loadLabel(w.sets)}</div>}
        </TableCell>
        <TableCell className="pl-2 pr-5 text-[var(--muted)]">{open ? '▾' : '▸'}</TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-[var(--bg)]/40">
          <TableCell colSpan={4} className="py-2">
            {w.sets.map((x, i) => (
              <div key={i} className="flex justify-between gap-2.5 py-2 text-sm">
                <span>{i + 1}. {x.exercise}</span>
                <span className={x.status}><SetText x={x} prev={previousSet(history, index, x.exercise)} custom={!CATEGORIES[w.category]} /></span>
              </div>
            ))}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// Marker shape per level: circle / square / diamond, so level is visible on each point.
const Marker = ({ cx, cy, payload, levelKey, color }) => {
  if (cx == null || cy == null || payload[levelKey] == null) return null
  const level = payload[levelKey]
  if (level === 'beginner' || level === 'easy' || level === 'custom') return <circle cx={cx} cy={cy} r={4} fill={color} />
  if (level === 'intermediate') return <rect x={cx - 5} y={cy - 5} width={10} height={10} fill={color} />
  return <polygon points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`} fill={color} />
}

const hiitRounds = (w) => +(w.sets.length / HIIT_EXERCISES.length).toFixed(1)
const fmtMinutes = (seconds) => `${Math.round(seconds / 60)} min`

function Cardio({ history }) {
  const sessions = useMemo(() => history.filter((w) => w.category === 'hiit'), [history])
  if (sessions.length === 0) return <p className="muted">No HIIT workouts yet.</p>
  const chrono = [...sessions].reverse()
  const totalRounds = +sessions.reduce((a, w) => a + hiitRounds(w), 0).toFixed(1)
  const activeSeconds = sessions.reduce((a, w) => a + w.sets.length * HIIT_WORK, 0)
  const best = Math.max(...sessions.map(hiitRounds))
  const data = chrono.map((w) => ({ date: fmtDate(w.date), rounds: hiitRounds(w) }))
  const color = CATEGORIES.hiit.color
  return (
    <>
      <div className="stats">
        <Card className="stat"><b>{sessions.length}</b>Sessions</Card>
        <Card className="stat"><b>{totalRounds}</b>Rounds</Card>
        <Card className="stat"><b>{fmtMinutes(activeSeconds)}</b>Work time</Card>
      </div>
      <Card>
        <h2 className="label">Rounds per session · best {best}</h2>
        <ChartContainer config={{ rounds: { label: 'Rounds', color } }} className="h-48 w-full">
          <LineChart data={data} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={30} fontSize={11} allowDecimals />
            <ChartTooltip />
            <Line type="monotone" dataKey="rounds" name="Rounds" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} />
          </LineChart>
        </ChartContainer>
      </Card>
      <Card>
        <h2 className="label">Sessions</h2>
        {sessions.map((w) => (
          <div key={w.id} className="flex justify-between py-1.5 text-sm">
            <span>{fmtDate(w.date)}</span>
            <span>{hiitRounds(w)} {hiitRounds(w) === 1 ? 'round' : 'rounds'} · {fmtMinutes(w.duration)}</span>
          </div>
        ))}
      </Card>
    </>
  )
}

function IntervalProgress({ history }) {
  const sessions = useMemo(() => history.filter(isIntervalWorkout), [history])
  if (sessions.length === 0) return <p className="muted">No interval workouts yet. Create one in Create Your Own.</p>
  const workSeconds = (w) => w.sets.reduce((a, x) => a + x.actual, 0)
  const rounds = (w) => +(w.sets.length / (w.perRound || w.sets.length || 1)).toFixed(1)
  const totalWork = sessions.reduce((a, w) => a + workSeconds(w), 0)
  const data = [...sessions].reverse().map((w) => ({ date: fmtDate(w.date), minutes: +(workSeconds(w) / 60).toFixed(1) }))
  const byName = Object.values(Object.groupBy(sessions, (w) => w.category))
  const color = '#06b6d4'
  return (
    <>
      <div className="stats">
        <Card className="stat"><b>{sessions.length}</b>Sessions</Card>
        <Card className="stat"><b>{+sessions.reduce((a, w) => a + rounds(w), 0).toFixed(1)}</b>Rounds</Card>
        <Card className="stat"><b>{fmtMinutes(totalWork)}</b>Work time</Card>
      </div>
      <Card>
        <h2 className="label">Work time per session (min)</h2>
        <ChartContainer config={{ minutes: { label: 'Minutes', color } }} className="h-48 w-full">
          <LineChart data={data} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={30} fontSize={11} allowDecimals />
            <ChartTooltip />
            <Line type="monotone" dataKey="minutes" name="Minutes" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} />
          </LineChart>
        </ChartContainer>
      </Card>
      {byName.map((list) => (
        <Card key={list[0].category}>
          <h2 className="label">{list[0].categoryLabel} · {list.length} {list.length === 1 ? 'session' : 'sessions'}</h2>
          {list.map((w) => (
            <div key={w.id} className="flex justify-between py-1.5 text-sm">
              <span>{fmtDate(w.date)}</span>
              <span>{rounds(w)} {rounds(w) === 1 ? 'round' : 'rounds'} · {fmtMinutes(workSeconds(w))} work</span>
            </div>
          ))}
        </Card>
      ))}
    </>
  )
}

function Graph({ history, weighted }) {
  const chrono = useMemo(() => [...history].reverse().filter((w) => (weighted ? isCustom(w) : CATEGORIES[w.category] && w.category !== 'hiit')), [history, weighted])
  const cats = useMemo(() => {
    const map = new Map()
    chrono.forEach((w) => map.has(w.category) || map.set(w.category, catInfo(w)))
    return [...map.entries()]
  }, [chrono])
  const chartConfig = Object.fromEntries(cats.map(([k, info]) => [k, { label: info.label, color: info.color }]))
  const data = chrono.map((w) => ({
    date: fmtDate(w.date),
    [`${w.category}_reps`]: totalReps(w.sets),
    [`${w.category}_sets`]: weighted ? maxWeight(w.sets) || null : w.sets.length,
    [`${w.category}_lvl`]: w.level,
  }))
  if (chrono.length === 0) return <p className="muted">{weighted ? 'No custom workouts yet.' : 'No shuffler workouts yet.'}</p>
  const second = weighted ? 'weight' : 'sets'
  return (
    <>
      <div style={{ flex: 1, minHeight: 320, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ChartContainer config={chartConfig}>
            <LineChart data={data} margin={{ left: 0, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis yAxisId="l" tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={false} />
              <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={weighted} />
              <ChartTooltip />
              {cats.flatMap(([k, info]) => [
                <Line key={`${k}r`} yAxisId="l" type="monotone" connectNulls dataKey={`${k}_reps`} name={`${info.label} reps`} stroke={info.color} strokeWidth={2} dot={(p) => <Marker key={p.index} {...p} levelKey={`${k}_lvl`} color={info.color} />} />,
                <Line key={`${k}s`} yAxisId="r" type="monotone" connectNulls dataKey={`${k}_sets`} name={`${info.label} ${second}`} stroke={info.color} strokeDasharray="5 4" strokeWidth={1.5} dot={false} />,
              ])}
            </LineChart>
          </ChartContainer>
        </div>
      </div>
      <Card className="legend">
        <div className="legend-row">
          {cats.map(([k, info]) => <span key={k}><i style={{ background: info.color }} />{info.label}</span>)}
        </div>
        <div className="legend-row"><span>● Beginner</span><span>■ Intermediate</span><span>◆ Elite / Custom</span></div>
        <div className="legend-row"><span>━ Total reps (left axis)</span><span>{weighted ? '┅ Top weight, kg (right axis, bodyweight sessions have none)' : '┅ Sets (right axis)'}</span></div>
      </Card>
    </>
  )
}
