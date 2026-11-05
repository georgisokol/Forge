import { useEffect, useState } from 'react'
import { CATEGORIES, LEVELS } from './data.js'
import { getCustomWorkouts, getProfile, saveProfile, saveWorkout } from './storage.js'
import Session from './Session.jsx'
import Summary from './Summary.jsx'
import History from './History.jsx'
import Header from './Header.jsx'
import Create from './Create.jsx'
import CustomSession from './CustomSession.jsx'

const setOptions = ([min, max]) => Array.from({ length: max - min + 1 }, (_, i) => min + i)

export default function App() {
  const [profile, setProfile] = useState(getProfile)
  const [screen, setScreen] = useState('splash')
  const [category, setCategory] = useState(null)
  const [level, setLevel] = useState(null)
  const [sets, setSets] = useState(10)
  const [pending, setPending] = useState(null)
  const [custom, setCustom] = useState(null)

  useEffect(() => {
    if (screen !== 'splash') return
    const t = setTimeout(() => setScreen(profile ? 'home' : 'nickname'), 500)
    return () => clearTimeout(t)
  }, [screen, profile])

  if (screen === 'splash') return <div className="screen center"><div className="logo">Forge</div></div>
  if (screen === 'nickname') return <Nickname onSave={(nickname) => { const p = { nickname }; saveProfile(p); setProfile(p); setScreen('home') }} />
  if (screen === 'home') return (
    <div className="screen">
      <div>
        <h1>Hey, {profile.nickname}</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>Time to forge.</p>
      </div>
      <div className="split">
        <button className="btn" onClick={() => setScreen('category')}>Start Workout</button>
        <button className="btn ghost" onClick={() => setScreen('create')}>Create Your Own</button>
        <button className="btn ghost" onClick={() => setScreen('history')}>History</button>
      </div>
    </div>
  )
  if (screen === 'category') return (
    <div className="screen">
      <Header title="Choose category" onBack={() => setScreen('home')} />
      {Object.entries(CATEGORIES).map(([key, c]) => (
        <button key={key} className="btn ghost cat" style={{ '--c': c.color }} onClick={() => { setCategory(key); setScreen('level') }}>
          {c.label}{c.sub && <div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>{c.sub}</div>}
        </button>
      ))}
      {getCustomWorkouts().map((w) => (
        <button key={w.id} className="btn ghost cat" style={{ '--c': w.color }} onClick={() => { setCustom(w); setScreen('customSession') }}>
          {w.name}<div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>custom · {w.exercises.length} exercises</div>
        </button>
      ))}
    </div>
  )
  if (screen === 'level') return (
    <div className="screen">
      <Header title="Choose level" onBack={() => setScreen('category')} />
      {Object.entries(LEVELS).map(([key, l]) => (
        <button key={key} className="btn ghost" onClick={() => { setLevel(key); setSets(Math.round((l.sets[0] + l.sets[1]) / 2)); setScreen('sets') }}>
          {l.label}<div className="muted" style={{ fontSize: '.8rem', fontWeight: 400 }}>{l.sets[0]}–{l.sets[1]} sets</div>
        </button>
      ))}
    </div>
  )
  if (screen === 'sets') return (
    <div className="screen">
      <Header title="How many sets?" onBack={() => setScreen('level')} />
      <p className="muted" style={{ margin: 0 }}>{LEVELS[level].label}: {LEVELS[level].sets[0]}–{LEVELS[level].sets[1]} sets</p>
      <div className="chips">
        {setOptions(LEVELS[level].sets).map((n) => (
          <button key={n} className={`chip ${sets === n ? 'active' : ''}`} onClick={() => setSets(n)}>{n}</button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn" onClick={() => setScreen('session')}>Continue · {sets} sets</button>
    </div>
  )
  if (screen === 'session') return (
    <Session
      category={category}
      level={level}
      totalSets={sets}
      onFinish={(logged, duration) => {
        setPending({ id: Date.now(), date: new Date().toISOString(), category, level, sets: logged, duration })
        setScreen('summary')
      }}
    />
  )
  if (screen === 'create') return <Create onBack={() => setScreen('home')} />
  if (screen === 'customSession') return (
    <CustomSession
      workout={custom}
      onFinish={(logged, duration) => {
        setPending({ id: Date.now(), date: new Date().toISOString(), category: `custom_${custom.id}`, categoryLabel: custom.name, categoryColor: custom.color, level: 'custom', sets: logged, duration })
        setScreen('summary')
      }}
    />
  )
  if (screen === 'summary') return (
    <Summary
      workout={pending}
      onSave={() => { saveWorkout(pending); setPending(null); setScreen('history') }}
      onDiscard={() => { setPending(null); setScreen('home') }}
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
