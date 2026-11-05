export const CATEGORIES = {
  push: { label: 'Push', color: '#3b82f6' },
  pull: { label: 'Pull', color: '#f97316' },
  combo: { label: 'Push/Pull Combo', color: '#a855f7' },
  legsFront: { label: 'Legs Front', sub: 'quad / tibialis', color: '#22c55e' },
  legsBack: { label: 'Legs Back', sub: 'hamstring / glute / calves', color: '#eab308' },
}

export const LEVELS = {
  beginner: { label: 'Beginner', sets: [6, 10], reps: { 1: [6, 10], 2: [4, 7], 3: [3, 5] } },
  intermediate: { label: 'Intermediate', sets: [10, 20], reps: { 1: [10, 15], 2: [7, 11], 3: [5, 8] } },
  elite: { label: 'Elite', sets: [20, 30], reps: { 1: [15, 20], 2: [12, 15], 3: [8, 12] } },
}

const e = (name, tier, eliteOnly = false) => ({ name, tier, eliteOnly })

export const EXERCISES = {
  push: [
    e('Push-ups', 1), e('Wide Push-ups', 1),
    e('Diamond Push-ups', 2), e('Pike Push-ups', 2), e('Tricep Dips (bench)', 2), e('Tricep Extensions', 2), e('Archer Push-ups', 2),
    e('Dips', 3), e('Straight Bar Dips', 3), e('Elevated Pike Push-ups', 3, true), e('Pseudo Planche Push-ups', 3, true),
  ],
  pull: [
    e('Australian Pull-ups', 1), e('Negative Pull-ups', 1),
    e('Chin-ups', 2), e('Wide Chin-ups', 2), e('Close Grip Pull-ups', 2), e('Commando Pull-ups', 2),
    e('Pull-ups', 3), e('Wide Pull-ups', 3), e('Headbanger Pull-ups', 3), e('L-Knee Sit Pull-ups/Chin-ups', 3),
    e('1s Pause Pull-up', 3), e('Typewriter Pull-ups', 3, true),
  ],
  legsFront: [
    e('Squats', 1), e('Sumo Squats', 1), e('Wall Sit', 1),
    e('Split Squats', 2), e('Poliquin Step-ups', 2), e('Tibialis Raises', 2), e('Cossack Squats', 2),
    e('Pistol Squats', 3), e('One-Leg Squats', 3),
  ],
  legsBack: [
    e('Glute Bridges', 1), e('Calf Raises', 1),
    e('Hip Thrust', 2), e('Leg Kicks (glute)', 2), e('Side Kicks (glute)', 2),
    e('Romanian Deadlift (single-leg)', 3), e('Nordic Curl', 3, true),
  ],
}

export const REST_RANGE = [45, 70]
const AVG_REST = 60
const AVG_SET_TIME = 40

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const rollSets = (level) => rand(...LEVELS[level].sets)
export const totalSeconds = (sets) => sets * (AVG_REST + AVG_SET_TIME)

// Category used for a given 0-based set index (combo alternates push → pull).
export const categoryForSet = (category, setIndex) =>
  category === 'combo' ? (setIndex % 2 === 0 ? 'push' : 'pull') : category

// Exercises allowed for this set given level, position and the previously logged tier.
export function candidatePool({ category, level, setIndex, totalSets, prevTier }) {
  const list = EXERCISES[categoryForSet(category, setIndex)]
  let pool = list
  if (level === 'beginner') {
    const late = setIndex >= Math.ceil(totalSets / 2)
    pool = list.filter((x) => x.tier === 1 || (totalSets > 8 && late && x.tier === 2))
  } else if (level === 'intermediate') {
    pool = list.filter((x) => !x.eliteOnly)
    if (prevTier === 3) pool = pool.filter((x) => x.tier !== 3)
  }
  return pool
}

export function rollReps(level, tier) {
  return rand(...LEVELS[level].reps[tier])
}

export const pickExercise = (pool, exclude = []) => {
  const filtered = pool.filter((x) => !exclude.includes(x.name))
  return pick(filtered.length ? filtered : pool)
}
