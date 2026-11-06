import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, categoryForSet, candidatePool, pickExercise, rollTarget, totalSeconds } from './data.js'

const MAX_SKIPS = 2
const PHASE_LABEL = { pre: 'Ready', idle: 'Shuffle', spinning: 'Spinning', landed: 'Live', failing: 'Failed' }
const fmt = (s) => {
  const abs = Math.abs(s)
  return `${s < 0 ? '+' : ''}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

export default function Session({ category, level, totalSets, onFinish }) {
  const budget = totalSeconds(totalSets)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [setIndex, setSetIndex] = useState(0)
  const [logged, setLogged] = useState([])
  const [phase, setPhase] = useState('pre') // pre | idle | spinning | landed | failing
  const [display, setDisplay] = useState('Ready?')
  const [current, setCurrent] = useState(null)
  const [skips, setSkips] = useState(0)
  const [skipped, setSkipped] = useState([])
  const [failValue, setFailValue] = useState('')
  const [holdLeft, setHoldLeft] = useState(0)
  const [holdRunning, setHoldRunning] = useState(false)
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
      navigator.vibrate?.([200, 100, 200])
    }
  }, [holdLeft, holdRunning])

  const pool = () => candidatePool({ category, level, setIndex, totalSets, prevTier: logged.at(-1)?.tier })

  const startSpin = () => {
    const names = pool().map((x) => x.name)
    clearInterval(spinTimer.current)
    spinTimer.current = setInterval(() => setDisplay(names[Math.floor(Math.random() * names.length)]), 70)
  }

  const land = (exclude) => {
    clearInterval(spinTimer.current)
    const ex = pickExercise(pool(), exclude)
    const planned = rollTarget(level, ex)
    setCurrent({ ...ex, planned, category: categoryForSet(category, setIndex) })
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
    const next = [...logged, entry]
    setLogged(next)
    setFailValue('')
    if (next.length >= totalSets) return finish(next)
    setSetIndex(setIndex + 1)
    setSkips(0)
    setSkipped([])
    setCurrent(null)
    setDisplay('Ready?')
    setPhase('idle')
  }

  const finish = (sets) => onFinish(sets, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)

  const skip = () => {
    const ex = [...skipped, current.name]
    setSkipped(ex)
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

  return (
    <div className="screen">
      <div className="topbar">
        <div className="setno">Set <b>{String(setIndex + 1).padStart(2, '0')}</b> <span className="muted">/ {totalSets}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="pill">{PHASE_LABEL[phase]}</span>
          <span className={`timer ${remaining < 0 ? 'over' : ''}`}>{fmt(startedAt ? remaining : budget)}</span>
        </div>
      </div>
      {category === 'combo' && <div><span className="badge" style={{ '--c': cat.color }}>{cat.label}</span></div>}

      <div className={`slot ${phase === 'spinning' ? 'spin' : ''}`}>{display}</div>

      {current && phase !== 'spinning' && (
        timed ? (
          <div className="hold">
            <div className="target">Hold {current.planned} sec</div>
            <div className="time">{fmt(Math.max(holdLeft, 0))}</div>
            {phase === 'landed' && !holdDone && (
              <button className="btn finish" onClick={() => setHoldRunning(!holdRunning)}>{holdRunning ? 'Pause' : holdLeft < current.planned ? 'Resume' : 'Start Timer'}</button>
            )}
          </div>
        ) : (
          <div className="target">Target: {current.planned} reps</div>
        )
      )}

      {phase === 'pre' && <button className="btn" onClick={beginSession}>Start Session</button>}
      {phase === 'idle' && <button className="btn" onClick={spin}>Shuffle</button>}
      {phase === 'spinning' && (skips === 0
        ? <button className="btn" onClick={() => land([])}>Stop</button>
        : <button className="btn" disabled>Shuffling…</button>)}
      {phase === 'landed' && (
        <>
          <button className="btn bank" disabled={timed && !holdDone} onClick={() => finishSet(current.planned, 'done')}>
            {isLast ? 'Bank & Finish Workout' : 'Bank'}
          </button>
          <div className="row">
            <button className="btn fail" onClick={() => { setHoldRunning(false); setPhase('failing') }}>Failed</button>
            <button className="btn skip" disabled={skips >= MAX_SKIPS} onClick={skip}>Skip ({MAX_SKIPS - skips})</button>
          </div>
        </>
      )}
      {phase === 'failing' && (
        <>
          <input className="input" type="number" inputMode="numeric" min="0" autoFocus placeholder={timed ? 'Seconds you held' : 'Reps you actually did'} value={failValue} onChange={(e) => setFailValue(e.target.value)} />
          <div className="row">
            <button className="btn skip" onClick={() => setPhase('landed')}>Cancel</button>
            <button className="btn fail" disabled={failValue === ''} onClick={() => finishSet(Math.max(0, parseInt(failValue, 10) || 0), 'failed')}>Log {unit}</button>
          </div>
        </>
      )}
      {phase !== 'pre' && (
        <button className="btn finish" disabled={logged.length === 0} onClick={() => finish(logged)}>Finish Workout</button>
      )}
    </div>
  )
}
