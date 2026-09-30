import Link from 'next/link'
import { getServerSupabase } from '../lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = getServerSupabase()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  return (
    <main className="container">
      <h1>Sleep better tonight</h1>
      <p className="muted">Premium mattresses, pillows and sleep essentials.</p>

      {error && <p className="notice">Could not load products right now.</p>}

      <div className="grid" style={{ marginTop: 20 }}>
        {(products || []).map(p => (
          <Link key={p.id} href={`/product/${p.id}`} className="card">
            {p.image_url && <img src={p.image_url} alt={p.name} />}
            <h3 style={{ margin: '10px 0 4px' }}>{p.name}</h3>
            <div className="price">R {Number(p.price).toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
