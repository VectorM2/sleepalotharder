'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setMsg('Checking...')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) { router.push('/account'); router.refresh() }
    else setMsg(j.error || 'Login failed') // shows the verbose, enumerable message
  }

  return (
    <main className="container" style={{ maxWidth: 440 }}>
      <h1>Log in</h1>
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ marginTop: 16 }}><button className="btn" type="submit">Log in</button></div>
      </form>
      {msg && <p className="notice" style={{ marginTop: 16 }}>{msg}</p>}
    </main>
  )
}
