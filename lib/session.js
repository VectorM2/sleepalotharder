import { cookies } from 'next/headers'
import crypto from 'crypto'

// HARDENED session handling.
// FIX for broken authentication / session management.
// The session cookie `sa_session` is:
//   * httpOnly  => not readable from JavaScript (blunts XSS cookie theft),
//   * signed with an HMAC over the user id => cannot be forged or swapped
//     to another user's id without the server secret.
// getCurrentUid() returns a uid ONLY if the signature verifies.

const SECRET = process.env.SESSION_SECRET || 'dev-only-change-me'

function sign(uid) {
  const sig = crypto.createHmac('sha256', SECRET).update(uid).digest('base64url')
  return `${uid}.${sig}`
}

export function makeSessionToken(uid) {
  return sign(uid)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}

export function getCurrentUid() {
  const raw = cookies().get('sa_session')?.value
  if (!raw) return null
  const idx = raw.lastIndexOf('.')
  if (idx < 0) return null
  const uid = raw.slice(0, idx)
  const sig = raw.slice(idx + 1)
  const expected = crypto.createHmac('sha256', SECRET).update(uid).digest('base64url')
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  return uid
}
