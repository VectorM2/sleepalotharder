import { getServerSupabase } from '../../../lib/supabaseServer'
import ReviewForm from './ReviewForm'
import BuyButton from './BuyButton'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }) {
  const supabase = getServerSupabase()
  const { data: product } = await supabase
    .from('products').select('*').eq('id', params.id).single()
  const { data: reviews } = await supabase
    .from('reviews').select('*').eq('product_id', params.id)
    .order('created_at', { ascending: false })

  if (!product) return <main className="container"><p>Product not found.</p></main>

  return (
    <main className="container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {product.image_url && <img src={product.image_url} alt={product.name}
          style={{ width: '100%', borderRadius: 14 }} />}
        <div>
          <h1>{product.name}</h1>
          <div className="price" style={{ fontSize: 24 }}>R {Number(product.price).toFixed(2)}</div>
          <p className="muted">{product.description}</p>
          <p><span className="tag">{product.stock} in stock</span></p>
          <BuyButton productId={product.id} price={product.price} />
        </div>
      </div>

      <h2 style={{ marginTop: 36 }}>Reviews</h2>
      {(reviews || []).map(r => (
        <div key={r.id} className="review">
          <strong>{r.author_name}</strong> <span className="muted">· {'★'.repeat(r.rating)}</span>
          {/*
            FIX (stored XSS): render the review body as TEXT, not HTML.
            React escapes this automatically, so any tags are shown as plain
            characters and never execute. (Input is also sanitised on save,
            and the CSP blocks inline scripts — defence in depth.)
          */}
          <p style={{ whiteSpace: 'pre-wrap' }}>{r.body}</p>
        </div>
      ))}

      <h3 style={{ marginTop: 28 }}>Leave a review</h3>
      <ReviewForm productId={product.id} />
    </main>
  )
}
