import { NextResponse } from 'next/server'
import { getSupabase } from '../../../lib/supabaseClient'
import { makeSessionToken, sessionCookieOptions } from '../../../lib/session'

export const dynamic = 'force-dynamic'

// HARDENED login endpoint.
// FIXES for broken authentication:
//  1) SINGLE generic error for every failure => no user enumeration.
//  2) Simple rate limiting per IP+email => brute force is throttled.
//  3) Signed, httpOnly session cookie (see lib/session.js).

// Very small in-memory rate limiter. (In production use Redis / an edge
// rate limiter; in-memory is fine to demonstrate the control.)
const attempts = new Map() // key -> { count, first }
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

function rateLimited(key) {
  const now = Date.now()
  const rec = attempts.get(key)
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now })
    return false
  }
  rec.count++
  return rec.count > MAX_ATTEMPTS
}

export async function POST(req) {
  const supabase = getSupabase()
  const { email, password } = await req.json()
  const ip = req.headers.get('x-forwarded-for') || 'local'
  const key = `${ip}:${(email || '').toLowerCase()}`

  const GENERIC = 'Invalid email or password'

  if (rateLimited(key)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // One code path, one message, whether or not the account exists.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.user) {
    return NextResponse.json({ error: GENERIC }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('sa_session', makeSessionToken(data.user.id), sessionCookieOptions())
  return res
}
