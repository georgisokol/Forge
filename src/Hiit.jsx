import { useEffect, useMemo, useState } from 'react'
import { HIIT_EXERCISES, HIIT_REST, HIIT_WORK } from './data.js'
import HowTo from './HowTo.jsx'
import { alarm, tick, unlockAudio } from './sound.js'
import { SessionBack } from './Header.jsx'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const READY_SECONDS = 5
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const WORK_COLOR = '#84982f'
const REST_COLOR = '#3b82f6'

export default function HiitSession({ rounds, onFinish, onBack }) {
  // Timeline of intervals: get-ready, then work/rest pairs (no rest after the very last exercise).
  const timeline = useMemo(() => {
    const items = [{ kind: 'ready', seconds: READY_SECONDS, next: HIIT_EXERCISES[0] }]
    for (let r = 0; r < rounds; r++) {
      HIIT_EXERCISES.forEach((ex, i) => {
        items.push({ kind: 'work', seconds: HIIT_WORK, ex, round: r, n: i + 1 })
        const upcoming = i < HIIT_EXERCISES.length - 1 ? HIIT_EXERCISES[i + 1] : r < rounds - 1 ? HIIT_EXERCISES[0] : null
        if (upcoming) items.push({ kind: 'rest', seconds: HIIT_REST, next: upcoming, round: r })
      })
    }
    return items
  }, [rounds])

  const [started, setStarted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState(READY_SECONDS)
  const [running, setRunning] = useState(false)
  const [logged, setLogged] = useState([])

  const item = timeline[idx]
  const lastWorkRound = item.round ?? 0

  useEffect(() => {
    if (!startedAt) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(t)
  }, [startedAt])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (!running) return
    if (left > 0) {
      if (left <= 3) tick()
      return
    }
    alarm()
    const entry = item.kind === 'work' && {
      exercise: item.ex.name, category: 'hiit', tier: 1, muscles: item.ex.muscles,
      unit: 'sec', planned: HIIT_WORK, actual: HIIT_WORK, status: 'done',
    }
    const next = entry ? [...logged, entry] : logged
    setLogged(next)
    if (idx === timeline.length - 1) {
      setRunning(false)
      return finish(next)
    }
    setIdx(idx + 1)
    setLeft(timeline[idx + 1].seconds)
  }, [left, running])

  const finish = (sets) => onFinish(sets, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)

  const begin = () => {
    unlockAudio()
    setStarted(true)
    setStartedAt(Date.now())
    setRunning(true)
  }

  const isWork = item.kind === 'work'
  const color = isWork ? WORK_COLOR : REST_COLOR
  const title = isWork ? item.ex.name : item.next.name
  const label = item.kind === 'ready' ? 'Get ready' : isWork ? 'Work' : 'Rest · next'

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SessionBack banked={logged.length > 0} onBack={onBack} onFinish={() => finish(logged)} /><div className="setno">Round <b>{lastWorkRound + 1}</b> <span className="muted">/ {rounds}</span></div></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge variant="outline">{!started ? 'Ready' : isWork ? 'Work' : item.kind === 'rest' ? 'Rest' : 'Get ready'}</Badge>
          <span className="timer">{fmt(elapsed)}</span>
        </div>
      </div>

      {!started ? (
        <>
          <div className="slot">HIIT · {rounds} {rounds === 1 ? 'round' : 'rounds'}</div>
          <div className="card">
            {HIIT_EXERCISES.map((x, i) => (
              <div key={x.name} style={{ padding: '4px 0' }}>{i + 1}. {x.name}</div>
            ))}
            <div className="muted" style={{ paddingTop: 8 }}>{HIIT_WORK}s work · {HIIT_REST}s rest · ~10 min per round</div>
          </div>
          <Button onClick={begin}>Start Session</Button>
        </>
      ) : (
        <>
          <div className="slot" style={{ flexDirection: 'column', gap: 12, borderColor: color, paddingBottom: 56 }}>
            <span style={{ fontSize: '1.2rem', color }}>{label}{isWork && ` · ${item.n}/${HIIT_EXERCISES.length}`}</span>
            {title}
            <HowTo name={title} />
          </div>
          <div className="hold"><div className="time" style={{ color }}>{fmt(Math.max(left, 0))}</div></div>
          <Button variant="outline" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Resume'}</Button>
          <Button variant="muted" disabled={logged.length === 0} onClick={() => finish(logged)}>Finish Workout</Button>
        </>
      )}
    </div>
  )
}
