import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { CATEGORIES, CORE_LEVELS, CORE_ROUND_OPTIONS, LEVELS } from './data.js'
import { auth } from './firebase.js'
import { clearUserData, getCustomWorkouts, getProfile, loadUserData, saveProfile, saveWorkout } from './storage.js'
import Login from './Login.jsx'
import Forging from './Forging.jsx'
import LevelSword from './LevelSword.jsx'
import { Confirm } from '@/components/ui/confirm'
import Session from './Session.jsx'
import Summary from './Summary.jsx'
import History from './History.jsx'
import Header from './Header.jsx'
import Create from './Create.jsx'
import CustomSession from './CustomSession.jsx'
import CoreSession from './Core.jsx'
import HiitSession from './Hiit.jsx'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'

const FORGING_MS = 2800
const HIIT_ROUND_OPTIONS = [1, 2, 3, 4, 5]
const setOptions = ([min, max]) => Array.from({ length: max - min + 1 }, (_, i) => min + i)

export default function App() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(undefined) // undefined while the saved session is being restored
  const [splashDone, setSplashDone] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [screen, setScreen] = useState('home')
  const [category, setCategory] = useState(null)
  const [level, setLevel] = useState(null)
  const [sets, setSets] = useState(10)
  const [rounds, setRounds] = useState(2)
  const [coreRounds, setCoreRounds] = useState(1)
  const [pending, setPending] = useState(null)
  const [custom, setCustom] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), FORGING_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) {
      clearUserData()
      setProfile(null)
      setScreen('home')
      setUser(null)
      return
    }
    setUser(undefined)
    try {
      await Promise.all([loadUserData(u), new Promise((r) => setTimeout(r, FORGING_MS))])
      setProfile(getProfile())
      setLoadError(false)
      setUser(u)
    } catch (e) {
      console.error(e)
      setLoadError(true)
    }
  }), [])

  if (loadError) return (
    <div className="screen center">
      <div className="logo">Forge</div>
      <p className="muted">Couldn't load your data. Check your connection.</p>
      <Button onClick={() => location.reload()}>Retry</Button>
      <Button variant="secondary" onClick={() => { setLoadError(false); signOut(auth) }}>Sign out</Button>
    </div>
  )
  if (!splashDone || user === undefined) return <Forging />
  if (!user) return <Login />
  if (!profile) return <Nickname onSave={(nickname) => { const p = { nickname }; saveProfile(p); setProfile(p) }} />
  if (screen === 'home') return (
    <div className="screen">
      <div>
        <Header
          title={`Hey, ${profile.nickname}`}
          right={(
            <Confirm
              title="Sign out?"
              description="You'll need to sign in again to see your workouts."
              confirmLabel="Sign out"
              onConfirm={() => signOut(auth)}
              trigger={<Button variant="muted" size="sm" className="shrink-0">Sign out</Button>}
            />
          )}
        />
        <p className="muted" style={{ margin: '6px 0 0' }}>Time to forge.</p>
      </div>
      <div className="split">
        <LevelSword onClick={() => setScreen('history')} />
        <Button onClick={() => setScreen('category')}>Start Workout</Button>
        <Button variant="secondary" onClick={() => setScreen('create')}>Create Your Own</Button>
        <Button variant="secondary" onClick={() => setScreen('history')}>History</Button>
      </div>
      <div className="muted" style={{ textAlign: 'center', fontSize: '.75rem' }}>Version {__APP_VERSION__}</div>
    </div>
  )
  if (screen === 'category') return (
    <div className="screen">
      <Header title="Choose category" onBack={() => setScreen('home')} />
      {Object.entries(CATEGORIES).map(([key, c]) => (
        <Button key={key} variant="secondary" className="cat" style={{ '--c': c.color }} onClick={() => { setCategory(key); setScreen(c.mode === 'core' ? 'coreLevel' : c.mode === 'hiit' ? 'hiitRounds' : 'level') }}>
          {c.label}{c.sub && <div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>{c.sub}</div>}
        </Button>
      ))}
      {getCustomWorkouts().map((w) => (
        <Button key={w.id} variant="secondary" className="cat" style={{ '--c': w.color }} onClick={() => { setCustom(w); setScreen('customSession') }}>
          {w.name}<div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>custom · {w.exercises.length} exercises</div>
        </Button>
      ))}
    </div>
  )
  if (screen === 'coreLevel') return (
    <div className="screen">
      <Header title="Choose difficulty" onBack={() => setScreen('category')} />
      <p className="muted" style={{ margin: 0 }}>Rounds</p>
      <ToggleGroup type="single" value={String(coreRounds)} onValueChange={(v) => v && setCoreRounds(Number(v))} className="grid grid-cols-2 gap-3">
        {CORE_ROUND_OPTIONS.map((n) => (
          <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      {Object.entries(CORE_LEVELS).map(([key, l]) => (
        <Button key={key} variant="secondary" onClick={() => { setLevel(key); setScreen('coreSession') }}>
          {l.label}<div className="muted" style={{ fontSize: '.8rem', fontWeight: 400 }}>~{l.minutes * coreRounds} min · {l.rest}s rest</div>
        </Button>
      ))}
    </div>
  )
  if (screen === 'hiitRounds') return (
    <div className="screen">
      <Header title="How many rounds?" onBack={() => setScreen('category')} />
      <p className="muted" style={{ margin: 0 }}>10 exercises · 45s work / 15s rest · ~10 min per round</p>
      <ToggleGroup type="single" value={String(rounds)} onValueChange={(v) => v && setRounds(Number(v))} className="grid grid-cols-3 gap-3">
        {HIIT_ROUND_OPTIONS.map((n) => (
          <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div style={{ flex: 1 }} />
      <Button onClick={() => setScreen('hiitSession')}>Continue · {rounds} {rounds === 1 ? 'round' : 'rounds'} (~{rounds * 10} min)</Button>
    </div>
  )
  if (screen === 'coreSession') return (
    <CoreSession
      level={level}
      rounds={coreRounds}
      onBack={() => setScreen('coreLevel')}
      onFinish={(logged, duration) => {
        setPending({ id: Date.now(), date: new Date().toISOString(), category: 'core', level, sets: logged, duration })
        setScreen('summary')
      }}
    />
  )
  if (screen === 'hiitSession') return (
    <HiitSession
      rounds={rounds}
      onBack={() => setScreen('hiitRounds')}
      onFinish={(logged, duration) => {
        setPending({ id: Date.now(), date: new Date().toISOString(), category: 'hiit', level: 'hiit', sets: logged, duration })
        setScreen('summary')
      }}
    />
  )
  if (screen === 'level') return (
    <div className="screen">
      <Header title="Choose level" onBack={() => setScreen('category')} />
      {Object.entries(LEVELS).map(([key, l]) => (
        <Button key={key} variant="secondary" onClick={() => { setLevel(key); setSets(Math.round((l.sets[0] + l.sets[1]) / 2)); setScreen('sets') }}>
          {l.label}<div className="muted" style={{ fontSize: '.8rem', fontWeight: 400 }}>{l.sets[0]}–{l.sets[1]} sets</div>
        </Button>
      ))}
    </div>
  )
  if (screen === 'sets') return (
    <div className="screen">
      <Header title="How many sets?" onBack={() => setScreen('level')} />
      <p className="muted" style={{ margin: 0 }}>{LEVELS[level].label}: {LEVELS[level].sets[0]}–{LEVELS[level].sets[1]} sets</p>
      <ToggleGroup type="single" value={String(sets)} onValueChange={(v) => v && setSets(Number(v))} className="grid grid-cols-3 gap-3">
        {setOptions(LEVELS[level].sets).map((n) => (
          <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div style={{ flex: 1 }} />
      <Button onClick={() => setScreen('session')}>Continue · {sets} sets</Button>
    </div>
  )
  if (screen === 'session') return (
    <Session
      category={category}
      level={level}
      totalSets={sets}
      onBack={() => setScreen('sets')}
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
      onBack={() => setScreen('home')}
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
      <Input autoFocus placeholder="Nickname" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
      <Button disabled={!name.trim()} onClick={() => onSave(name.trim())}>Continue</Button>
    </div>
  )
}
