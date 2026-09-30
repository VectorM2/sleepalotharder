import { NextResponse } from 'next/server'
import DOMPurify from 'isomorphic-dompurify'
import { getServerSupabase } from '../../../lib/supabaseServer'
import { getCurrentUid } from '../../../lib/session'

export const dynamic = 'force-dynamic'

// HARDENED reviews endpoint.
// FIXES:
//  * requires a VERIFIED session (no anonymous posting),
//  * SANITISES the body (strip all HTML) before storing => no stored XSS,
//  * sets user_id from the server session, not from the request body.
export async function POST(req) {
  const uid = getCurrentUid()
  if (!uid) return NextResponse.json({ error: 'Please log in to review.' }, { status: 401 })

  try {
    const { product_id, author_name, body, rating } = await req.json()

    // Strip ALL tags/attributes — reviews are plain text.
    const cleanBody = DOMPurify.sanitize(String(body || ''), {
      ALLOWED_TAGS: [], ALLOWED_ATTR: [],
    })
    const cleanAuthor = DOMPurify.sanitize(String(author_name || 'Anonymous'), {
      ALLOWED_TAGS: [], ALLOWED_ATTR: [],
    }).slice(0, 60)
    const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5))

    if (!product_id || !cleanBody.trim()) {
      return NextResponse.json({ error: 'Missing review text.' }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { error } = await supabase.from('reviews').insert({
      product_id,
      user_id: uid,             // from the verified session
      author_name: cleanAuthor,
      body: cleanBody,          // sanitised
      rating: cleanRating,
    })
    if (error) { console.error(error); return NextResponse.json({ error: 'Could not save review.' }, { status: 500 }) }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
}
