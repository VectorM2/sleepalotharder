'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [raw, setRaw] = useState('')

  async function run(e) {
    e.preventDefault()
    const res = await fetch('/api/search?q=' + encodeURIComponent(q))
    const j = await res.json()
    setRaw(JSON.stringify(j, null, 2))
    setResults(j.results || [])
  }

  return (
    <main className="container">
      <h1>Search products</h1>
      <form onSubmit={run} style={{ display: 'flex', gap: 10, maxWidth: 560 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. pillow" />
        <button className="btn" type="submit">Search</button>
      </form>

      <div className="grid" style={{ marginTop: 20 }}>
        {results.map(p => (
          <Link key={p.id} href={`/product/${p.id}`} className="card">
            {p.image_url && <img src={p.image_url} alt={p.name} />}
            <h3 style={{ margin: '10px 0 4px' }}>{p.name}</h3>
            <div className="price">R {Number(p.price).toFixed(2)}</div>
          </Link>
        ))}
      </div>

      {raw && (
        <>
          <h3 style={{ marginTop: 28 }}>Raw API response</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0d1128', padding: 14, borderRadius: 10 }}>{raw}</pre>
        </>
      )}
    </main>
  )
}
