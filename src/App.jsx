import { useEffect, useRef, useState } from 'react'
import { runBackHandler } from './backBus.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { CATEGORIES, CORE_LEVELS, CORE_ROUND_OPTIONS, EMOM_MINUTE_OPTIONS, EMOM_REP_OPTIONS, LEVELS, WEIGHT_PRESETS, WEIGHT_STEP, fmtKg, lastShufflerLoad } from './data.js'
import { auth } from './firebase.js'
import { clearUserData, getCustomIntervals, getCustomWorkouts, getHistory, getProfile, getUid, loadUserData, saveFriendWorkout, saveProfile, saveWorkout } from './storage.js'
import { clearFriends, getFriends, getIncoming, loadFriends, publishDirectory } from './friends.js'
import Friends, { CrewPicker } from './Friends.jsx'
import Login from './Login.jsx'
import Forging from './Forging.jsx'
import LevelSword from './LevelSword.jsx'
import Daily from './Daily.jsx'
import { streakInfo } from './daily.js'
import DailyShield from './DailyShield.jsx'
import { Confirm } from '@/components/ui/confirm'
import Session from './Session.jsx'
import Skills from './Skills.jsx'
import { SKILL_LEVELS } from './skills/skillData.js'
import Summary from './Summary.jsx'
import History from './History.jsx'
import Header from './Header.jsx'
import Create from './Create.jsx'
import CustomSession from './CustomSession.jsx'
import CoreSession from './Core.jsx'
import HiitSession from './Hiit.jsx'
import EmomSession from './Emom.jsx'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'

