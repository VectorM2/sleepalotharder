/**
 * SleepALot — add specific test users (non-destructive).
 * Adds vectorm@sleepalot.test and mathabela@sleepalot.test (or any emails you
 * pass as arguments) as confirmed users with a profile row. Existing users are
 * left alone.
 *
 * Uses the SERVICE ROLE key (local use only — never ship it to the browser).
 *
 * Usage:
 *   cp .env.example .env    # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   npm install
 *   node add_users.mjs                        # adds the two default users
 *   node add_users.mjs alice@sleepalot.test   # or add your own list
 *   DEMO_PASSWORD='S0mePass!' node add_users.mjs
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PASSWORD = process.env.DEMO_PASSWORD || 'Password123!'

if (!URL || !SERVICE_KEY) {
  console.error('\nMissing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in seed/.env\n')
  process.exit(1)
}

// Default users to add (override by passing emails as CLI arguments).
const DEFAULT_EMAILS = ['vectorm@sleepalot.test', 'mathabela@sleepalot.test']
const emails = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_EMAILS

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function nameFromEmail(email) {
  const base = email.split('@')[0].replace(/[._-]+/g, ' ')
  return base.replace(/\b\w/g, c => c.toUpperCase())
}

async function findUserByEmail(email) {
  // paginate through users looking for a match
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = (data?.users || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (!data || data.users.length < 200) break
  }
  return null
}

async function addUser(email) {
  const existing = await findUserByEmail(email)
  if (existing) {
    console.log(`= exists : ${email} (leaving as-is)`)
    // make sure a profile row exists
    await admin.from('profiles').upsert({
      id: existing.id, email, full_name: nameFromEmail(email), role: 'customer',
    })
    return
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { full_name: nameFromEmail(email) },
  })
  if (error) { console.warn(`! failed : ${email} — ${error.message}`); return }
  await admin.from('profiles').insert({
    id: data.user.id, email, full_name: nameFromEmail(email), role: 'customer',
  })
  console.log(`+ added  : ${email}`)
}

async function main() {
  console.log(`Adding ${emails.length} user(s) with password: ${PASSWORD}`)
  console.log('-----------------------------------------------')
  for (const e of emails) await addUser(e)
  console.log('-----------------------------------------------')
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
