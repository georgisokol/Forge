import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { alarm, tick, unlockAudio } from '../sound.js'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Optional "try it" block: a hold timer with the alarm, or a rep goal. Never blocks the Next button.
export function TryIt({ timer, reps }) {
  const [left, setLeft] = useState(timer ?? 0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (!running) return
    if (left <= 0) { setRunning(false); alarm() } else if (left <= 3) tick()
  }, [left, running])

  if (reps) return <div className="card flex items-center justify-between !py-2.5"><span className="label">Try it</span><span className="font-[family-name:var(--display)] text-xl text-[var(--yellow)]">{reps} reps</span></div>
  if (!timer) return null
  const finished = left <= 0
  return (
    <div className="card flex items-center gap-3 !py-2.5">
      <div className="flex flex-1 flex-col">
        <span className="label">Hold {timer}s</span>
        <span className="font-[family-name:var(--display)] text-3xl leading-none text-[var(--yellow)]">{fmt(Math.max(0, left))}</span>
      </div>
      <Button size="sm" className="!px-4 !py-2 !text-sm" onClick={() => { if (finished) setLeft(timer); unlockAudio(); setRunning((r) => !r) }}>{running ? 'Pause' : finished ? 'Again' : 'Start'}</Button>
      <Button size="sm" variant="muted" className="!px-3 !py-2 !text-sm" disabled={left === timer && !running} onClick={() => { setRunning(false); setLeft(timer) }}>Reset</Button>
    </div>
  )
}

