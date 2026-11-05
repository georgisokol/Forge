import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, categoryForSet, candidatePool, pickExercise, rollReps, totalSeconds } from './data.js'

const MAX_SKIPS = 2
const fmt = (s) => {
  const abs = Math.abs(s)
  return `${s < 0 ? '+' : ''}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

export default function Session({ category, level, totalSets, onFinish }) {
  const budget = totalSeconds(totalSets)
  const [setIndex, setSetIndex] = useState(0)
  const [logged, setLogged] = useState([])
  const [phase, setPhase] = useState('idle') // idle | spinning | landed | failing
  const [display, setDisplay] = useState('Ready?')
  const [current, setCurrent] = useState(null)
  const [skips, setSkips] = useState(0)
  const [skipped, setSkipped] = useState([])
  const [failReps, setFailReps] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const start = useRef(Date.now())
  const spinTimer = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start.current) / 1000)), 500)
    return () => { clearInterval(t); clearInterval(spinTimer.current) }
  }, [])

  const pool = () => candidatePool({
    category, level, setIndex, totalSets, prevTier: logged.at(-1)?.tier,
  })

  const land = (exclude) => {
    clearInterval(spinTimer.current)
    const ex = pickExercise(pool(), exclude)
    setCurrent({ ...ex, planned: rollReps(level, ex.tier), category: categoryForSet(category, setIndex) })
    setDisplay(ex.name)
    setPhase('landed')
  }

  const spin = () => {
    const names = pool().map((x) => x.name)
    setPhase('spinning')
    spinTimer.current = setInterval(() => setDisplay(names[Math.floor(Math.random() * names.length)]), 70)
  }

  const finishSet = (actual, status) => {
    const entry = { exercise: current.name, category: current.category, tier: current.tier, planned: current.planned, actual, status }
    const next = [...logged, entry]
    setLogged(next)
    setFailReps('')
    if (next.length >= totalSets) return onFinish(next)
    setSetIndex(setIndex + 1)
    setSkips(0)
    setSkipped([])
    setCurrent(null)
    setDisplay('Ready?')
    setPhase('idle')
  }

  const skip = () => {
    const ex = [...skipped, current.name]
    setSkipped(ex)
    setSkips(skips + 1)
    setPhase('spinning')
    const names = pool().map((x) => x.name)
    spinTimer.current = setInterval(() => setDisplay(names[Math.floor(Math.random() * names.length)]), 70)
    setTimeout(() => land(ex), 700)
  }

  const remaining = budget - elapsed
  const cat = CATEGORIES[categoryForSet(category, setIndex)]

  return (
    <div className="screen">
      <div className="topbar">
        <div className="muted">Set {setIndex + 1} / {totalSets}</div>
        <div className={`timer ${remaining < 0 ? 'over' : ''}`}>{fmt(remaining)}</div>
      </div>
      {category === 'combo' && <div><span className="badge" style={{ '--c': cat.color }}>{cat.label}</span></div>}
      <div className={`slot ${phase === 'spinning' ? 'spin' : ''}`}>{display}</div>
      {current && phase !== 'spinning' && <h2 style={{ textAlign: 'center' }}>Target: {current.planned} reps</h2>}
      <div style={{ flex: 1 }} />

      {phase === 'idle' && <button className="btn" onClick={spin}>Shuffle</button>}
      {phase === 'spinning' && skips === 0 && <button className="btn" onClick={() => land([])}>Stop</button>}
      {phase === 'spinning' && skips > 0 && <button className="btn" disabled>Shuffling…</button>}
      {phase === 'landed' && (
        <>
          <div className="row">
            <button className="btn green" onClick={() => finishSet(current.planned, 'done')}>Done</button>
            <button className="btn red" onClick={() => setPhase('failing')}>Failed</button>
          </div>
          <button className="btn grey" disabled={skips >= MAX_SKIPS} onClick={skip}>Skip ({MAX_SKIPS - skips} left)</button>
        </>
      )}
      {phase === 'failing' && (
        <>
          <input className="input" type="number" inputMode="numeric" min="0" autoFocus placeholder="Reps you actually did" value={failReps} onChange={(e) => setFailReps(e.target.value)} />
          <div className="row">
            <button className="btn grey" onClick={() => setPhase('landed')}>Cancel</button>
            <button className="btn red" disabled={failReps === ''} onClick={() => finishSet(Math.max(0, parseInt(failReps, 10) || 0), 'failed')}>Log</button>
          </div>
        </>
      )}
      <button className="btn ghost" onClick={() => onFinish(logged)}>Finish Workout</button>
    </div>
  )
}
