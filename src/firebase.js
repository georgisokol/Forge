import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// `npm run dev:local` talks to the local Firebase emulators (`npm run emulators`) under a fake demo project,
// so nothing touches the real one.
const EMULATED = import.meta.env.VITE_EMULATORS === '1'

// Web config is public by design; access is enforced by firestore.rules.
const app = initializeApp(EMULATED ? { apiKey: 'demo', authDomain: 'demo-forge.firebaseapp.com', projectId: 'demo-forge' } : {
  apiKey: 'AIzaSyAxeBuGmmTFple03teqnA3Q34bibg5kaiY',
  authDomain: 'forge-d3dec.firebaseapp.com',
  projectId: 'forge-d3dec',
  storageBucket: 'forge-d3dec.firebasestorage.app',
  messagingSenderId: '51357115917',
  appId: '1:51357115917:web:be132d62b89d1a4f319744',
})

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: EMULATED ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
})

if (EMULATED) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
