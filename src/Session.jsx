import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, categoryForSet, candidatePool, spinPool, pickExercise, rollTarget, totalSeconds, playerLevel, gamblesForLevel } from './data.js'
import { gamblesLeftToday, spendGamble } from './daily.js'
import { getHistory } from './storage.js'
import { SessionBack } from './Header.jsx'
import { useBackHandler } from './backBus.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import HowTo from './HowTo.jsx'
import { alarm, tick, unlockAudio } from './sound.js'

const MAX_SKIPS = 2
const PHASE_LABEL = { pre: 'Ready', idle: 'Shuffle', spinning: 'Spinning', landed: 'Live', failing: 'Failed' }
const fmt = (s) => {
  const abs = Math.abs(s)
  return `${s < 0 ? '+' : ''}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

// crew: null for solo, otherwise [{ uid, name }] with the host first. In a group every set is shared;
// Bank credits everyone with the target, and tapping a person's chip logs a lower number for just them.
export default function Session({ category, level, totalSets, crew = null, onFinish, onBack }) {
  const budget = totalSeconds(totalSets)
  const [startedAt, setStartedAt] = useState(null)
  useBackHandler(onBack, !startedAt)
  const [elapsed, setElapsed] = useState(0)
  const [setIndex, setSetIndex] = useState(0)
  const [logged, setLogged] = useState([])
  const [phase, setPhase] = useState('pre') // pre | idle | spinning | landed | failing
  const [display, setDisplay] = useState('Ready?')
  const [current, setCurrent] = useState(null)
  const [skips, setSkips] = useState(0)
  const [gamblesLeft, setGamblesLeft] = useState(() => gamblesLeftToday(gamblesForLevel(playerLevel(getHistory().length))))
  const [skipped, setSkipped] = useState([])
  const [failValue, setFailValue] = useState('')
  const [holdLeft, setHoldLeft] = useState(0)
  const [holdRunning, setHoldRunning] = useState(false)
  const [overrides, setOverrides] = useState({}) // uid -> actual, for group members who fell short this set
  const [editing, setEditing] = useState(null) // uid whose number is being entered
  const spinTimer = useRef(null)
  const landTimer = useRef(null)

  useEffect(() => () => { clearInterval(spinTimer.current); clearTimeout(landTimer.current) }, [])

  useEffect(() => {
    if (!startedAt) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(t)
  }, [startedAt])

  useEffect(() => {
    if (!holdRunning) return
    const t = setInterval(() => setHoldLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [holdRunning])

  useEffect(() => {
    if (holdRunning && holdLeft <= 0) {
      setHoldRunning(false)
      alarm()
    } else if (holdRunning && holdLeft <= 3) {
      tick()
    }
  }, [holdLeft, holdRunning])

  const pool = () => candidatePool({ category, level, setIndex, totalSets, prevTier: logged.at(-1)?.tier, history: logged })

  const startSpin = (candidates = spinPool({ category, level, setIndex })) => {
    const names = candidates.map((x) => x.name)
    clearInterval(spinTimer.current)
    spinTimer.current = setInterval(() => setDisplay(names[Math.floor(Math.random() * names.length)]), 70)
  }

  const land = (exclude) => {
    clearInterval(spinTimer.current)
    const ex = pickExercise(pool(), exclude, level === 'intermediate')
    const planned = rollTarget(level, ex, category)
    setCurrent({ ...ex, planned, basePlanned: planned, category: categoryForSet(category, setIndex) })
    setHoldLeft(ex.timed ? planned : 0)
    setHoldRunning(false)
    setDisplay(ex.name)
    setPhase('landed')
  }

  const beginSession = () => {
    setStartedAt(Date.now())
    setPhase('idle')
  }

  const spin = () => {
    setPhase('spinning')
    startSpin()
  }

  const finishSet = (actual, status) => {
    const entry = {
      exercise: current.name, category: current.category, tier: current.tier, muscles: current.muscles,
      unit: current.timed ? 'sec' : 'reps', planned: current.planned, actual, status,
    }
    if (crew) {
      entry.results = Object.fromEntries(crew.map(({ uid }) => {
        const got = overrides[uid]
        return [uid, got == null ? { actual: current.planned, status: 'done' } : { actual: got, status: got >= current.planned ? 'done' : 'failed' }]
      }))
      Object.assign(entry, entry.results[crew[0].uid])
      setOverrides({})
      setEditing(null)
    }
    const next = [...logged, entry]
    setLogged(next)
    setFailValue('')
    if (next.length >= totalSets) return finish(next)
    setSetIndex(setIndex + 1)
    setSkips(0)
    setSkipped([])
    setCurrent(null)
    setPhase('spinning')
    startSpin(spinPool({ category, level, setIndex: setIndex + 1 }))
  }

  const gamble = () => {
    // Random swing of 10–50% either way, always measured from the original target.
    const swing = (Math.floor(Math.random() * 5) + 1) / 10
    const planned = Math.max(1, Math.round(current.basePlanned * (1 + (Math.random() < 0.5 ? -swing : swing))))
    setCurrent({ ...current, planned })
    if (current.timed) { setHoldLeft(planned); setHoldRunning(false) }
    setGamblesLeft((n) => n - 1)
    spendGamble()
  }

  const finish = (sets) => onFinish(sets, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)

  const skip = () => {
    const ex = [...skipped, current.name]
    setSkipped(ex)
    setOverrides({})
    setEditing(null)
    setSkips(skips + 1)
    setHoldRunning(false)
    setPhase('spinning')
    startSpin()
    landTimer.current = setTimeout(() => land(ex), 700)
  }

  const isLast = logged.length === totalSets - 1
  const timed = current?.timed
  const holdDone = timed && holdLeft <= 0
  const remaining = budget - elapsed
  const cat = CATEGORIES[categoryForSet(category, setIndex)]
  const unit = timed ? 'sec' : 'reps'
  const allShort = crew && crew.every(({ uid }) => overrides[uid] != null)
  const saveEdit = () => {
    const n = Math.max(0, parseInt(failValue, 10) || 0)
    setOverrides({ ...overrides, [editing]: Math.min(n, current.planned) })
    setEditing(null)
    setFailValue('')
  }
  const clearEdit = () => {
    const { [editing]: _, ...rest } = overrides
    setOverrides(rest)
    setEditing(null)
    setFailValue('')
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SessionBack banked={logged.length > 0} onBack={onBack} onFinish={() => finish(logged)} /><div className="setno">Set <b>{String(setIndex + 1).padStart(2, '0')}</b> <span className="muted">/ {totalSets}</span></div></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge variant="outline">{PHASE_LABEL[phase]}</Badge>
          <span className={`timer ${remaining < 0 ? 'over' : ''}`}>{fmt(startedAt ? remaining : budget)}</span>
        </div>
      </div>
      {category === 'combo' && <div><Badge style={{ '--c': cat.color }}>{cat.label}</Badge></div>}

      <div className={`slot ${phase === 'spinning' ? 'spin' : ''}`} style={current && phase !== 'spinning' ? { paddingBottom: 56 } : undefined}>
        {display}
        {current && phase !== 'spinning' && <HowTo name={current.name} />}
      </div>

      {current && phase !== 'spinning' && (
        timed ? (
          <div className="hold">
            <div className="target">Hold {current.planned} sec</div>
            <div className="time">{fmt(Math.max(holdLeft, 0))}</div>
            {phase === 'landed' && !holdDone && (
              <Button variant="outline" onClick={() => { unlockAudio(); setHoldRunning(!holdRunning) }}>{holdRunning ? 'Pause' : holdLeft < current.planned ? 'Resume' : 'Start Timer'}</Button>
            )}
          </div>
        ) : (
          <div className="target">Target: {current.planned} reps</div>
        )
      )}

      {phase === 'pre' && <Button onClick={beginSession}>Start Session</Button>}
      {phase === 'idle' && <Button onClick={spin}>Shuffle</Button>}
      {phase === 'spinning' && (skips === 0
        ? <Button onClick={() => land([])}>Stop</Button>
        : <Button disabled>Shuffling…</Button>)}
      {phase === 'landed' && crew && (
        <div className="crew-chips">
          {crew.map(({ uid, name }) => {
            const got = overrides[uid]
            return (
              <button key={uid} type="button" className={`crew-chip ${editing === uid ? 'on' : ''} ${got != null && got < current.planned ? 'short' : ''}`}
                onClick={() => { setFailValue(got != null ? String(got) : ''); setEditing(editing === uid ? null : uid) }}>
                {name}<b>{got ?? current.planned}{timed ? 's' : ''}</b>
              </button>
            )
          })}
        </div>
      )}
      {phase === 'landed' && editing && (
        <>
          <Input type="number" inputMode="numeric" min="0" autoFocus placeholder={`${crew.find((m) => m.uid === editing).name}: ${timed ? 'seconds held' : 'reps done'}`} value={failValue} onChange={(e) => setFailValue(e.target.value)} />
          <div className="row">
            <Button variant="muted" onClick={overrides[editing] != null ? clearEdit : () => { setEditing(null); setFailValue('') }}>{overrides[editing] != null ? 'Hit target' : 'Cancel'}</Button>
            <Button variant="destructive" disabled={failValue === ''} onClick={saveEdit}>Log {unit}</Button>
          </div>
        </>
      )}
      {phase === 'landed' && !editing && (
        <>
          <Button variant="bank" size="lg" disabled={timed && !holdDone && !allShort} onClick={() => finishSet(current.planned, 'done')}>
            {isLast ? 'Bank & Finish Workout' : crew ? 'Bank for all' : 'Bank'}
          </Button>
          <div className="row">
            {!crew && <Button variant="destructive" onClick={() => { setHoldRunning(false); setPhase('failing') }}>Failed</Button>}
            <Button variant="muted" disabled={skips >= MAX_SKIPS} onClick={skip}>Skip ({MAX_SKIPS - skips})</Button>
          </div>
          <button type="button" className="gamble" disabled={gamblesLeft <= 0 || holdRunning} onClick={gamble}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M13.2 2 4.5 13.4h6L9.6 22l9.9-12.2h-6.3z" /></svg>
            <span className="gamble-text">Gamble ({gamblesLeft})<small>{timed ? 'time' : 'reps'} ±10–50%</small></span>
          </button>
        </>
      )}
      {phase === 'failing' && (
        <>
          <Input type="number" inputMode="numeric" min="0" autoFocus placeholder={timed ? 'Seconds you held' : 'Reps you actually did'} value={failValue} onChange={(e) => setFailValue(e.target.value)} />
          <div className="row">
            <Button variant="muted" onClick={() => setPhase('landed')}>Cancel</Button>
            <Button variant="destructive" disabled={failValue === ''} onClick={() => finishSet(Math.max(0, parseInt(failValue, 10) || 0), 'failed')}>Log {unit}</Button>
          </div>
        </>
      )}
      {phase !== 'pre' && (
        <Button variant="outline" disabled={logged.length === 0} onClick={() => finish(logged)}>Finish Workout</Button>
      )}
    </div>
  )
}
