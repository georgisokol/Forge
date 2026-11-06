import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, categoryForSet, candidatePool, pickExercise, rollTarget, totalSeconds } from './data.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
  const [gambled, setGambled] = useState(false)
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

  const startSpin = (candidates = pool()) => {
    const names = candidates.map((x) => x.name)
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
    setGambled(false)
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
    setPhase('spinning')
    startSpin(candidatePool({ category, level, setIndex: setIndex + 1, totalSets, prevTier: entry.tier }))
  }

  const gamble = () => {
    const planned = Math.max(1, Math.round(current.planned * (Math.random() < 0.5 ? 0.7 : 1.4)))
    setCurrent({ ...current, planned })
    if (current.timed) { setHoldLeft(planned); setHoldRunning(false) }
    setGambled(true)
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
          <Badge variant="outline">{PHASE_LABEL[phase]}</Badge>
          <span className={`timer ${remaining < 0 ? 'over' : ''}`}>{fmt(startedAt ? remaining : budget)}</span>
        </div>
      </div>
      {category === 'combo' && <div><Badge style={{ '--c': cat.color }}>{cat.label}</Badge></div>}

      <div className={`slot ${phase === 'spinning' ? 'spin' : ''}`}>{display}</div>

      {current && phase !== 'spinning' && (
        timed ? (
          <div className="hold">
            <div className="target">Hold {current.planned} sec</div>
            <div className="time">{fmt(Math.max(holdLeft, 0))}</div>
            {phase === 'landed' && !holdDone && (
              <Button variant="outline" onClick={() => setHoldRunning(!holdRunning)}>{holdRunning ? 'Pause' : holdLeft < current.planned ? 'Resume' : 'Start Timer'}</Button>
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
      {phase === 'landed' && (
        <>
          <Button variant="bank" size="lg" disabled={timed && !holdDone} onClick={() => finishSet(current.planned, 'done')}>
            {isLast ? 'Bank & Finish Workout' : 'Bank'}
          </Button>
          <div className="row">
            <Button variant="destructive" onClick={() => { setHoldRunning(false); setPhase('failing') }}>Failed</Button>
            <Button variant="muted" disabled={skips >= MAX_SKIPS} onClick={skip}>Skip ({MAX_SKIPS - skips})</Button>
          </div>
          <Button variant="outline" size="sm" className="self-center" disabled={gambled || holdRunning} onClick={gamble}>🎲 Gamble</Button>
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
