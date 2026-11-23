import { useEffect, useState } from 'react'
import Header from '../Header.jsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Confirm } from '@/components/ui/confirm'
import { getSkillPlans, saveSkillPlan } from '../storage.js'
import { alarm, tick, unlockAudio } from '../sound.js'
import { TryIt } from './TryIt.jsx'
import {
  CYCLE, REST_SECONDS, SESSION_RULES, STOP_RULES, advanceAt, applyTest, completeSession, isHold, newPlan, plateauWork,
  setTarget, stagesOf, unitOf,
} from './program.js'

const OUTCOME = {
  advance: 'Stage cleared. Test your max on the new stage to set this cycle\'s targets.',
  progress: 'Max went up. Same stage, new targets for the next cycle.',
  plateau: 'No gain this cycle. Next cycle adds slow negatives to break the plateau.',
  mastered: 'You own this skill. Keep cycling to extend your max hold.',
}

export const planStatus = (skill, plan) => {
  if (!plan) return null
  const stage = stagesOf(skill)[plan.stage]
  return `${stage.title} · cycle ${plan.cycle}, week ${plan.week + 1}`
}

// Asks for a clean max on one stage; used to start the plan, after advancing, and at the end-of-cycle test.
function MaxInput({ stage, label, onSubmit, cta }) {
  const [value, setValue] = useState('')
  const n = parseInt(value, 10)
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="label">{label}</h2>
      <p className="m-0 text-sm">{stage.title}: your best {isHold(stage) ? 'clean hold in seconds' : 'clean reps in one set'}, fresh and warmed up.</p>
      <Input type="number" inputMode="numeric" min="0" placeholder={isHold(stage) ? 'Seconds' : 'Reps'} value={value} onChange={(e) => setValue(e.target.value)} />
      <Button disabled={!(n >= 0) || value === ''} onClick={() => onSubmit(Math.max(0, n))}>{cta}</Button>
    </Card>
  )
}

function Setup({ skill, onStart }) {
  const stages = stagesOf(skill)
  const [pick, setPick] = useState(null)
  if (pick == null) return (
    <>
      <p className="muted m-0 text-sm">Pick the hardest stage you can hold cleanly for at least 3 seconds (or 1 clean rep). That is your training stage.</p>
      {stages.map((s, i) => (
        <Button key={s.title} variant="secondary" onClick={() => setPick(i)}>
          {s.title}<div className="muted" style={{ fontSize: '.8rem', fontWeight: 400, textTransform: 'none' }}>move on at {advanceAt(s)}{unitOf(s)}</div>
        </Button>
      ))}
    </>
  )
  const stage = stages[pick]
  return (
    <>
      <MaxInput stage={stage} label="Starting test" cta="Start plan" onSubmit={(max) => (max === 0 && pick > 0 ? setPick(pick - 1) : onStart(pick, max))} />
      <Button variant="muted" onClick={() => setPick(null)}>Pick another stage</Button>
    </>
  )
}

// Guided session: each set gets the hold timer (or rep goal), then a rest countdown.
function SessionRunner({ stage, sets, target, extra, onDone, onCancel }) {
  const [set, setSet] = useState(0)
  const [rest, setRest] = useState(0)
  useEffect(() => {
    if (rest <= 0) return undefined
    const t = setTimeout(() => setRest((r) => r - 1), 1000)
    if (rest === 1) alarm(); else if (rest <= 4) tick()
    return () => clearTimeout(t)
  }, [rest])
  const finished = set >= sets
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="label m-0">{finished ? 'Session complete' : `Set ${set + 1} of ${sets}`}</h2>
        <Badge variant="outline">{stage.title}</Badge>
      </div>
      {!finished && rest > 0 && (
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--display)] text-3xl text-[var(--yellow)]">Rest {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</span>
          <Button size="sm" variant="muted" onClick={() => setRest(0)}>Skip rest</Button>
        </div>
      )}
      {!finished && rest <= 0 && (
        <>
          <TryIt key={set} timer={isHold(stage) ? target : undefined} reps={isHold(stage) ? undefined : target} />
          <Button onClick={() => { unlockAudio(); setSet(set + 1); if (set + 1 < sets) setRest(REST_SECONDS) }}>Set done</Button>
        </>
      )}
      {extra && !finished && <p className="muted m-0 text-xs">Plateau work: {extra}</p>}
      {finished
        ? <Button variant="bank" onClick={onDone}>Log session</Button>
        : <Button variant="muted" onClick={onCancel}>Stop session</Button>}
    </Card>
  )
}

