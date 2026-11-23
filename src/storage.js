import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase.js'

// Synchronous in-memory cache for the signed-in user, loaded once at login and written through to Firestore.
// Firestore's offline cache queues writes made without a connection.
let uid = null
let cache = { profile: null, history: [], customWorkouts: [], customExercises: [], customIntervals: [], daily: { done: [], picks: {} } }

const userDoc = () => doc(db, 'users', uid)
const workoutsCol = () => collection(userDoc(), 'workouts')
const report = (e) => console.error('Firestore write failed', e)
const patchUser = (fields) => setDoc(userDoc(), fields, { merge: true }).catch(report)

const LOCAL_KEYS = ['forge.profile', 'forge.history', 'forge.customWorkouts', 'forge.customExercises']
const readLocal = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}

// One-time import of pre-Firebase localStorage data into a brand-new account.
async function importLocalData() {
  const profile = readLocal('forge.profile', null)
  const history = readLocal('forge.history', [])
  const customWorkouts = readLocal('forge.customWorkouts', [])
  const customExercises = readLocal('forge.customExercises', [])
  if (!profile && !history.length && !customWorkouts.length && !customExercises.length) return null
  const batch = writeBatch(db)
  batch.set(userDoc(), { profile, customWorkouts, customExercises })
  history.forEach((w) => batch.set(doc(workoutsCol(), String(w.id)), w))
  await batch.commit()
  LOCAL_KEYS.forEach((k) => localStorage.removeItem(k))
  return { profile, history, customWorkouts, customExercises }
}

export async function loadUserData(user) {
  uid = user.uid
  const [snap, workouts] = await Promise.all([getDoc(userDoc()), getDocs(workoutsCol())])
  if (!snap.exists() && workouts.empty) {
    const imported = await importLocalData()
    cache = { profile: null, history: [], customWorkouts: [], customExercises: [], customIntervals: [], daily: { done: [], picks: {} }, ...imported }
    return
  }
  const data = snap.data() ?? {}
  cache = {
    profile: data.profile ?? null,
    customWorkouts: data.customWorkouts ?? [],
    customExercises: data.customExercises ?? [],
    customIntervals: data.customIntervals ?? [],
    daily: data.daily ?? { done: [], picks: {} },
    skillPlans: data.skillPlans ?? {},
    history: workouts.docs.map((d) => d.data()).sort((a, b) => a.date.localeCompare(b.date)),
  }
}

export function clearUserData() {
  uid = null
  cache = { profile: null, history: [], customWorkouts: [], customExercises: [], customIntervals: [], daily: { done: [], picks: {} } }
}

export const getUid = () => uid
export const getProfile = () => cache.profile
export const saveProfile = (profile) => { cache.profile = profile; patchUser({ profile }) }

export const getHistory = () => cache.history
export const saveWorkout = (w) => {
  cache.history = [...cache.history, w]
  setDoc(doc(workoutsCol(), String(w.id)), w).catch(report)
}

// Group workout copy for a friend; firestore.rules allow this create only for accepted friends.
export const saveFriendWorkout = (friendUid, w) => {
  setDoc(doc(db, 'users', friendUid, 'workouts', String(w.id)), w).catch(report)
}

export const getCustomWorkouts = () => cache.customWorkouts
export const saveCustomWorkouts = (customWorkouts) => { cache.customWorkouts = customWorkouts; patchUser({ customWorkouts }) }
export const getCustomExercises = () => cache.customExercises
export const saveCustomExercises = (customExercises) => { cache.customExercises = customExercises; patchUser({ customExercises }) }
export const getCustomIntervals = () => cache.customIntervals
export const saveCustomIntervals = (customIntervals) => { cache.customIntervals = customIntervals; patchUser({ customIntervals }) }
// Elite skill plans by skill id; merge writes only touch the one skill, and null clears it.
export const getSkillPlans = () => cache.skillPlans ?? {}
export const saveSkillPlan = (id, plan) => { cache.skillPlans = { ...getSkillPlans(), [id]: plan }; patchUser({ skillPlans: { [id]: plan } }) }
export const getDaily = () => cache.daily
export const saveDaily = (daily) => { cache.daily = daily; patchUser({ daily }) }
