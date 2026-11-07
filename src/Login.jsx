import { useState } from 'react'
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth } from './firebase.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

  const signIn = (e) => {
    e.preventDefault()
    run(() => signInWithEmailAndPassword(auth, email.trim(), password))
  }
  const register = () => run(() => createUserWithEmailAndPassword(auth, email.trim(), password))
  const google = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()))
  const reset = () => run(async () => {
    if (!email.trim()) return setMessage({ error: true, text: 'Enter your email first.' })
    await sendPasswordResetEmail(auth, email.trim())
    setMessage({ text: 'Password reset email sent.' })
  })
  const filled = email && password

  return (
    <div className="screen" style={{ alignItems: 'stretch', textAlign: 'center' }}>
      <div className="logo">Forge</div>
      <Card className="flex flex-1 flex-col justify-center gap-5 p-6">
        <form className="flex flex-col gap-5" onSubmit={signIn}>
          <Input className="p-5 text-[1.25rem]" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input className="p-5 text-[1.25rem]" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" size="lg" disabled={busy || !filled}>Sign in</Button>
        </form>
        <Button variant="secondary" size="lg" disabled={busy || !filled} onClick={register}>Register</Button>
        <Button variant="outline" size="lg" disabled={busy} onClick={google}>Continue with Google</Button>
        <Button variant="muted" disabled={busy} onClick={reset}>Forgot password</Button>
        {message && <p className={message.error ? 'failed' : 'muted'} style={{ margin: 0, textAlign: 'center' }}>{message.text}</p>}
      </Card>
    </div>
  )
}
