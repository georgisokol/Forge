import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { db } from './firebase.js'

// Friends are mutual: a request (friendRequests/{from_to}) becomes a friendship once the receiver accepts,
// which writes users/{a}/friends/{b} and users/{b}/friends/{a}. Being in someone's friend list is what
// lets you save a group workout into their history (see firestore.rules).
let me = null // { uid, email, nickname }
let friends = []
let incoming = []
let outgoing = []

const emailKey = (email) => email.trim().toLowerCase()
const friendDoc = (owner, friend) => doc(db, 'users', owner, 'friends', friend)
const requestDoc = (from, to) => doc(db, 'friendRequests', `${from}_${to}`)

export async function loadFriends(user, nickname) {
  me = { uid: user.uid, email: user.email, nickname }
  if (nickname) publishDirectory(nickname)
  await refreshFriends()
}

export function clearFriends() {
  me = null
  friends = []
  incoming = []
  outgoing = []
}

// Keeps this user findable by exact email, under their current nickname.
export function publishDirectory(nickname) {
  if (!me?.email) return
  me.nickname = nickname
  setDoc(doc(db, 'directory', emailKey(me.email)), { uid: me.uid, nickname }).catch((e) => console.error('Directory write failed', e))
}

export async function refreshFriends() {
  const reqs = collection(db, 'friendRequests')
  const [f, inc, out] = await Promise.all([
    getDocs(collection(db, 'users', me.uid, 'friends')),
    getDocs(query(reqs, where('to', '==', me.uid))),
    getDocs(query(reqs, where('from', '==', me.uid))),
  ])
  friends = f.docs.map((d) => d.data()).sort((a, b) => a.nickname.localeCompare(b.nickname))
  const ids = new Set(friends.map((x) => x.uid))
  // A request whose friendship already exists is stale (e.g. accepted while offline); hide it.
  incoming = inc.docs.map((d) => d.data()).filter((r) => !ids.has(r.from))
  outgoing = out.docs.map((d) => d.data()).filter((r) => !ids.has(r.to))
}

export const getFriends = () => friends
export const getIncoming = () => incoming
export const getOutgoing = () => outgoing
export const getMe = () => me

// Returns a short message describing the outcome; throws with a user-facing message on refusal.
export async function sendRequest(email) {
  const key = emailKey(email)
  if (!key) throw new Error('Enter an email.')
  if (me.email && key === emailKey(me.email)) throw new Error("That's you.")
  const snap = await getDoc(doc(db, 'directory', key))
  if (!snap.exists()) throw new Error('No Forge user with that email.')
  const them = snap.data()
  if (friends.some((f) => f.uid === them.uid)) throw new Error(`${them.nickname} is already your friend.`)
  if (outgoing.some((r) => r.to === them.uid)) throw new Error(`Request to ${them.nickname} is already pending.`)
  const theirs = incoming.find((r) => r.from === them.uid)
  if (theirs) {
    await acceptRequest(theirs)
    return `${them.nickname} had already invited you. You're now friends.`
  }
  await setDoc(requestDoc(me.uid, them.uid), { from: me.uid, fromName: me.nickname, to: them.uid, toName: them.nickname, createdAt: new Date().toISOString() })
  await refreshFriends()
  return `Request sent to ${them.nickname}.`
}

export async function acceptRequest(r) {
  const since = new Date().toISOString()
  const batch = writeBatch(db)
  batch.set(friendDoc(me.uid, r.from), { uid: r.from, nickname: r.fromName, since })
  batch.set(friendDoc(r.from, me.uid), { uid: me.uid, nickname: me.nickname, since })
  batch.delete(requestDoc(r.from, me.uid))
  await batch.commit()
  await refreshFriends()
}

export async function declineRequest(r) {
  await deleteDoc(requestDoc(r.from, r.to))
  await refreshFriends()
}

export const cancelRequest = declineRequest

export async function removeFriend(uid) {
  const batch = writeBatch(db)
  batch.delete(friendDoc(me.uid, uid))
  batch.delete(friendDoc(uid, me.uid))
  await batch.commit()
  await refreshFriends()
}
