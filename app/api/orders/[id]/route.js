import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../../lib/supabaseServer'
import { getCurrentUid } from '../../../../lib/session'

export const dynamic = 'force-dynamic'

// HARDENED: the IDOR fix.
// Requires a verified session AND checks that the order belongs to the
// caller before returning it. (RLS on the database is the second layer:
// the anon key cannot read other users' orders via the REST API either.)
export async function GET(req, { params }) {
  const uid = getCurrentUid()
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const supabase = getServerSupabase()
  const { data: order, error } = await supabase
    .from('orders').select('*').eq('id', params.id).single()

  if (error || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ownership check — the essential fix.
  if (order.user_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: items } = await supabase
    .from('order_items').select('*, products(name)').eq('order_id', params.id)

  return NextResponse.json({ order, items })
}
