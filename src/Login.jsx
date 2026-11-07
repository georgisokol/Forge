import { useState } from 'react'
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth } from './firebase.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ERRORS = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-email': 'That email looks invalid.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'No connection. Check your network.',
}
const errorText = (e) => ERRORS[e.code] ?? 'Something went wrong. Try again.'
const IGNORED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const run = async (fn) => {
    setBusy(true)
    setMessage(null)
    try { await fn() } catch (e) { if (!IGNORED.includes(e.code)) setMessage({ error: true, text: errorText(e) }) }
    setBusy(false)
  }

  const submit = (e) => {
    e.preventDefault()
    run(() => (mode === 'signin' ? signInWithEmailAndPassword : createUserWithEmailAndPassword)(auth, email.trim(), password))
  }
  const google = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()))
  const reset = () => run(async () => {
    if (!email.trim()) return setMessage({ error: true, text: 'Enter your email first.' })
    await sendPasswordResetEmail(auth, email.trim())
    setMessage({ text: 'Password reset email sent.' })
  })

  return (
    <div className="screen center">
      <div className="logo">Forge</div>
      <form className="split" onSubmit={submit}>
        <Input type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={busy || !email || !password}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
      </form>
      <Button variant="secondary" disabled={busy} onClick={google}>Continue with Google</Button>
      {message && <p className={message.error ? 'failed' : 'muted'} style={{ margin: 0 }}>{message.text}</p>}
      <p className="muted" style={{ margin: 0 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'signin' ? 'register' : 'signin'); setMessage(null) }}>
          {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </a>
        {mode === 'signin' && <> · <a href="#" onClick={(e) => { e.preventDefault(); reset() }}>Forgot password?</a></>}
      </p>
    </div>
  )
}
