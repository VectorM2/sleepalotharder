import { createClient } from '@supabase/supabase-js'

// Single anon-key client used by both client components and server routes.
// With RLS DISABLED in the vulnerable database, this public key can read and
// write every row — that is the broken-access-control / IDOR root cause.
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
}
