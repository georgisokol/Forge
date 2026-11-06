import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { catInfo, fmtSet, levelLabel, totalReps } from './data.js'
import { getHistory } from './storage.js'
import Header from './Header.jsx'
import { Badge } from '@/components/ui/badge'

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })

export default function History({ onBack }) {
  const [tab, setTab] = useState('log')
  const history = useMemo(() => [...getHistory()].reverse(), [])
  return (
    <div className="screen">
      <Header title="History" onBack={onBack} />
      <div className="tabs">
        <button className={`tab ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>Log</button>
        <button className={`tab ${tab === 'graph' ? 'active' : ''}`} onClick={() => setTab('graph')}>Progress</button>
      </div>
      {history.length === 0 ? <p className="muted">No workouts yet.</p> : tab === 'log' ? <Log history={history} /> : <Graph history={history} />}
    </div>
  )
}

function Log({ history }) {
  const [open, setOpen] = useState(null)
  return (
    <table className="table">
      <thead><tr><th>Date</th><th>Category</th><th>Level</th></tr></thead>
      <tbody>
        {history.map((w) => (
          <Row key={w.id} w={w} open={open === w.id} toggle={() => setOpen(open === w.id ? null : w.id)} />
        ))}
      </tbody>
    </table>
  )
}

function Row({ w, open, toggle }) {
  const c = catInfo(w)
  return (
    <>
      <tr className="click" onClick={toggle}>
        <td>{fmtDate(w.date)}</td>
        <td><Badge style={{ '--c': c.color }}>{c.label}</Badge></td>
        <td>{levelLabel(w)}</td>
      </tr>
      {open && (
        <tr><td colSpan="3">
          {w.sets.map((s, i) => (
            <div key={i} className="detail">
              <span>{i + 1}. {s.exercise}</span>
              <span className={s.status}>{fmtSet(s)} · {s.status === 'done' ? 'Banked' : 'Failed'}</span>
            </div>
          ))}
        </td></tr>
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

function Graph({ history }) {
  const chrono = useMemo(() => [...history].reverse(), [history])
  const cats = useMemo(() => {
    const map = new Map()
    chrono.forEach((w) => map.has(w.category) || map.set(w.category, catInfo(w)))
    return [...map.entries()]
  }, [chrono])
  const data = chrono.map((w) => ({
    date: fmtDate(w.date),
    [`${w.category}_reps`]: totalReps(w.sets),
    [`${w.category}_sets`]: w.sets.length,
    [`${w.category}_lvl`]: w.level,
  }))
  return (
    <>
      <div style={{ flex: 1, minHeight: 320, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -10, right: -10, top: 8 }}>
              <CartesianGrid stroke="#2f343c" />
              <XAxis dataKey="date" stroke="#8d939d" fontSize={11} />
              <YAxis yAxisId="l" stroke="#8d939d" fontSize={11} allowDecimals={false} />
              <YAxis yAxisId="r" orientation="right" stroke="#8d939d" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1a1d23', border: '1px solid #2f343c' }} />
              {cats.flatMap(([k, info]) => [
                <Line key={`${k}r`} yAxisId="l" type="monotone" connectNulls dataKey={`${k}_reps`} name={`${info.label} reps`} stroke={info.color} strokeWidth={2} dot={(p) => <Marker key={p.index} {...p} levelKey={`${k}_lvl`} color={info.color} />} />,
                <Line key={`${k}s`} yAxisId="r" type="monotone" connectNulls dataKey={`${k}_sets`} name={`${info.label} sets`} stroke={info.color} strokeDasharray="5 4" strokeWidth={1.5} dot={false} />,
              ])}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card legend">
        <div className="legend-row">
          {cats.map(([k, info]) => <span key={k}><i style={{ background: info.color }} />{info.label}</span>)}
        </div>
        <div className="legend-row"><span>● Beginner</span><span>■ Intermediate</span><span>◆ Elite / Custom</span></div>
        <div className="legend-row"><span>━ Total reps (left axis)</span><span>┅ Sets (right axis)</span></div>
      </div>
    </>
  )
}
