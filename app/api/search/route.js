import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

// HARDENED search endpoint.
// FIX (SQL Injection): the underlying DB function search_products() is now
// parameterized (see supabase/03_hardened_policies.sql), so `q` can never be
// parsed as SQL.
// FIX (verbose errors): return a generic message; log details server-side only.
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const supabase = getServerSupabase()
  const { data, error } = await supabase.rpc('search_products', { term: q })

  if (error) {
    console.error('search error', error) // server log only
    return NextResponse.json({ error: 'Search is unavailable right now.' }, { status: 500 })
  }
  return NextResponse.json({ results: data })
}
