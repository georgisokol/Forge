import { useEffect, useState } from 'react'
import Header from './Header.jsx'
import { acceptRequest, cancelRequest, declineRequest, getFriends, getIncoming, getOutgoing, refreshFriends, removeFriend, sendRequest } from './friends.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Confirm } from '@/components/ui/confirm'

export default function Friends({ onBack }) {
  const [, setTick] = useState(0)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const rerender = () => setTick((t) => t + 1)

  useEffect(() => { refreshFriends().then(rerender).catch(console.error) }, [])

  const run = async (fn) => {
    setBusy(true)
    setMessage(null)
    try {
      const text = await fn()
      if (text) setMessage({ text })
    } catch (e) {
      console.error(e)
      setMessage({ error: true, text: e.message?.length < 80 ? e.message : 'Something went wrong. Try again.' })
    }
    setBusy(false)
    rerender()
  }

  const send = (e) => {
    e.preventDefault()
    run(async () => { const text = await sendRequest(email); setEmail(''); return text })
  }

  const friends = getFriends()
  const incoming = getIncoming()
  const outgoing = getOutgoing()

  return (
    <div className="screen">
      <Header title="Friends" onBack={onBack} />
      <form className="flex flex-col gap-3" onSubmit={send}>
        <Input type="email" autoComplete="off" placeholder="Friend's email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={busy || !email.trim()}>Send request</Button>
      </form>
      {message && <p className={message.error ? 'failed' : 'muted'} style={{ margin: 0, textAlign: 'center' }}>{message.text}</p>}

      {incoming.length > 0 && (
        <Card>
          <h2 className="label">Requests</h2>
          {incoming.map((r) => (
            <div className="friend-row" key={r.from}>
              <span>{r.fromName}</span>
              <div className="actions">
                <Button size="sm" variant="muted" disabled={busy} onClick={() => run(() => declineRequest(r))}>Decline</Button>
                <Button size="sm" disabled={busy} onClick={() => run(() => acceptRequest(r))}>Accept</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <h2 className="label">Friends</h2>
        {friends.length === 0 && <p className="muted" style={{ margin: 0 }}>No friends yet. Add someone by the email they use for Forge.</p>}
        {friends.map((f) => (
          <div className="friend-row" key={f.uid}>
            <span>{f.nickname}</span>
            <Confirm
              title={`Remove ${f.nickname}?`}
              description="Workouts you already did together stay in both histories."
              confirmLabel="Remove"
              onConfirm={() => run(() => removeFriend(f.uid))}
              trigger={<Button size="sm" variant="muted" disabled={busy}>Remove</Button>}
            />
          </div>
        ))}
      </Card>

      {outgoing.length > 0 && (
        <Card>
          <h2 className="label">Pending</h2>
          {outgoing.map((r) => (
            <div className="friend-row" key={r.to}>
              <span className="muted">{r.toName}</span>
              <Button size="sm" variant="muted" disabled={busy} onClick={() => run(() => cancelRequest(r))}>Cancel</Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// "Who's training?" step before a shuffle session. Calls onContinue with the picked friends ([] = solo).
export function CrewPicker({ onBack, onContinue }) {
  const [picked, setPicked] = useState([])
  const friends = getFriends()
  const toggle = (uid) => setPicked(picked.includes(uid) ? picked.filter((x) => x !== uid) : [...picked, uid])
  return (
    <div className="screen">
      <Header title="Who's training?" onBack={onBack} />
      <p className="muted" style={{ margin: 0 }}>One phone logs for everyone. Each friend gets the workout in their own history.</p>
      {friends.map((f) => (
        <Button key={f.uid} variant={picked.includes(f.uid) ? 'default' : 'secondary'} onClick={() => toggle(f.uid)}>
          {picked.includes(f.uid) ? '✓ ' : ''}{f.nickname}
        </Button>
      ))}
      <div style={{ flex: 1 }} />
      <Button onClick={() => onContinue(friends.filter((f) => picked.includes(f.uid)))}>
        {picked.length ? `Continue · ${picked.length + 1} people` : 'Continue solo'}
      </Button>
    </div>
  )
}
