import { useEffect, useMemo, useState } from 'react'
import { CORE_CIRCUIT, CORE_LEVELS } from './data.js'
import HowTo from './HowTo.jsx'
import { alarm, tick, unlockAudio } from './sound.js'
import { SessionBack } from './Header.jsx'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function CoreSession({ level, rounds, onFinish, onBack }) {
  const { rest } = CORE_LEVELS[level]
  const steps = useMemo(
    () => Array.from({ length: rounds }).flatMap((_, round) => CORE_CIRCUIT.map((x) => ({
      ...x, round, timed: !!x.seconds, planned: x.seconds?.[level] ?? x.reps[level],
    }))),
    [level, rounds],
  )
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('pre') // pre | work | rest
  const [logged, setLogged] = useState([])
  const [left, setLeft] = useState(0)
  const [running, setRunning] = useState(false)

  const step = steps[idx]
  const isLast = idx === steps.length - 1

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
    if (left <= 0) {
      setRunning(false)
      alarm()
      phase === 'work' ? bank() : nextWork()
    } else if (left <= 3) {
      tick()
    }
  }, [left, running])

  const finish = (sets) => onFinish(sets, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)

  const nextWork = () => {
    setIdx(idx + 1)
    setPhase('work')
    setLeft(steps[idx + 1].timed ? steps[idx + 1].planned : 0)
  }

  const bank = () => {
    const next = [...logged, {
      exercise: step.name, category: 'core', tier: 1, muscles: step.muscles,
      unit: step.timed ? 'sec' : 'reps', planned: step.planned, actual: step.planned, status: 'done',
    }]
    setLogged(next)
    if (isLast) return finish(next)
    setPhase('rest')
    setLeft(rest)
    setRunning(true)
  }

  const begin = () => {
    unlockAudio()
    setStartedAt(Date.now())
    setPhase('work')
    setLeft(step.timed ? step.planned : 0)
  }

  const skipRest = () => { setRunning(false); nextWork() }
  const resting = phase === 'rest'

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SessionBack banked={logged.length > 0} onBack={onBack} onFinish={() => finish(logged)} /><div className="setno">{rounds > 1 && <>Round <b>{step.round + 1}</b> <span className="muted">/ {rounds} · </span></>}Ex <b>{String(idx % CORE_CIRCUIT.length + 1).padStart(2, '0')}</b> <span className="muted">/ {CORE_CIRCUIT.length}</span></div></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge variant="outline">{phase === 'pre' ? 'Ready' : resting ? 'Rest' : 'Live'}</Badge>
          <span className="timer">{fmt(elapsed)}</span>
        </div>
      </div>

      {phase === 'pre' ? (
        <>
          <div className="slot">Core · {CORE_LEVELS[level].label}{rounds > 1 && ` · ${rounds} rounds`}</div>
          <div className="card">
            {CORE_CIRCUIT.map((x) => (
              <div key={x.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>{x.name}</span>
                <span className="muted">{x.seconds ? `${x.seconds[level]}s` : `${x.reps[level]} reps`}</span>
              </div>
            ))}
            <div className="muted" style={{ paddingTop: 8 }}>{rest}s rest between exercises</div>
          </div>
          <Button onClick={begin}>Start Session</Button>
        </>
      ) : resting ? (
        <>
          <div className="slot" style={{ flexDirection: 'column', gap: 12, paddingBottom: 56 }}>
            <span className="muted" style={{ fontSize: '1.2rem' }}>Rest · next</span>
            {steps[idx + 1].name}
            <HowTo name={steps[idx + 1].name} />
          </div>
          <div className="hold"><div className="time">{fmt(Math.max(left, 0))}</div></div>
          <Button variant="muted" onClick={skipRest}>Skip rest</Button>
        </>
      ) : (
        <>
          <div className="slot" style={{ paddingBottom: 56 }}>
            {step.name}
            <HowTo name={step.name} />
          </div>
          {step.timed ? (
            <div className="hold">
              <div className="target">Hold {step.planned} sec</div>
              <div className="time">{fmt(Math.max(left, 0))}</div>
              <Button variant="outline" onClick={() => { unlockAudio(); setRunning(!running) }}>
                {running ? 'Pause' : left < step.planned ? 'Resume' : 'Start Timer'}
              </Button>
            </div>
          ) : (
            <>
              <div className="target">{step.planned} reps</div>
              <Button variant="bank" size="lg" onClick={bank}>{isLast ? 'Done & Finish Workout' : 'Done'}</Button>
            </>
          )}
        </>
      )}
      {phase !== 'pre' && (
        <Button variant="outline" disabled={logged.length === 0} onClick={() => finish(logged)}>Finish Workout</Button>
      )}
    </div>
  )
}
