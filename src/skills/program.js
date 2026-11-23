// Weekly training plan for elite skills: repeating 4-week cycles over the skill's own progression stages.
//
// Evidence it is built on:
// - Tendons need hard holds (≥ ~70% of max effort) to adapt, so you train the hardest stage you can hold cleanly.
//   Oranchuk et al. 2019 systematic review: https://pubmed.ncbi.nlm.nih.gov/30580468/
//   Kubo et al. 2001: https://pubmed.ncbi.nlm.nih.gov/11408409/
// - Tendon adapts more slowly than muscle, so stages advance at most once per cycle, after a test.
//   Kjaer 2004, Physiol Rev: https://pubmed.ncbi.nlm.nih.gov/15044685/
// - Strength tracks weekly volume more than frequency, so sets per session rise week to week.
//   Grgic et al. 2018: https://pubmed.ncbi.nlm.nih.gov/29470825 · Ralston et al. 2018: https://pmc.ncbi.nlm.nih.gov/articles/PMC6081873
// - Deloads are typically planned every 4–8 weeks; a week of full rest cost strength in a trial, so the deload cuts
//   volume but keeps the same stage and hold length.
//   Bell et al., NSCA SCJ: https://www.nsca.com/globalassets/certification/rscc/2026-renewal/scj--practical-guide-to-deloading.pdf
//   Coleman et al. 2024, PeerJ: https://peerj.com/articles/16777
// - Training to failure isn't needed for strength, so sets stop at ~60% of your max.
//   Robinson et al. 2024 (preprint): https://sportrxiv.org/index.php/server/preprint/view/295
// - Eccentric training improved static holds on rings (swallow, support scale) in elite gymnasts in 4 weeks,
//   so a stalled cycle adds slow negatives from the next stage. Schärer et al. 2019: https://www.mdpi.com/1660-4601/16/22/4571
// - Shoulder tendinopathy is the most reported street-workout injury, hence the stop rules.
//   Ngo et al. 2021: https://www.pubmed.gov/34189146/

export const CYCLE = [
  { label: 'Build', sets: 4, sessions: 3, note: 'Settle into the stage. Every second clean.' },
  { label: 'Build', sets: 5, sessions: 3, note: 'One more set per session than last week.' },
  { label: 'Peak', sets: 6, sessions: 3, note: 'Highest volume of the cycle. Stop a set the moment form breaks.' },
  { label: 'Deload + test', sets: 3, sessions: 2, test: true, note: 'Half the volume, same stage, so joints recover without losing strength. Test your max at the end of the last session.' },
]

export const REST_SECONDS = 150 // 2–3 min between heavy sets
const WORK_SHARE = 0.6 // each set at ~60% of your tested max: hard stage, never to failure

// Only steps with a hold or rep goal are trainable stages; prerequisite/info steps are skipped.
// A skill whose steps are parts of one movement can give its own load-based planStages instead.
export const stagesOf = (skill) => skill.planStages ?? skill.steps.filter((s) => s.timer || s.reps)
export const isHold = (stage) => !!stage.timer
export const unitOf = (stage) => (isHold(stage) ? 's' : ' reps')

export const setTarget = (stage, max) => Math.max(isHold(stage) ? 3 : 1, Math.round(max * WORK_SHARE))

// Move on once your clean max on this stage reaches this.
export const advanceAt = (stage) => (isHold(stage) ? Math.max(10, stage.timer * 2) : Math.max(3, Math.ceil(stage.reps * 1.5)))

export const newPlan = (stage, max) => ({ stage, max, cycle: 1, week: 0, done: 0, stalls: 0, needsTest: false, tests: [{ date: new Date().toISOString(), stage, max }] })

// Plan after one more session is marked done; the week rolls over when its sessions are complete.
export function completeSession(plan) {
  const done = plan.done + 1
  if (done < CYCLE[plan.week].sessions) return { ...plan, done }
  if (CYCLE[plan.week].test) return { ...plan, done, awaitingTest: true }
  return { ...plan, week: plan.week + 1, done: 0 }
}

// Result of the end-of-cycle test: advance a stage, keep going, or flag a plateau.
export function applyTest(plan, skill, max) {
  const stages = stagesOf(skill)
  const stage = stages[plan.stage]
  const tests = [...plan.tests, { date: new Date().toISOString(), stage: plan.stage, max }]
  const next = { ...plan, tests, cycle: plan.cycle + 1, week: 0, done: 0, awaitingTest: false }
  const last = plan.stage >= stages.length - 1
  if (max >= advanceAt(stage) && !last) return { ...next, stage: plan.stage + 1, max: 0, stalls: 0, needsTest: true, outcome: 'advance' }
  const stalls = max <= plan.max ? plan.stalls + 1 : 0
  return { ...next, max, stalls, outcome: max >= advanceAt(stage) ? 'mastered' : stalls ? 'plateau' : 'progress' }
}

// Extra work for a stalled cycle: slow negatives from the next stage, or of the movement itself.
export function plateauWork(skill, plan) {
  const stages = stagesOf(skill)
  const harder = stages[plan.stage + 1]
  const stage = stages[plan.stage]
  if (!isHold(stage)) return `Replace the last 2 sets with 3 slow 5-second negatives of ${stage.title.toLowerCase()}.`
  return harder
    ? `Replace the last 2 sets with 3 slow 5-second negatives: hold ${harder.title.toLowerCase()} as long as you can and lower under control into ${stage.title.toLowerCase()}.`
    : `Replace the last 2 sets with 3 slow 5-second negatives into the hold from a harder angle.`
}

export const STOP_RULES = [
  'Sharp or joint pain (wrist, elbow, shoulder): stop the session and drop back one stage next time.',
  'Pain that is still there the next morning: skip this skill for a week, then restart at the deload week.',
  'A set ends when form breaks (hips sag, arms bend, shoulders shrug). Only clean seconds count.',
  'Strength often arrives before your tendons are ready. Never skip a stage or a deload, even if it feels easy.',
]

export const SESSION_RULES = [
  'Train this skill on non-consecutive days, first in your session while fresh.',
  'Warm up 10 min: wrist circles, elbow and shoulder prep, then 2 easy sets of an earlier stage.',
  `Rest ${REST_SECONDS / 60 | 0}–3 min between sets.`,
]
