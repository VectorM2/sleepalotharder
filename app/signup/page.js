'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setMsg('Creating account...')
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) { setMsg('Account created. You can now log in.'); setTimeout(() => router.push('/login'), 900) }
    else setMsg(j.error || 'Sign up failed')
  }

  return (
    <main className="container" style={{ maxWidth: 440 }}>
      <h1>Create your account</h1>
      <form onSubmit={submit}>
        <label>Full name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} />
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <label>Password (min 8 chars)</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ marginTop: 16 }}><button className="btn" type="submit">Sign up</button></div>
      </form>
      {msg && <p className="notice" style={{ marginTop: 16 }}>{msg}</p>}
    </main>
  )
}
