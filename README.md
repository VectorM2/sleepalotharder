# SleepALot — hardened build (sleepalotharder)

The **secure** counterpart of the vulnerable SleepALot app. Same features, but the
vulnerabilities are fixed: parameterized queries, output sanitisation + CSP,
ownership checks + Row Level Security, generic auth errors + rate limiting +
signed httpOnly sessions, and security headers. The assignment's attacks should
**fail** against this build.

## Stack
- Next.js 14 (App Router), React
- Supabase (PostgreSQL, Auth, auto REST API) with RLS enabled
- Server-side data access uses the service role key; authorization is enforced in code

## 1. Create the Supabase project
1. Create a new project (a separate one from the vulnerable app is cleanest).
2. **SQL Editor** → run, in order:
   - `supabase/01_schema.sql`
   - `supabase/03_hardened_policies.sql`  (enables RLS, parameterized search, private bucket)
3. **Project Settings → API** → copy the Project URL, the `anon` key, and the
   `service_role` key.
   (Email confirmation can stay on; signup here is handled server-side.)

## 2. Seed data + test users
```bash
cd seed
cp .env.example .env      # set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run seed
node add_users.mjs        # adds vectorm@sleepalot.test and mathabela@sleepalot.test
```
Demo accounts use the password `Password123!`.
(Run `supabase/04_update_images.sql` if you need to refresh existing product images.)

## 3. Run locally
```bash
cp .env.local.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL       = your project URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY  = anon public key
#   SUPABASE_SERVICE_ROLE_KEY      = service role key (SERVER ONLY)
#   SESSION_SECRET                 = long random string (openssl rand -base64 32)
npm install
npm run dev                        # http://localhost:3001
```

## 4. Deploy (Netlify or Vercel)
1. Push this folder to its own GitHub repo and import it.
2. Framework: Next.js (auto-detected). Build: `next build`.
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`  (server-only — **never** prefix with NEXT_PUBLIC)
   - `SESSION_SECRET`             (long random string)
4. Deploy. Ensure the Supabase project has `03_hardened_policies.sql` applied.

> Because the service role key is used only in server code and RLS is enabled, the
> public REST API is locked down and the app-level checks stop the attacks that
> work against the vulnerable build.
