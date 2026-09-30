'use client'
import { useState } from 'react'

export default function BuyButton({ productId, price }) {
  const [msg, setMsg] = useState('')
  async function buy() {
    setMsg('Placing order...')
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) setMsg('Order placed! See it under My account.')
    else setMsg('Error: ' + (j.error || res.status))
  }
  return (
    <div style={{ marginTop: 16 }}>
      <button className="btn" onClick={buy}>Buy now — R {Number(price).toFixed(2)}</button>
      <span className="muted" style={{ marginLeft: 12 }}>{msg}</span>
    </div>
  )
}
