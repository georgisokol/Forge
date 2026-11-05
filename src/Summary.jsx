import { CATEGORIES, LEVELS, isTimed, muscleCounts, totalReps } from './data.js'
import Header from './Header.jsx'

const fmtDuration = (s) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`

export default function Summary({ workout, onSave, onDiscard }) {
  const { category, level, sets, duration } = workout
  const c = CATEGORIES[category]
  const muscles = muscleCounts(sets)
  const max = muscles[0]?.[1] || 1
  const held = sets.filter(isTimed).reduce((a, s) => a + s.actual, 0)

  return (
    <div className="screen">
      <Header title="Summary" />
      <div><span className="badge" style={{ '--c': c.color }}>{c.label}</span> <span className="muted">· {LEVELS[level].label}</span></div>
      <div className="stats">
        <div className="card stat"><b>{sets.length}</b>sets</div>
        <div className="card stat"><b>{totalReps(sets)}</b>reps</div>
        <div className="card stat"><b>{fmtDuration(duration)}</b>time</div>
      </div>
      {held > 0 && <div className="muted">Plus {held}s of holds</div>}

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Muscles hit</h2>
        {muscles.map(([name, n]) => (
          <div className="mbar" key={name}>
            <span className="name">{name}</span>
            <div className="fill" style={{ width: `${(n / max) * 100}%`, minWidth: 8 }} />
            <span className="muted">{n}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Sets</h2>
        {sets.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{i + 1}. {s.exercise}</span>
            <span className={s.status}>{s.actual}/{s.planned}{isTimed(s) ? 's' : ''}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <button className="btn bank" onClick={onSave}>Save Workout</button>
      <button className="btn skip" onClick={() => window.confirm('Discard this workout?') && onDiscard()}>Discard</button>
    </div>
  )
}
