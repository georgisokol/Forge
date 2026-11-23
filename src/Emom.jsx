import { useEffect, useRef, useState } from 'react'
import { EMOM_GRIPS, fmtKg } from './data.js'
import { SessionBack } from './Header.jsx'
import { useBackHandler } from './backBus.js'
import HowTo from './HowTo.jsx'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { alarm, tick, unlockAudio } from './sound.js'

const READY_SECONDS = 10
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const gripFor = (minute) => EMOM_GRIPS[minute % EMOM_GRIPS.length]

// Muscle-up EMOM: `reps` at the top of every minute for `minutes` minutes, grips alternating each minute.
// A minute counts as done unless you tap Missed and pick what you got; a miss lowers the reps for the
// following minutes by 1 (never below 1), so the session keeps going instead of grinding to failure.
export default function EmomSession({ reps: startReps, minutes, weight = null, onFinish, onBack }) {
  const [startedAt, setStartedAt] = useState(null)
  useBackHandler(onBack, !startedAt)
  const [now, setNow] = useState(Date.now())
  const [logged, setLogged] = useState([])
  const [reps, setReps] = useState(startReps)
  const [missed, setMissed] = useState(null) // reps got this minute, or null if on track
  const [picking, setPicking] = useState(false)
  const finished = useRef(false)

  useEffect(() => {
    if (!startedAt) return undefined
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [startedAt])

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) - READY_SECONDS : -READY_SECONDS
  const minute = Math.max(0, Math.floor(elapsed / 60))
  const left = elapsed < 0 ? -elapsed : 60 - (elapsed % 60)
  const grip = gripFor(minute)

  const entryFor = (i, got, planned) => ({
    exercise: gripFor(i).name, category: 'muscleups', tier: 3, muscles: gripFor(i).muscles, unit: 'reps',
    planned, actual: got ?? planned, status: got == null ? 'done' : 'failed', ...(weight != null && { weight }),
  })
  const finish = (sets) => {
    if (finished.current) return
    finished.current = true
    onFinish(sets, startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000) - READY_SECONDS) : 0)
  }

  // Close out each minute as the clock rolls over (several at once if the phone slept through some).
  useEffect(() => {
    const closed = Math.min(minute, minutes)
    if (elapsed < 0 || logged.length >= closed) return
    const next = [...logged, entryFor(logged.length, missed, reps)]
    const after = missed != null ? Math.max(1, reps - 1) : reps
    while (next.length < closed) next.push(entryFor(next.length, null, after))
    setLogged(next)
    setReps(after)
    setMissed(null)
    setPicking(false)
    if (next.length >= minutes) finish(next)
    else alarm()
  }, [minute]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (startedAt && left <= 3 && left > 0) tick()
  }, [left, startedAt])

  const ready = elapsed < 0
  useEffect(() => { if (startedAt && !ready) alarm() }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = logged.reduce((a, s) => a + s.actual, 0)

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SessionBack banked={logged.length > 0} onBack={onBack} onFinish={() => finish(logged)} />
          <div className="setno">Minute <b>{String(Math.min(minute + 1, minutes)).padStart(2, '0')}</b> <span className="muted">/ {minutes}</span></div>
        </div>
        <Badge variant="outline">{!startedAt ? 'Ready' : ready ? 'Get ready' : missed != null ? 'Missed' : 'Live'}</Badge>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge>EMOM</Badge>
        {weight != null && <Badge variant="outline">+{fmtKg(weight)}</Badge>}
      </div>

      <div className="slot" style={{ paddingBottom: 56 }}>
        {ready ? `First up: ${grip.grip}` : grip.grip}
        <HowTo name={grip.name} />
      </div>
      <div className="target">{reps} muscle-up{reps === 1 ? '' : 's'} {ready ? 'every minute' : 'this minute'}</div>
      <div className="hold">
        <div className="time">{fmt(startedAt ? left : READY_SECONDS)}</div>
        <div className="muted text-sm">{ready ? 'until the first minute' : `then rest · next: ${gripFor(minute + 1).grip.toLowerCase()}`}</div>
      </div>

      {!startedAt && <Button onClick={() => { unlockAudio(); setStartedAt(Date.now()); setNow(Date.now()) }}>Start EMOM</Button>}
      {startedAt && !ready && !picking && (
        missed == null
          ? <Button variant="destructive" onClick={() => setPicking(true)}>Missed</Button>
          : <Button variant="muted" onClick={() => setMissed(null)}>Got them all after all</Button>
      )}
      {picking && (
        <>
          <p className="muted m-0 text-center text-sm">How many did you get?</p>
          <div className="crew-chips">
            {Array.from({ length: reps }, (_, n) => (
              <button key={n} type="button" className="crew-chip" onClick={() => { setMissed(n); setPicking(false) }}><b>{n}</b></button>
            ))}
          </div>
          <Button variant="muted" onClick={() => setPicking(false)}>Cancel</Button>
        </>
      )}
      {startedAt && !ready && missed != null && <p className="muted m-0 text-center text-xs">Next minutes drop to {Math.max(1, reps - 1)} rep{reps - 1 > 1 ? 's' : ''}.</p>}

      <div className="stats">
        <div className="card stat"><b>{total}</b>Done</div>
        <div className="card stat"><b>{logged.filter((s) => s.status === 'done').length}/{logged.length}</b>Minutes hit</div>
      </div>
      {startedAt && <Button variant="outline" disabled={logged.length === 0} onClick={() => finish(logged)}>Finish Workout</Button>}
    </div>
  )
}
