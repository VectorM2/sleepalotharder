import Link from 'next/link'
import { getServerSupabase } from '../../../lib/supabaseServer'
import { getCurrentUid } from '../../../lib/session'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const uid = getCurrentUid()
  if (!uid) return <main className="container"><p className="notice">Please <Link href="/login">log in</Link>.</p></main>

  const supabase = getServerSupabase()
  const { data: orders } = await supabase
    .from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false })

  return (
    <main className="container">
      <h1>My orders</h1>
      <table>
        <thead><tr><th>Order id</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>
          {(orders || []).map(o => (
            <tr key={o.id}>
              <td><code>{o.id}</code></td>
              <td>R {Number(o.total).toFixed(2)}</td>
              <td>{o.status}</td>
              <td><a href={`/api/orders/${o.id}`} target="_blank">view JSON</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
        Requesting another user&apos;s order id from <code>/api/orders/&lt;id&gt;</code> now
        returns <code>403 Forbidden</code>.
      </p>
    </main>
  )
}
