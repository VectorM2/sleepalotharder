import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

// HARDENED signup. Runs server-side with the service role so the profile row
// is created under a policy-protected table (the browser anon key cannot
// insert profiles once RLS is on). Basic input validation included.
export async function POST(req) {
  try {
    const { email, password, full_name } = await req.json()
    if (!email || !password || String(password).length < 8) {
      return NextResponse.json(
        { error: 'A valid email and an 8+ character password are required.' },
        { status: 400 }
      )
    }
    const supabase = getServerSupabase()
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: full_name || '' },
    })
    if (error) {
      // Generic-ish: don't reveal whether the email already exists.
      console.error('signup', error)
      return NextResponse.json({ error: 'Could not create account.' }, { status: 400 })
    }
    await supabase.from('profiles').insert({
      id: data.user.id, email, full_name: full_name || '', role: 'customer',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
}
