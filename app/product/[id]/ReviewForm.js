'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewForm({ productId }) {
  const router = useRouter()
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [rating, setRating] = useState(5)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg('Saving...')
    let res
    try {
      res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, author_name: author, body, rating }),
      })
    } catch (e) {
      setMsg(''); setErr('Network error: ' + String(e)); return
    }
    if (res.ok) {
      setMsg('Saved!'); setBody('')
      router.refresh()
    } else {
      const j = await res.json().catch(() => ({}))
      setMsg('')
      setErr(res.status === 401 ? 'Please log in to leave a review.' : ('Could not save review: ' + (j.error || res.status)))
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 520 }}>
      <label>Your name</label>
      <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Jane" />
      <label>Rating</label>
      <input type="number" min="1" max="5" value={rating}
        onChange={e => setRating(Number(e.target.value))} />
      <label>Review</label>
      <textarea rows={3} value={body} onChange={e => setBody(e.target.value)}
        placeholder="What did you think?" />
      <div style={{ marginTop: 12 }}>
        <button className="btn" type="submit">Post review</button>
        {msg && <span style={{ marginLeft: 12, color: 'var(--accent2)' }}>{msg}</span>}
      </div>
      {err && (
        <p className="notice" style={{ marginTop: 12, borderColor: '#ff6b6b', color: '#ffb3b3' }}>
          {err}
        </p>
      )}
    </form>
  )
}
