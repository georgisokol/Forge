import { useState } from 'react'
import { CATEGORIES, EXERCISES, MUSCLES } from './data.js'
import { getCustomExercises, getCustomWorkouts, saveCustomExercises, saveCustomWorkouts } from './storage.js'
import Header from './Header.jsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#f43f5e', '#14b8a6', '#ec4899', '#06b6d4', '#f59e0b', '#8b5cf6']
const uid = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`

export default function Create({ onBack }) {
  const [workouts, setWorkouts] = useState(getCustomWorkouts)
  const [draft, setDraft] = useState(null)

  const persist = (list) => { saveCustomWorkouts(list); setWorkouts(list) }
  const save = (w) => {
    persist(workouts.some((x) => x.id === w.id) ? workouts.map((x) => (x.id === w.id ? w : x)) : [...workouts, w])
    setDraft(null)
  }

  if (draft) return <Builder draft={draft} onCancel={() => setDraft(null)} onSave={save} />

  return (
    <div className="screen">
      <Header title="Create your own" onBack={onBack} />
      <Button onClick={() => setDraft({ id: uid(), name: '', color: COLORS[workouts.length % COLORS.length], exercises: [] })}>+ New workout</Button>
      {workouts.length === 0 && <p className="muted">Your workouts appear in Start Workout next to the built-in categories.</p>}
      {workouts.map((w) => (
        <div key={w.id} className="card cat" style={{ '--c': w.color }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{w.name}</div>
          <div className="muted" style={{ fontSize: '.85rem', margin: '4px 0 12px' }}>
            {w.exercises.length} exercises · {w.exercises.reduce((a, e) => a + e.sets, 0)} sets
          </div>
          <div className="row">
            <Button variant="secondary" size="sm" onClick={() => setDraft(w)}>Edit</Button>
            <Button variant="muted" size="sm" onClick={() => window.confirm(`Delete "${w.name}"?`) && persist(workouts.filter((x) => x.id !== w.id))}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Builder({ draft, onCancel, onSave }) {
  const [name, setName] = useState(draft.name)
  const [exercises, setExercises] = useState(draft.exercises)
  const [picker, setPicker] = useState(false)
  const [library, setLibrary] = useState(getCustomExercises)
  const [newName, setNewName] = useState('')
  const [newWeighted, setNewWeighted] = useState(true)
  const [newMuscles, setNewMuscles] = useState([])

  const add = (ex) => setExercises((list) => [...list, { key: uid(), name: ex.name, muscles: ex.muscles ?? [], timed: !!ex.timed, weighted: !!ex.weighted, sets: 3 }])
  const patch = (key, changes) => setExercises((list) => list.map((x) => (x.key === key ? { ...x, ...changes } : x)))
  const move = (i, d) => setExercises((list) => {
    const next = [...list]
    const j = i + d
    if (j < 0 || j >= next.length) return list
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  const addNew = () => {
    const ex = { name: newName.trim(), weighted: newWeighted, muscles: newMuscles }
    if (!ex.name) return
    if (!library.some((x) => x.name.toLowerCase() === ex.name.toLowerCase())) {
      const next = [...library, ex]
      saveCustomExercises(next)
      setLibrary(next)
    }
    add(ex)
    setNewName('')
    setNewMuscles([])
  }

  const countOf = (n) => exercises.filter((x) => x.name === n).length

  if (picker) {
    const groups = [
      ...Object.entries(EXERCISES).map(([k, list]) => [CATEGORIES[k].label, CATEGORIES[k].color, list]),
      ...(library.length ? [['My exercises', '#f2b705', library]] : []),
    ]
    return (
      <div className="screen">
        <Header title="Add exercises" onBack={() => setPicker(false)} />
        {groups.map(([label, color, list]) => (
          <div key={label}>
            <Badge style={{ '--c': color, marginBottom: 8 }}>{label}</Badge>
            {list.map((ex) => (
              <button key={ex.name} className="pick" onClick={() => add(ex)}>
                <span>{ex.name}</span>
                <span className="muted">{countOf(ex.name) > 0 ? `✓ ${countOf(ex.name)}` : '+'}</span>
              </button>
            ))}
          </div>
        ))}
        <Button onClick={() => setPicker(false)}>Done</Button>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title={draft.name ? 'Edit workout' : 'New workout'} onBack={onCancel} />
      <Input placeholder="Workout name (e.g. Chest Day)" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />

      {exercises.map((x, i) => (
        <div key={x.key} className="card">
          <div className="exhead">
            <b>{x.name}</b>
            <div>
              <button className="iconbtn" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className="iconbtn" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button className="iconbtn" onClick={() => setExercises((l) => l.filter((y) => y.key !== x.key))} aria-label="Remove">✕</button>
            </div>
          </div>
          <div className="exhead" style={{ marginTop: 10 }}>
            <div className="stepper">
              <button className="iconbtn" onClick={() => patch(x.key, { sets: Math.max(1, x.sets - 1) })}>−</button>
              <span>{x.sets} sets</span>
              <button className="iconbtn" onClick={() => patch(x.key, { sets: Math.min(20, x.sets + 1) })}>+</button>
            </div>
            {!x.timed && (
              <label className="muted"><input type="checkbox" checked={x.weighted} onChange={(e) => patch(x.key, { weighted: e.target.checked })} /> Weight</label>
            )}
          </div>
        </div>
      ))}

      <Button variant="secondary" onClick={() => setPicker(true)}>+ Add from library</Button>

      <div className="card">
        <b>New exercise</b>
        <Input style={{ margin: '10px 0' }} placeholder="Name (e.g. Bench Press)" value={newName} maxLength={30} onChange={(e) => setNewName(e.target.value)} />
        <label className="muted"><input type="checkbox" checked={newWeighted} onChange={(e) => setNewWeighted(e.target.checked)} /> Track weight (kg)</label>
        <div className="mchips">
          {MUSCLES.map((m) => (
            <button key={m} className={`mchip ${newMuscles.includes(m) ? 'active' : ''}`} onClick={() => setNewMuscles((l) => (l.includes(m) ? l.filter((y) => y !== m) : [...l, m]))}>{m}</button>
          ))}
        </div>
        <Button variant="secondary" style={{ marginTop: 12 }} disabled={!newName.trim()} onClick={addNew}>Add to workout</Button>
      </div>

      <Button variant="bank" size="lg" disabled={!name.trim() || exercises.length === 0} onClick={() => onSave({ ...draft, name: name.trim(), exercises })}>Save workout</Button>
    </div>
  )
}
