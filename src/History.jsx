import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, LEVELS } from './data.js'
import { getHistory } from './storage.js'

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
const totals = (w) => {
  const reps = w.sets.reduce((a, s) => a + s.actual, 0)
  return { reps, volume: reps * w.sets.length }
}

export default function History({ onBack }) {
  const [tab, setTab] = useState('log')
  const history = useMemo(() => [...getHistory()].reverse(), [])
  return (
    <div className="screen">
      <button className="back" onClick={onBack}>← Home</button>
      <h2>History</h2>
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
  const c = CATEGORIES[w.category]
  return (
    <>
      <tr className="click" onClick={toggle}>
        <td>{fmtDate(w.date)}</td>
        <td><span className="badge" style={{ '--c': c.color }}>{c.label}</span></td>
        <td>{LEVELS[w.level].label}</td>
      </tr>
      {open && (
        <tr><td colSpan="3">
          {w.sets.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>{i + 1}. {s.exercise}</span>
              <span className={s.status}>{s.actual}/{s.planned} · {s.status === 'done' ? 'Done' : 'Failed'}</span>
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
  if (level === 'beginner') return <circle cx={cx} cy={cy} r={4} fill={color} />
  if (level === 'intermediate') return <rect x={cx - 5} y={cy - 5} width={10} height={10} fill={color} />
  return <polygon points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`} fill={color} />
}

function Graph({ history }) {
  const data = useMemo(() => [...history].reverse().map((w) => {
    const t = totals(w)
    return { date: fmtDate(w.date), [`${w.category}_reps`]: t.reps, [`${w.category}_vol`]: t.volume, [`${w.category}_lvl`]: w.level }
  }), [history])
  const used = Object.keys(CATEGORIES).filter((k) => history.some((w) => w.category === k))
  return (
    <>
      <div style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: -10, right: -10 }}>
            <CartesianGrid stroke="#2a2a2a" />
            <XAxis dataKey="date" stroke="#8a8a8a" fontSize={11} />
            <YAxis yAxisId="l" stroke="#8a8a8a" fontSize={11} />
            <YAxis yAxisId="r" orientation="right" stroke="#8a8a8a" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
            <Legend />
            {used.flatMap((k) => {
              const color = CATEGORIES[k].color
              return [
                <Line key={`${k}r`} yAxisId="l" type="monotone" connectNulls dataKey={`${k}_reps`} name={`${CATEGORIES[k].label} reps`} stroke={color} strokeWidth={2} dot={(p) => <Marker key={p.index} {...p} levelKey={`${k}_lvl`} color={color} />} />,
                <Line key={`${k}v`} yAxisId="r" type="monotone" connectNulls dataKey={`${k}_vol`} name={`${CATEGORIES[k].label} volume`} stroke={color} strokeDasharray="5 4" strokeWidth={1.5} dot={false} />,
              ]
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        <span>● Beginner</span><span>■ Intermediate</span><span>◆ Elite</span>
        <span>Solid = reps (left) · Dashed = volume (right)</span>
      </div>
    </>
  )
}
