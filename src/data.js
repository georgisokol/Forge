export const CATEGORIES = {
  push: { label: 'Push', color: '#3b82f6' },
  pull: { label: 'Pull', color: '#f97316' },
  combo: { label: 'Push/Pull Combo', color: '#a855f7' },
  legsFront: { label: 'Legs Front', sub: 'quad / tibialis', color: '#84982f' },
  legsBack: { label: 'Legs Back', sub: 'hamstring / glute / calves', color: '#eab308' },
  pullbar: { label: 'Pull-up Bar Only', sub: 'pull-up bar exercises', color: '#14b8a6' },
  core: { label: 'Core', sub: '10–15 min circuit', color: '#ef4444', mode: 'core' },
  hiit: { label: 'HIIT', sub: '45s on / 15s off', color: '#ec4899', mode: 'hiit' },
}

export const LEVELS = {
  beginner: { label: 'Beginner', sets: [6, 10], reps: { 1: [5, 8], 2: [3, 5], 3: [2, 4] } },
  intermediate: { label: 'Intermediate', sets: [10, 20], reps: { 1: [10, 15], 2: [7, 11], 3: [5, 8] } },
  elite: { label: 'Elite', sets: [20, 30], reps: { 1: [15, 20], 2: [12, 15], 3: [8, 12] } },
}

// Timed exercises are held for seconds instead of repped.
export const HOLD_SECONDS = { beginner: [20, 30], intermediate: [30, 45], elite: [45, 60] }

const e = (name, tier, muscles, opts = {}) => ({ name, tier, muscles, eliteOnly: false, beginnerOnly: false, timed: false, ...opts })

export const EXERCISES = {
  push: [
    e('Push-ups', 1, ['Chest', 'Triceps', 'Shoulders']),
    e('Wide Push-ups', 1, ['Chest', 'Shoulders']),
    e('Diamond Push-ups', 2, ['Triceps', 'Chest']),
    e('Pike Push-ups', 2, ['Shoulders', 'Triceps']),
    e('Tricep Dips (bench)', 2, ['Triceps']),
    e('Tricep Extensions', 2, ['Triceps']),
    e('Archer Push-ups', 2, ['Chest', 'Shoulders', 'Triceps']),
    e('Dips', 3, ['Chest', 'Triceps', 'Shoulders']),
    e('Straight Bar Dips', 3, ['Triceps', 'Chest']),
    e('Elevated Pike Push-ups', 3, ['Shoulders', 'Triceps'], { eliteOnly: true }),
    e('Pseudo Planche Push-ups', 3, ['Shoulders', 'Chest', 'Core'], { eliteOnly: true }),
  ],
  pull: [
    e('Australian Pull-ups', 1, ['Back', 'Biceps', 'Rear Delts']),
    e('Negative Pull-ups', 1, ['Back', 'Biceps'], { beginnerOnly: true }),
    e('Chin-ups', 2, ['Biceps', 'Back']),
    e('Wide Chin-ups', 2, ['Back', 'Biceps']),
    e('Close Grip Pull-ups', 2, ['Back', 'Biceps']),
    e('Commando Pull-ups', 2, ['Back', 'Biceps', 'Core']),
    e('Pull-ups', 3, ['Back', 'Biceps']),
    e('Wide Pull-ups', 3, ['Back', 'Biceps']),
    e('Headbanger Pull-ups', 3, ['Back', 'Biceps', 'Shoulders']),
    e('L-Knee Sit Pull-ups/Chin-ups', 3, ['Back', 'Biceps', 'Core']),
    e('1s Pause Pull-up', 3, ['Back', 'Biceps']),
    e('Typewriter Pull-ups', 3, ['Back', 'Biceps', 'Core'], { eliteOnly: true }),
  ],
  legsFront: [
    e('Squats', 1, ['Quads', 'Glutes']),
    e('Sumo Squats', 1, ['Quads', 'Glutes', 'Inner Thighs']),
    e('Wall Sit', 1, ['Quads'], { timed: true }),
    e('Split Squats', 2, ['Quads', 'Glutes']),
    e('Poliquin Step-ups', 2, ['Quads', 'Glutes']),
    e('Tibialis Raises', 2, ['Tibialis']),
    e('Cossack Squats', 2, ['Quads', 'Inner Thighs', 'Glutes']),
    e('Pistol Squats', 3, ['Quads', 'Glutes', 'Core']),
    e('One-Leg Squats', 3, ['Quads', 'Glutes']),
  ],
  legsBack: [
    e('Glute Bridges', 1, ['Glutes', 'Hamstrings']),
    e('Calf Raises', 1, ['Calves']),
    e('Hip Thrust', 2, ['Glutes', 'Hamstrings']),
    e('Leg Kicks (glute)', 2, ['Glutes']),
    e('Side Kicks (glute)', 2, ['Glutes']),
    e('Romanian Deadlift (single-leg)', 3, ['Hamstrings', 'Glutes', 'Lower Back']),
    e('Nordic Curl', 3, ['Hamstrings'], { eliteOnly: true }),
  ],
}

