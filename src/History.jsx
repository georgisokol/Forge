import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { CATEGORIES, catInfo, fmtSet, isTimed, levelLabel, totalReps } from './data.js'
import { getHistory } from './storage.js'
import Header from './Header.jsx'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'

const isWeighted = (w) => w.sets.some((x) => x.weight != null)
const maxWeight = (sets) => Math.max(0, ...sets.map((x) => x.weight ?? 0))

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })

export default function History({ onBack }) {
  const [tab, setTab] = useState('log')
  const history = useMemo(() => [...getHistory()].reverse(), [])
  const hasWeighted = useMemo(() => history.some(isWeighted), [history])
  return (
    <div className="screen">
      <Header title="History" onBack={onBack} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="graph">Progress</TabsTrigger>
          {hasWeighted && <TabsTrigger value="weight">Progress with weight</TabsTrigger>}
        </TabsList>
      </Tabs>
      {history.length === 0 ? <p className="muted">No workouts yet.</p> : tab === 'log' ? <Log history={history} /> : <Graph key={tab} history={history} weighted={tab === 'weight'} />}
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
    <Table>
      <TableHeader>
        <TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Level</TableHead><TableHead className="w-8" /></TableRow>
      </TableHeader>
      <TableBody>
        {history.map((w, i) => (
          <Row key={w.id} w={w} history={history} index={i} open={open === w.id} toggle={() => setOpen(open === w.id ? null : w.id)} />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({ w, history, index, open, toggle }) {
  const c = catInfo(w)
  return (
    <>
      <TableRow className="cursor-pointer" data-state={open ? 'open' : 'closed'} onClick={toggle}>
        <TableCell className="whitespace-nowrap">{fmtDate(w.date)}</TableCell>
        <TableCell><Badge style={{ '--c': c.color }}>{c.label}</Badge></TableCell>
        <TableCell>{levelLabel(w)}</TableCell>
        <TableCell className="px-2 text-[var(--muted)]">{open ? '▾' : '▸'}</TableCell>
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
  if (level === 'beginner' || level === 'custom') return <circle cx={cx} cy={cy} r={4} fill={color} />
  if (level === 'intermediate') return <rect x={cx - 5} y={cy - 5} width={10} height={10} fill={color} />
  return <polygon points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`} fill={color} />
}

function Graph({ history, weighted }) {
  const chrono = useMemo(() => [...history].reverse().filter((w) => isWeighted(w) === weighted), [history, weighted])
  const cats = useMemo(() => {
    const map = new Map()
    chrono.forEach((w) => map.has(w.category) || map.set(w.category, catInfo(w)))
    return [...map.entries()]
  }, [chrono])
  const chartConfig = Object.fromEntries(cats.map(([k, info]) => [k, { label: info.label, color: info.color }]))
  const data = chrono.map((w) => ({
    date: fmtDate(w.date),
    [`${w.category}_reps`]: totalReps(w.sets),
    [`${w.category}_sets`]: weighted ? maxWeight(w.sets) : w.sets.length,
    [`${w.category}_lvl`]: w.level,
  }))
  if (chrono.length === 0) return <p className="muted">No bodyweight workouts yet.</p>
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
        <div className="legend-row"><span>━ Total reps (left axis)</span><span>{weighted ? '┅ Top weight, kg (right axis)' : '┅ Sets (right axis)'}</span></div>
      </Card>
    </>
  )
}
