import './globals.css'
import Link from 'next/link'
import { getCurrentUid } from '../lib/session'
import { getServerSupabase } from '../lib/supabaseServer'

export const metadata = {
  title: 'SleepALot — sleep better, live better',
  description: 'Mattresses, pillows and sleep essentials.',
}

const ICON = {
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  account: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
  login: (<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></>),
  signup: (<><circle cx="9" cy="8" r="4" /><path d="M3 21c0-4 3-6 6-6s6 2 6 6" /><path d="M19 8v6" /><path d="M22 11h-6" /></>),
  logout: (<><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
}
function Svg({ p }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>
  )
}

export default async function RootLayout({ children }) {
  const uid = getCurrentUid()
  let email = null
  if (uid) {
    try {
      const supabase = getServerSupabase()
      const { data } = await supabase.from('profiles').select('email').eq('id', uid).single()
      email = data?.email || null
    } catch {}
  }

  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <Link className="brand" href="/">Sleep<span>ALot</span></Link>
            <Link className="navbtn" href="/search"><Svg p={ICON.search} /> Search</Link>
            <Link className="navbtn" href="/account"><Svg p={ICON.account} /> My account</Link>
            <div className="grow" />
            {uid ? (
              <>
                <span className="userchip">Signed in as <strong>{email || 'user'}</strong></span>
                <a className="navbtn" href="/api/logout"><Svg p={ICON.logout} /> Log out</a>
              </>
            ) : (
              <>
                <Link className="navbtn" href="/login"><Svg p={ICON.login} /> Log in</Link>
                <Link className="navbtn primary" href="/signup"><Svg p={ICON.signup} /> Sign up</Link>
              </>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