// Kept out of EXERCISES so the custom-workout picker doesn't list pull-up bar moves twice.
export const PULLBAR_EXERCISES = [
  e('Chin-ups', 2, ['Biceps', 'Back']),
  e('Close Grip Pull-ups', 2, ['Back', 'Biceps']),
  e('Commando Pull-ups', 2, ['Back', 'Biceps', 'Core']),
  e('Pull-ups', 3, ['Back', 'Biceps']),
  e('Wide Pull-ups', 3, ['Back', 'Biceps']),
  e('Headbanger Pull-ups', 3, ['Back', 'Biceps', 'Shoulders']),
]
const poolOf = (cat) => (cat === 'pullbar' ? PULLBAR_EXERCISES : EXERCISES[cat])

// Every move in these categories is hard, so reps are scaled down.
const REP_SCALE = { pullbar: 0.75 }

// One full pass hits flexion, anti-extension, rotation, lateral and lower-back work.
export const CORE_LEVELS = { easy: { label: 'Easy', rest: 25, minutes: 10 }, hard: { label: 'Hard', rest: 15, minutes: 12 } }
export const CORE_ROUND_OPTIONS = [1, 2]
export const CORE_CIRCUIT = [
  { name: 'Crunches', muscles: ['Core'], reps: { easy: 15, hard: 25 } },
  { name: 'Leg Raises', muscles: ['Core', 'Hip Flexors'], reps: { easy: 10, hard: 15 } },
  { name: 'Bicycle Crunches', muscles: ['Core', 'Obliques'], reps: { easy: 24, hard: 40 } },
  { name: 'Dead Bug (alternating)', muscles: ['Core', 'Hip Flexors'], reps: { easy: 12, hard: 20 } },
  { name: 'Hollow Hold', muscles: ['Core', 'Hip Flexors'], seconds: { easy: 20, hard: 40 } },
  { name: 'Plank', muscles: ['Core', 'Shoulders'], seconds: { easy: 30, hard: 60 } },
  { name: 'Side Plank (left)', muscles: ['Obliques', 'Core'], seconds: { easy: 20, hard: 40 } },
  { name: 'Side Plank (right)', muscles: ['Obliques', 'Core'], seconds: { easy: 20, hard: 40 } },
  { name: 'Bird Dog (alternating)', muscles: ['Lower Back', 'Glutes', 'Core'], reps: { easy: 12, hard: 20 } },
  { name: 'Copenhagen Raises', muscles: ['Inner Thighs', 'Obliques', 'Core'], reps: { easy: 8, hard: 12 } },
]