export default function SkillPlan({ skill, onBack }) {
  const [plan, setPlanState] = useState(() => getSkillPlans()[skill.id] ?? null)
  const [running, setRunning] = useState(false)
  const setPlan = (p) => { setPlanState(p); saveSkillPlan(skill.id, p) }
  const stages = stagesOf(skill)

  const rules = (
    <Card>
      <h2 className="label">Stop rules</h2>
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm">{STOP_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
    </Card>
  )

  if (!plan) return (
    <div className="screen">
      <Header title={`${skill.name} plan`} onBack={onBack} />
      <p className="m-0 text-sm">4-week cycles: three build weeks with rising volume, then a deload with a max test. You move to the next stage only when the test says you are ready.</p>
      <Setup skill={skill} onStart={(stage, max) => setPlan(newPlan(stage, max))} />
      {rules}
    </div>
  )

  const stage = stages[plan.stage]
  const week = CYCLE[plan.week]
  const target = setTarget(stage, plan.max)
  const extra = plan.stalls > 0 && !week.test ? plateauWork(skill, plan) : null

  return (
    <div className="screen">
      <Header title={`${skill.name} plan`} onBack={onBack} />
      {plan.outcome && <Card className="text-sm" style={{ borderColor: 'var(--yellow)' }}>{OUTCOME[plan.outcome]}</Card>}

      {plan.needsTest ? (
        <MaxInput stage={stage} label="New stage test" cta="Set targets" onSubmit={(max) => setPlan({ ...plan, max, needsTest: false, outcome: null, tests: [...plan.tests, { date: new Date().toISOString(), stage: plan.stage, max }] })} />
      ) : plan.awaitingTest ? (
        <MaxInput stage={stage} label="End-of-cycle test" cta="Log test" onSubmit={(max) => setPlan(applyTest(plan, skill, max))} />
      ) : (
        <>
          <div className="stats">
            <Card className="stat"><b>{plan.cycle}</b>Cycle</Card>
            <Card className="stat"><b>{plan.week + 1}/4</b>Week</Card>
            <Card className="stat"><b>{plan.max}{isHold(stage) ? 's' : ''}</b>Max</Card>
          </div>
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="label m-0">This week · {week.label}</h2>
              <span className="muted text-xs">{plan.done}/{week.sessions} sessions</span>
            </div>
            <div className="font-[family-name:var(--display)] text-2xl text-[var(--yellow)]">{stage.title}: {week.sets} × {target}{unitOf(stage)}</div>
            <p className="muted m-0 text-sm">{week.note}</p>
            <p className="muted m-0 text-xs">Next stage at a clean {advanceAt(stage)}{unitOf(stage)} max{plan.stage === stages.length - 1 ? ' (final stage)' : ''}.</p>
          </Card>
          {running
            ? <SessionRunner stage={stage} sets={week.sets} target={target} extra={extra} onCancel={() => setRunning(false)} onDone={() => { setRunning(false); setPlan({ ...completeSession(plan), outcome: null }) }} />
            : <Button onClick={() => setRunning(true)}>Start session {plan.done + 1}</Button>}
          {extra && !running && <p className="muted m-0 text-xs">Plateau work this cycle: {extra}</p>}
        </>
      )}

      <Card className="flex flex-col gap-2">
        <h2 className="label">The cycle</h2>
        {CYCLE.map((w, i) => (
          <div key={i} className={`flex justify-between text-sm ${i === plan.week ? 'text-[var(--yellow)]' : ''}`}>
            <span>Week {i + 1} · {w.label}</span>
            <span>{w.sessions} × {w.sets} sets</span>
          </div>
        ))}
        <ul className="muted m-0 mt-1 flex list-disc flex-col gap-1 pl-5 text-xs">{SESSION_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      </Card>
      {rules}
      <Confirm title="Reset this plan?" description="Your cycle progress and test history for this skill will be cleared." confirmLabel="Reset" onConfirm={() => setPlan(null)} trigger={<Button variant="muted">Reset plan</Button>} />
    </div>
  )
}
