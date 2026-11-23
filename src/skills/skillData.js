import beginner from './beginner.js'
import intermediate from './intermediate.js'
import elite from './elite.js'

// A skill: { id, name, blurb, muscles, planStages?: [{ title, timer?, reps? }], steps: [{ title, text, tip?, pose, pose2?, timer?: seconds, reps?: n }] }.
// pose / pose2 are buildFigure poses (see figures.js); two poses are shown side by side as start → end.
export const SKILL_LEVELS = {
  beginner: { label: 'Beginner', color: '#22c55e', sub: 'Foundations: balance, hollow, first holds', skills: beginner },
  intermediate: { label: 'Intermediate', color: '#f59e0b', sub: 'Levers, handstands, muscle-ups', skills: intermediate },
  elite: { label: 'Elite', color: '#ef4444', sub: 'Planche, flags, one-arm strength', skills: elite },
}
