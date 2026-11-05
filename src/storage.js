const PROFILE = 'forge.profile'
const HISTORY = 'forge.history'

const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}

export const getProfile = () => read(PROFILE, null)
export const saveProfile = (p) => localStorage.setItem(PROFILE, JSON.stringify(p))
export const getHistory = () => read(HISTORY, [])
export const saveWorkout = (w) => localStorage.setItem(HISTORY, JSON.stringify([...getHistory(), w]))
