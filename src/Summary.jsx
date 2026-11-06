import { catInfo, fmtSet, isTimed, levelLabel, muscleCounts, totalReps, totalTonnage } from './data.js'
import Header from './Header.jsx'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Confirm } from '@/components/ui/confirm'
import { Badge } from '@/components/ui/badge'

const fmtDuration = (s) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`

export default function Summary({ workout, onSave, onDiscard }) {
  const { sets, duration } = workout
  const c = catInfo(workout)
  const tonnage = totalTonnage(sets)
  const muscles = muscleCounts(sets)
  const max = muscles[0]?.[1] || 1
  const held = sets.filter(isTimed).reduce((a, s) => a + s.actual, 0)

  return (
    <div className="screen">
      <Header title="Summary" />
      <div><Badge style={{ '--c': c.color }}>{c.label}</Badge> <span className="muted">· {levelLabel(workout)}</span></div>
      <div className="stats">
        <Card className="stat"><b>{sets.length}</b>Sets</Card>
        <Card className="stat"><b>{totalReps(sets)}</b>Reps</Card>
        <Card className="stat"><b>{fmtDuration(duration)}</b>Time</Card>
      </div>
      {tonnage > 0 && <div className="muted">Total weight lifted: {Math.round(tonnage)} kg</div>}
      {held > 0 && <div className="muted">Plus {held}s of holds</div>}

      <Card>
        <h2 className="label">Muscles hit</h2>
        {muscles.map(([name, n]) => (
          <div className="mbar" key={name}>
            <span className="name">{name}</span>
            <Progress value={(n / max) * 100} />
            <span className="muted">{n}</span>
          </div>
        ))}
      </Card>

      <Card>
        <h2 className="label">Sets</h2>
        {sets.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{i + 1}. {s.exercise}</span>
            <span className={s.status}>{fmtSet(s)}</span>
          </div>
        ))}
      </Card>

      <div style={{ flex: 1 }} />
      <Button variant="bank" size="lg" onClick={onSave}>Save Workout</Button>
      <Confirm title="Discard this workout?" confirmLabel="Discard" onConfirm={onDiscard} trigger={<Button variant="muted">Discard</Button>} />
    </div>
  )
}
