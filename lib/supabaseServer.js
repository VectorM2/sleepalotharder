import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY Supabase client (uses the service role key).
// It is imported only by server components and route handlers, so the key
// is NEVER sent to the browser. The app enforces authorisation in code
// (ownership checks + verified session), while Row Level Security
// independently protects the public REST API from the anon key.
//
// Do not add "use client" to any file that imports this.
export function getServerSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server only)')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