export const HIIT_WORK = 45
export const HIIT_REST = 15
export const HIIT_EXERCISES = [
  { name: 'Jumping Jacks', muscles: ['Calves', 'Shoulders', 'Quads'] },
  { name: 'High Knees', muscles: ['Quads', 'Core', 'Calves'] },
  { name: 'Squat Jumps', muscles: ['Quads', 'Glutes', 'Calves'] },
  { name: 'Burpees', muscles: ['Chest', 'Quads', 'Core', 'Shoulders'] },
  { name: 'Mountain Climbers', muscles: ['Core', 'Shoulders', 'Quads'] },
  { name: 'Skater Jumps', muscles: ['Glutes', 'Quads', 'Calves'] },
  { name: 'Jump Lunges', muscles: ['Quads', 'Glutes', 'Hamstrings'] },
  { name: 'Plank Jacks', muscles: ['Core', 'Shoulders', 'Calves'] },
  { name: 'Push-ups', muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { name: 'Bicycle Crunches', muscles: ['Core', 'Obliques'] },
]

const AVG_REST = 60
const AVG_SET_TIME = 40

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const totalSeconds = (sets) => sets * (AVG_REST + AVG_SET_TIME)

// Category used for a given 0-based set index (combo alternates push → pull).
export const categoryForSet = (category, setIndex) =>
  category === 'combo' ? (setIndex % 2 === 0 ? 'push' : 'pull') : category

// Exercises allowed for this set given level, position and the previously logged tier.
export function candidatePool({ category, level, setIndex, prevTier, history = [] }) {
  const list = poolOf(categoryForSet(category, setIndex))
  if (level === 'elite') return list.filter((x) => !x.beginnerOnly)
  // Beginner and intermediate share the pool (no elite-only moves); no back-to-back Tier 3.
  const pool = list.filter((x) => !x.eliteOnly && (level === 'beginner' || !x.beginnerOnly))
  const base = prevTier === 3 ? pool.filter((x) => x.tier !== 3) : pool
  return level === 'intermediate' ? rotate(base, history) : base
}

// Everything the shuffle animation may flash through; the rotation filter stays hidden from the user.
export function spinPool({ category, level, setIndex }) {
  const list = poolOf(categoryForSet(category, setIndex))
  if (level === 'elite') return list.filter((x) => !x.beginnerOnly)
  return list.filter((x) => !x.eliteOnly && (level === 'beginner' || !x.beginnerOnly))
}

const HARD_STREAK = 3

// Intermediate variety: easy set after a streak of hard ones, least-used exercises first, never the last one again.
function rotate(pool, history) {
  const recent = history.slice(-HARD_STREAK)
  const afterHardStreak = recent.length === HARD_STREAK && recent.every((h) => h.tier >= 2)
  const easy = afterHardStreak ? pool.filter((x) => x.tier === 1) : []
  const candidates = easy.length ? easy : pool
  const uses = (x) => history.filter((h) => h.exercise === x.name).length
  const fresh = candidates.filter((x) => x.name !== history.at(-1)?.exercise)
  const options = fresh.length ? fresh : candidates
  const least = Math.min(...options.map(uses))
  return options.filter((x) => uses(x) === least)
}

// Reps for normal exercises; hold seconds (multiples of 5) for timed ones.
export function rollTarget(level, ex, category) {
  if (ex.timed) {
    const [min, max] = HOLD_SECONDS[level]
    return rand(min / 5, max / 5) * 5
  }
  const reps = rand(...LEVELS[level].reps[ex.tier])
  return Math.max(1, Math.round(reps * (REP_SCALE[category] ?? 1)))
}

// Intermediate picks a tier first so every tier is equally likely regardless of how many exercises it has.
export const pickExercise = (pool, exclude = [], evenTiers = false) => {
  const filtered = pool.filter((x) => !exclude.includes(x.name))
  const options = filtered.length ? filtered : pool
  if (!evenTiers) return pick(options)
  return pick(pick(Object.values(Object.groupBy(options, (x) => x.tier))))
}

export const isTimed = (s) => s.unit === 'sec'

// [[muscle, setsHit], ...] sorted by most worked first.
export function muscleCounts(sets) {
  const counts = {}
  sets.forEach((s) => (s.muscles || []).forEach((m) => { counts[m] = (counts[m] || 0) + 1 }))
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

export const totalReps = (sets) => sets.filter((s) => !isTimed(s)).reduce((a, s) => a + s.actual, 0)

export const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Forearms', 'Lower Back']

export const catInfo = (w) => CATEGORIES[w.category] ?? { label: w.categoryLabel ?? 'Custom', color: w.categoryColor ?? '#ff7a1a' }
export const levelLabel = (w) => LEVELS[w.level]?.label ?? CORE_LEVELS[w.level]?.label ?? (w.level === 'hiit' ? 'HIIT' : 'Custom')

export const fmtSet = (s) => {
  if (s.planned != null) return `${s.actual}/${s.planned}${isTimed(s) ? 's' : ''}`
  const base = isTimed(s) ? `${s.actual}s` : `${s.actual} reps`
  return s.weight != null ? `${base} @ ${s.weight}kg` : base
}

export const totalTonnage = (sets) => sets.reduce((a, s) => a + (s.weight && !isTimed(s) ? s.weight * s.actual : 0), 0)
