import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, LEVELS, isTimed, totalReps } from './data.js'
import { getHistory } from './storage.js'
import Header from './Header.jsx'

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
              <span className={s.status}>{s.actual}/{s.planned}{isTimed(s) ? 's' : ''} · {s.status === 'done' ? 'Banked' : 'Failed'}</span>
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
  const data = useMemo(() => [...history].reverse().map((w) => ({
    date: fmtDate(w.date),
    [`${w.category}_reps`]: totalReps(w.sets),
    [`${w.category}_sets`]: w.sets.length,
    [`${w.category}_lvl`]: w.level,
  })), [history])
  const used = Object.keys(CATEGORIES).filter((k) => history.some((w) => w.category === k))
  return (
    <>
      <div style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: -10, right: -10 }}>
            <CartesianGrid stroke="#2e251e" />
            <XAxis dataKey="date" stroke="#9a8a7c" fontSize={11} />
            <YAxis yAxisId="l" stroke="#9a8a7c" fontSize={11} />
            <YAxis yAxisId="r" orientation="right" stroke="#9a8a7c" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1b1511', border: '1px solid #2e251e' }} />
            <Legend />
            {used.flatMap((k) => {
              const color = CATEGORIES[k].color
              return [
                <Line key={`${k}r`} yAxisId="l" type="monotone" connectNulls dataKey={`${k}_reps`} name={`${CATEGORIES[k].label} reps`} stroke={color} strokeWidth={2} dot={(p) => <Marker key={p.index} {...p} levelKey={`${k}_lvl`} color={color} />} />,
                <Line key={`${k}s`} yAxisId="r" type="monotone" connectNulls dataKey={`${k}_sets`} name={`${CATEGORIES[k].label} sets`} stroke={color} strokeDasharray="5 4" strokeWidth={1.5} dot={false} />,
              ]
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        <span>● Beginner</span><span>■ Intermediate</span><span>◆ Elite</span>
        <span>Solid = total reps (left) · Dashed = sets (right)</span>
      </div>
    </>
  )
}
