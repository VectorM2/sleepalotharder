import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Clears the signed session cookie and returns home.
export async function GET(req) {
  const res = NextResponse.redirect(new URL('/', req.url))
  res.cookies.set('sa_session', '', { path: '/', maxAge: 0 })
  return res
}
