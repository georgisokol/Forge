import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function CustomSession({ workout, onFinish }) {
  const plan = useMemo(
    () => workout.exercises.flatMap((ex) => Array.from({ length: ex.sets }, (_, i) => ({ ex, n: i + 1 }))),
    [workout],
  )
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [idx, setIdx] = useState(0)
  const [logged, setLogged] = useState([])
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')

  useEffect(() => {
    if (!startedAt) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(t)
  }, [startedAt])

  const { ex, n } = plan[idx]
  const isLast = idx === plan.length - 1
  const lastOfExercise = [...logged].reverse().find((s) => s.exercise === ex.name)

  // Prefill with the previous set of the same exercise so repeated sets are one tap.
  useEffect(() => {
    setReps(lastOfExercise ? String(lastOfExercise.actual) : '')
    setWeight(lastOfExercise?.weight != null ? String(lastOfExercise.weight) : '')
  }, [idx])

  const finish = (sets) => onFinish(sets, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)

  const bank = () => {
    const entry = {
      exercise: ex.name, muscles: ex.muscles, unit: ex.timed ? 'sec' : 'reps', planned: null,
      actual: parseInt(reps, 10) || 0, weight: ex.weighted && weight !== '' ? parseFloat(weight) : null, status: 'done',
    }
    const next = [...logged, entry]
    setLogged(next)
    if (isLast) return finish(next)
    setIdx(idx + 1)
  }

  const skip = () => setIdx(idx + 1)

  if (!startedAt) {
    return (
      <div className="screen">
        <div className="topbar"><div className="setno">{plan.length} <span className="muted">sets</span></div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Badge variant="outline">Ready</Badge><span className="timer">00:00</span></div></div>
        <div className="slot">{workout.name}</div>
        <div className="card">
          {workout.exercises.map((x) => (
            <div key={x.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{x.name}</span><span className="muted">{x.sets} sets</span>
            </div>
          ))}
        </div>
        <Button onClick={() => setStartedAt(Date.now())}>Start Session</Button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div className="setno">Set <b>{String(idx + 1).padStart(2, '0')}</b> <span className="muted">/ {plan.length}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Badge variant="outline">Live</Badge><span className="timer">{fmt(elapsed)}</span></div>
      </div>
      <div className="slot">{ex.name}</div>
      <div className="target">Set {n} of {ex.sets}</div>
      <div className="row">
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>{ex.timed ? 'Seconds' : 'Reps'}</div>
          <Input className="text-center font-[family-name:var(--display)] text-[2.2rem] font-bold" type="number" inputMode="numeric" min="0" value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>
        {ex.weighted && !ex.timed && (
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Weight (kg)</div>
            <Input className="text-center font-[family-name:var(--display)] text-[2.2rem] font-bold" type="number" inputMode="decimal" min="0" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        )}
      </div>
      <div style={{ flex: 1 }} />
      <Button variant="bank" size="lg" disabled={reps === ''} onClick={bank}>{isLast ? 'Bank & Finish Workout' : 'Bank'}</Button>
      <div className="row">
        <Button variant="muted" disabled={isLast} onClick={skip}>Skip set</Button>
        <Button variant="outline" disabled={logged.length === 0} onClick={() => finish(logged)}>Finish Workout</Button>
      </div>
    </div>
  )
}
