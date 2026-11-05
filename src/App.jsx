import { useEffect, useState } from 'react'
import { CATEGORIES, LEVELS } from './data.js'
import { getProfile, saveProfile, saveWorkout } from './storage.js'
import Session from './Session.jsx'
import History from './History.jsx'

export default function App() {
  const [profile, setProfile] = useState(getProfile)
  const [screen, setScreen] = useState('splash')
  const [category, setCategory] = useState(null)
  const [level, setLevel] = useState(null)
  const [sets, setSets] = useState(10)

  useEffect(() => {
    if (screen !== 'splash') return
    const t = setTimeout(() => setScreen(profile ? 'home' : 'nickname'), 500)
    return () => clearTimeout(t)
  }, [screen, profile])

  if (screen === 'splash') return <div className="screen center"><div className="logo">Forge</div></div>
  if (screen === 'nickname') return <Nickname onSave={(nickname) => { const p = { nickname }; saveProfile(p); setProfile(p); setScreen('home') }} />
  if (screen === 'home') return (
    <div className="screen">
      <h1>Hey, {profile.nickname}</h1>
      <p className="muted">Time to forge.</p>
      <div style={{ flex: 1 }} />
      <button className="btn" onClick={() => setScreen('category')}>Start Workout</button>
      <button className="btn ghost" onClick={() => setScreen('history')}>History</button>
    </div>
  )
  if (screen === 'category') return (
    <div className="screen">
      <button className="back" onClick={() => setScreen('home')}>← Back</button>
      <h2>Choose category</h2>
      {Object.entries(CATEGORIES).map(([key, c]) => (
        <button key={key} className="btn ghost cat" style={{ '--c': c.color }} onClick={() => { setCategory(key); setScreen('level') }}>
          {c.label}{c.sub && <div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>{c.sub}</div>}
        </button>
      ))}
    </div>
  )
  if (screen === 'level') return (
    <div className="screen">
      <button className="back" onClick={() => setScreen('category')}>← Back</button>
      <h2>Choose level</h2>
      {Object.entries(LEVELS).map(([key, l]) => (
        <button key={key} className="btn ghost" onClick={() => { setLevel(key); setSets(Math.round((l.sets[0] + l.sets[1]) / 2)); setScreen('sets') }}>
          {l.label}<div className="muted" style={{ fontSize: '.8rem', fontWeight: 400 }}>{l.sets[0]}–{l.sets[1]} sets</div>
        </button>
      ))}
    </div>
  )
  if (screen === 'sets') return (
    <div className="screen">
      <button className="back" onClick={() => setScreen('level')}>← Back</button>
      <h2>How many sets?</h2>
      <p className="muted">Suggested for {LEVELS[level].label}: {LEVELS[level].sets[0]}–{LEVELS[level].sets[1]}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {Array.from({ length: LEVELS[level].sets[1] - LEVELS[level].sets[0] + 1 }, (_, i) => LEVELS[level].sets[0] + i).map((n) => (
          <button key={n} className={`chip ${sets === n ? 'active' : ''}`} style={{ flex: '0 0 calc(20% - 8px)' }} onClick={() => setSets(n)}>{n}</button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn" onClick={() => setScreen('session')}>Start · {sets} sets</button>
    </div>
  )
  if (screen === 'session') return (
    <Session
      category={category}
      level={level}
      totalSets={sets}
      onFinish={(sets) => {
        if (sets.length) saveWorkout({ id: Date.now(), date: new Date().toISOString(), category, level, sets })
        setScreen(sets.length ? 'history' : 'home')
      }}
    />
  )
  return <History onBack={() => setScreen('home')} />
}

function Nickname({ onSave }) {
  const [name, setName] = useState('')
  return (
    <div className="screen center">
      <div className="logo">Forge</div>
      <p className="muted">What should we call you?</p>
      <input className="input" autoFocus placeholder="Nickname" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
      <button className="btn" disabled={!name.trim()} onClick={() => onSave(name.trim())}>Continue</button>
    </div>
  )
}
