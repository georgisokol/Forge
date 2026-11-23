import { useState } from 'react'
import Header from './Header.jsx'
import { Button } from '@/components/ui/button'
import { SkillFigure } from './skills/SkillFigure.jsx'
import { SKILL_LEVELS } from './skills/skillData.js'
import { TryIt } from './skills/TryIt.jsx'
import SkillPlan, { planStatus } from './skills/SkillPlan.jsx'
import { getSkillPlans } from './storage.js'

// Small highlighted step button that sits beside the progress dots.
function StepButton({ dir, disabled, onClick, label }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--yellow)] text-[#14110a] transition-[filter,transform] active:scale-95 disabled:cursor-not-allowed disabled:opacity-25">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'prev' ? <path d="M15 5l-7 7 7 7" /> : dir === 'done' ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )
}

// One screen, no scrolling: the figure takes whatever height is left after the text.
function Lesson({ skill, onBack, onDone }) {
  const [i, setI] = useState(0)
  const step = skill.steps[i]
  const last = i === skill.steps.length - 1
  const back = () => (i === 0 ? onBack() : setI(i - 1))

  return (
    <div className="screen lesson !h-dvh !min-h-0 !gap-2.5 overflow-hidden">
      <Header title={skill.name} onBack={back} />
      <div className="flex items-center justify-between gap-3">
        <StepButton dir="prev" label="Previous step" disabled={i === 0} onClick={() => setI(i - 1)} />
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-2">
            {skill.steps.map((_, k) => <span key={k} className="h-2 rounded-full transition-all" style={{ width: k === i ? 20 : 8, background: k <= i ? 'var(--yellow)' : 'var(--line)' }} />)}
          </div>
          <span className="label !text-[0.65rem]">Step {i + 1} of {skill.steps.length}</span>
        </div>
        <StepButton dir={last ? 'done' : 'next'} label={last ? 'Finish' : 'Next step'} onClick={() => (last ? onDone() : setI(i + 1))} />
      </div>
      <div className="flex min-h-0 flex-1 gap-2">
        <SkillFigure fill pose={step.pose} label={step.pose2 ? 'Start' : undefined} className="min-w-0 flex-1" />
        {step.pose2 && <SkillFigure fill pose={step.pose2} label="End" className="min-w-0 flex-1" />}
      </div>
      <h3 className="m-0 text-center font-[family-name:var(--display)] text-xl uppercase tracking-[0.06em] text-[var(--yellow)]">{step.title}</h3>
      <p className="m-0 text-center text-sm leading-snug">{step.text}</p>
      {step.tip && <p className="muted m-0 text-center text-xs leading-snug">Tip: {step.tip}</p>}
      <TryIt key={i} timer={step.timer} reps={step.reps} />
    </div>
  )
}

const SUB = { fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }

export default function Skills({ onBack }) {
  const [levelKey, setLevelKey] = useState(null)
  const [skill, setSkill] = useState(null)
  const [view, setView] = useState(null) // elite skills: null = hub, 'lesson' | 'plan'
  const level = SKILL_LEVELS[levelKey]
  const hasPlans = levelKey === 'elite'
  const closeSkill = () => { setSkill(null); setView(null) }

  if (skill && (!hasPlans || view === 'lesson')) return <Lesson skill={skill} onBack={hasPlans ? () => setView(null) : closeSkill} onDone={hasPlans ? () => setView(null) : closeSkill} />
  if (skill && view === 'plan') return <SkillPlan skill={skill} onBack={() => setView(null)} />
  if (skill) {
    const status = planStatus(skill, getSkillPlans()[skill.id])
    return (
      <div className="screen">
        <Header title={skill.name} onBack={closeSkill} />
        <p className="muted m-0 text-sm">{skill.blurb} · {skill.muscles}</p>
        <Button variant="secondary" className="cat" style={{ '--c': level.color }} onClick={() => setView('lesson')}>
          Learn the steps<div className="muted" style={SUB}>{skill.steps.length} steps with form cues</div>
        </Button>
        <Button variant="secondary" className="cat" style={{ '--c': level.color }} onClick={() => setView('plan')}>
          Weekly plan<div className="muted" style={SUB}>{status ?? '4-week cycles: build volume, deload, test, advance'}</div>
        </Button>
      </div>
    )
  }

  if (level) {
    const plans = getSkillPlans()
    return (
      <div className="screen">
        <Header title={level.label} onBack={() => setLevelKey(null)} />
        {level.skills.map((s) => (
          <Button key={s.id} variant="secondary" className="cat" style={{ '--c': level.color }} onClick={() => setSkill(s)}>
            {s.name}<div className="muted" style={SUB}>{(hasPlans && planStatus(s, plans[s.id])) || s.blurb}</div>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="Skills" onBack={onBack} />
      {Object.entries(SKILL_LEVELS).map(([key, l]) => (
        <Button key={key} variant="secondary" className="cat" style={{ '--c': l.color }} onClick={() => setLevelKey(key)}>
          {l.label}<div className="muted" style={{ fontSize: '.8rem', textTransform: 'none', fontWeight: 400 }}>{l.sub} · {l.skills.length} skills</div>
        </Button>
      ))}
    </div>
  )
}
