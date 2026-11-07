import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// Web config is public by design; access is enforced by firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyAxeBuGmmTFple03teqnA3Q34bibg5kaiY',
  authDomain: 'forge-d3dec.firebaseapp.com',
  projectId: 'forge-d3dec',
  storageBucket: 'forge-d3dec.firebasestorage.app',
  messagingSenderId: '51357115917',
  appId: '1:51357115917:web:be132d62b89d1a4f319744',
})

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
})
