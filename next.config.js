/** @type {import('next').NextConfig} */
// HARDENED build: adds security response headers to every route.
// FIX for the "missing security headers" part of the misconfiguration finding.
const securityHeaders = [
  // Stop the site being framed => clickjacking protection.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Don't let browsers MIME-sniff responses.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS for a year (only takes effect over HTTPS).
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Limit referrer leakage.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down powerful browser features.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // A conservative Content-Security-Policy. Note: no 'unsafe-inline' for
  // scripts, so an injected <script> or onerror handler will not run — this
  // is defence-in-depth against XSS on top of output sanitisation.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