const FORGING_MS = 2800
const HIIT_ROUND_OPTIONS = [1, 2, 3, 4, 5]

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="muted text-xs uppercase tracking-[0.25em]">{label}</span>
      <div className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}

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
  const [historySlide, setHistorySlide] = useState('log')
  const [intervalWorkout, setIntervalWorkout] = useState(null)
  const [crew, setCrew] = useState(null) // [{ uid, name }] with the host first, or null for solo
  const [weighted, setWeighted] = useState(false)
  const [kg, setKg] = useState('10')
  const [emomReps, setEmomReps] = useState(2)
  const [emomMinutes, setEmomMinutes] = useState(15)
  const weight = weighted ? parseFloat(kg) || null : null // kg of added load, or null for bodyweight

  // Android back button: one history entry is held open on every screen except home, so back runs the
  // current screen's own back action; on home there is no entry, so back closes the app.
  const [backTick, setBackTick] = useState(0)
  const hasEntry = useRef(false)
  const ignorePop = useRef(false)
  useEffect(() => {
    if (screen !== 'home' && !hasEntry.current) {
      history.pushState({ forge: true }, '')
      hasEntry.current = true
    } else if (screen === 'home' && hasEntry.current) {
      ignorePop.current = true
      hasEntry.current = false
      history.back()
    }
  }, [screen, backTick])
  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current) { ignorePop.current = false; return }
      hasEntry.current = false
      runBackHandler()
      setBackTick((t) => t + 1)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), FORGING_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) {
      clearUserData()
      clearFriends()
      setProfile(null)
      setScreen('home')
      setUser(null)
      return
    }
    setUser(undefined)
    try {
      await Promise.all([loadUserData(u), new Promise((r) => setTimeout(r, FORGING_MS))])
      // Friends are optional: a failure here must not lock the user out of their own data.
      await loadFriends(u, getProfile()?.nickname).catch((e) => console.error('Friends load failed', e))
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
  if (!profile) return <Nickname onSave={(nickname) => { const p = { nickname }; saveProfile(p); publishDirectory(nickname); setProfile(p) }} />
  const skillCount = Object.values(SKILL_LEVELS).reduce((n, l) => n + l.skills.length, 0)
  if (screen === 'home') return (
    <div className="screen">
      <div>
        <Header
          title={`Hey, ${profile.nickname}`}
          right={(
            <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" aria-label="Friends" className="signout icon-btn" onClick={() => setScreen('friends')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.8 3.1 2.6 3.5 5.2" />
              </svg>
              {getIncoming().length > 0 && <span className="dot" />}
            </button>
            <Confirm
              title="Sign out?"
              description="You'll need to sign in again to see your workouts."
              confirmLabel="Sign out"
              onConfirm={() => signOut(auth)}
              trigger={(
                <button type="button" aria-label="Sign out" className="signout">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9M15 8l4 4-4 4M19 12H9" />
                  </svg>
                </button>
              )}
            />
            </div>
          )}
        />
        <p className="muted" style={{ margin: '6px 0 0' }}>Time to forge.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DailyShield onClick={() => {
        if (streakInfo().doneToday) { setHistorySlide('daily'); setScreen('history') } else setScreen('daily')
      }} />
        <LevelSword onClick={() => { setHistorySlide('log'); setScreen('history') }} />
      </div>
      <div className="home-grid">
        {[
          { label: 'Start Workout', sub: 'Shuffle a session', primary: true, go: () => setScreen('category'), icon: <path d="M7 4.5v15l12-7.5z" />, filled: true },
          { label: 'Create', sub: 'Your own workouts', go: () => setScreen('create'), icon: <path d="M12 4.5v15M4.5 12h15" /> },
          { label: 'Skills', sub: `${skillCount} lessons`, go: () => setScreen('skills'), icon: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.3 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9z" />, filled: true },
          { label: 'History', sub: `${getHistory().length} logged`, go: () => { setHistorySlide('log'); setScreen('history') }, icon: <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5v4.8h4.8M12 7.5V12l3 2" /> },
        ].map((t) => (
          <Button key={t.label} variant={t.primary ? 'default' : 'secondary'} className="home-tile" onClick={t.go}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill={t.filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
            <span className="home-text">{t.label}<small>{t.sub}</small></span>
          </Button>
        ))}
      </div>
      <div className="muted" style={{ textAlign: 'center', fontSize: '.75rem' }}>v{__APP_VERSION__}</div>
    </div>
  )
  if (screen === 'skills') return <Skills onBack={() => setScreen('home')} />
  if (screen === 'friends') return <Friends onBack={() => setScreen('home')} />
  if (screen === 'daily') return <Daily onBack={() => setScreen('home')} onProgress={() => { setHistorySlide('daily'); setScreen('history') }} />
  if (screen === 'category') {
    const openCategory = (key) => {
      const c = CATEGORIES[key]
      setCategory(key)
      if (!c.mode || c.mode === 'emom') {
        const last = lastShufflerLoad(getHistory())
        setWeighted(last.weighted)
        setKg(String(last.kg))
      }
      setScreen(c.mode === 'core' ? 'coreLevel' : c.mode === 'hiit' ? 'hiitRounds' : 'load')
    }
    const categoryButton = (key) => {
      const c = CATEGORIES[key]
      return (
        <Button key={key} variant="secondary" className="cat" style={{ '--c': c.color }} onClick={() => openCategory(key)}>
          {c.label}{c.sub && <div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>{c.sub}</div>}
        </Button>
      )
    }
    const sub = { fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }
    const customWorkouts = getCustomWorkouts()
    const intervals = getCustomIntervals()
    return (
      <div className="screen">
        <Header title="Choose category" onBack={() => setScreen('home')} />
        <Divider label="Shuffler" />
        {Object.keys(CATEGORIES).filter((k) => !CATEGORIES[k].mode || CATEGORIES[k].mode === 'core').map(categoryButton)}
        <Divider label="Interval training" />
        {categoryButton('hiit')}
        {categoryButton('muscleups')}
        {intervals.map((w) => (
          <Button key={w.id} variant="secondary" className="cat" style={{ '--c': w.color }} onClick={() => { setIntervalWorkout(w); setScreen('intervalSession') }}>
            {w.name}<div className="muted" style={sub}>interval · {w.intervals.length} intervals × {w.rounds} {w.rounds === 1 ? 'round' : 'rounds'}</div>
          </Button>
        ))}
        {customWorkouts.length > 0 && <Divider label="Custom workouts" />}
        {customWorkouts.map((w) => (
          <Button key={w.id} variant="secondary" className="cat" style={{ '--c': w.color }} onClick={() => { setCustom(w); setScreen('customSession') }}>
            {w.name}<div className="muted" style={sub}>custom · {w.exercises.length} exercises</div>
          </Button>
        ))}
      </div>
    )
  }
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
  if (screen === 'intervalSession') return (
    <HiitSession
      rounds={intervalWorkout.rounds}
      steps={intervalWorkout.intervals}
      title={intervalWorkout.name}
      category="interval"
      onBack={() => setScreen('category')}
      onFinish={(logged, duration) => {
        setPending({
          id: Date.now(), date: new Date().toISOString(), category: `interval_${intervalWorkout.id}`, categoryLabel: intervalWorkout.name,
          categoryColor: intervalWorkout.color, level: 'interval', rounds: intervalWorkout.rounds, perRound: intervalWorkout.intervals.length, sets: logged, duration,
        })
        setScreen('summary')
      }}
    />
  )
  if (screen === 'load') {
    const step = (d) => setKg(String(Math.max(0, +((parseFloat(kg) || 0) + d).toFixed(2))))
    return (
      <div className="screen">
        <Header title="Bodyweight or weighted?" onBack={() => setScreen('category')} />
        <p className="muted" style={{ margin: 0 }}>{CATEGORIES[category].label}</p>
        <ToggleGroup type="single" value={weighted ? 'weighted' : 'bodyweight'} onValueChange={(v) => v && setWeighted(v === 'weighted')} className="grid grid-cols-2 gap-3">
          <ToggleGroupItem value="bodyweight">Bodyweight</ToggleGroupItem>
          <ToggleGroupItem value="weighted">Weighted</ToggleGroupItem>
        </ToggleGroup>
        {weighted && (
          <>
            <p className="muted" style={{ margin: 0 }}>Added weight (vest, belt, backpack…)</p>
            <div className="row" style={{ alignItems: 'center' }}>
              <Button variant="secondary" style={{ flex: "0 0 64px" }} aria-label={`Minus ${WEIGHT_STEP} kg`} onClick={() => step(-WEIGHT_STEP)}>−</Button>
              <Input className="text-center font-[family-name:var(--display)] text-[2.2rem] font-bold" type="number" inputMode="decimal" min="0" step="0.5" aria-label="Weight in kg" value={kg} onChange={(e) => setKg(e.target.value)} />
              <Button variant="secondary" style={{ flex: "0 0 64px" }} aria-label={`Plus ${WEIGHT_STEP} kg`} onClick={() => step(WEIGHT_STEP)}>+</Button>
            </div>
            <ToggleGroup type="single" value={String(parseFloat(kg))} onValueChange={(v) => v && setKg(v)} className="grid grid-cols-4 gap-3">
              {WEIGHT_PRESETS.map((n) => <ToggleGroupItem key={n} value={String(n)}>{n} kg</ToggleGroupItem>)}
            </ToggleGroup>
          </>
        )}
        <div style={{ flex: 1 }} />
        <Button disabled={weighted && !weight} onClick={() => setScreen(CATEGORIES[category].mode === 'emom' ? 'emomSetup' : 'level')}>Continue · {weight ? `+${fmtKg(weight)}` : 'Bodyweight'}</Button>
      </div>
    )
  }
  if (screen === 'emomSetup') return (
    <div className="screen">
      <Header title="Muscle-up EMOM" onBack={() => setScreen('load')} />
      <p className="muted" style={{ margin: 0 }}>At the top of every minute, do your reps, then rest until the next minute. Grips alternate regular / close each minute.</p>
      <p className="muted" style={{ margin: 0 }}>Reps per minute</p>
      <ToggleGroup type="single" value={String(emomReps)} onValueChange={(v) => v && setEmomReps(Number(v))} className="grid grid-cols-5 gap-3">
        {EMOM_REP_OPTIONS.map((n) => <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>)}
      </ToggleGroup>
      <p className="muted" style={{ margin: 0 }}>Minutes</p>
      <ToggleGroup type="single" value={String(emomMinutes)} onValueChange={(v) => v && setEmomMinutes(Number(v))} className="grid grid-cols-5 gap-3">
        {EMOM_MINUTE_OPTIONS.map((n) => <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>)}
      </ToggleGroup>
      <p className="muted" style={{ margin: 0, fontSize: '.85rem' }}>Pick reps you can hit every minute without failing. A missed minute drops the rest of the session by 1 rep.</p>
      <div style={{ flex: 1 }} />
      <Button onClick={() => setScreen('emomSession')}>Continue · up to {emomReps * emomMinutes} muscle-ups</Button>
    </div>
  )
  if (screen === 'emomSession') return (
    <EmomSession
      reps={emomReps}
      minutes={emomMinutes}
      weight={weight}
      onBack={() => setScreen('emomSetup')}
      onFinish={(logged, duration) => {
        setPending({ id: Date.now(), date: new Date().toISOString(), category, level: 'emom', sets: logged, duration })
        setScreen('summary')
      }}
    />
  )
  if (screen === 'level') return (
    <div className="screen">
      <Header title="Choose level" onBack={() => setScreen('load')} />
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
      <Button onClick={() => { setCrew(null); setScreen(getFriends().length ? 'crew' : 'session') }}>Continue · {sets} sets</Button>
    </div>
  )
  if (screen === 'crew') return (
    <CrewPicker
      onBack={() => setScreen('sets')}
      onContinue={(picked) => {
        setCrew(picked.length ? [{ uid: getUid(), name: profile.nickname }, ...picked.map((f) => ({ uid: f.uid, name: f.nickname }))] : null)
        setScreen('session')
      }}
    />
  )
  if (screen === 'session') return (
    <Session
      category={category}
      level={level}
      totalSets={sets}
      crew={crew}
      weight={weight}
      onBack={() => setScreen(getFriends().length ? 'crew' : 'sets')}
      onFinish={(logged, duration) => {
        const id = Date.now()
        setPending({ id, date: new Date().toISOString(), category, level, sets: logged, duration, ...(crew && { group: { id, hostUid: crew[0].uid, participants: crew } }) })
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
      onSave={() => {
        if (pending.group) {
          // One save writes every participant's own copy: same id and group, their own reps per set.
          // The added weight is the host's own load; friends' copies are logged as bodyweight.
          pending.group.participants.forEach(({ uid }) => {
            const host = uid === pending.group.hostUid
            const copy = { ...pending, sets: pending.sets.map(({ results, weight: kg, ...s }) => ({ ...s, ...(host && kg != null && { weight: kg }), ...results[uid] })) }
            if (host) saveWorkout(copy)
            else saveFriendWorkout(uid, copy)
          })
        } else saveWorkout(pending)
        setPending(null); setHistorySlide('log'); setScreen('history')
      }}
      onDiscard={() => { setPending(null); setScreen('home') }}
    />
  )
  return <History slide={historySlide} onBack={() => setScreen('home')} />
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
