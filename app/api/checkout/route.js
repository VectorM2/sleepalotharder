import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/supabaseServer'
import { getCurrentUid } from '../../../lib/session'

export const dynamic = 'force-dynamic'

// Uses the VERIFIED session uid as the buyer. Price is read from the DB,
// never trusted from the client.
export async function POST(req) {
  const uid = getCurrentUid()
  if (!uid) return NextResponse.json({ error: 'Please log in first' }, { status: 401 })

  try {
    const { product_id } = await req.json()
    const supabase = getServerSupabase()
    const { data: product, error: pErr } = await supabase
      .from('products').select('id,price').eq('id', product_id).single()
    if (pErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 400 })

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: uid, total: product.price, status: 'paid',
      shipping_address: '123 Demo Street, Testville',
    }).select().single()
    if (error) { console.error(error); return NextResponse.json({ error: 'Checkout failed' }, { status: 500 }) }

    await supabase.from('order_items').insert({
      order_id: order.id, product_id: product.id, quantity: 1, unit_price: product.price,
    })
    return NextResponse.json({ ok: true, order_id: order.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
