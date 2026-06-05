// Single source of truth for whether Supabase is wired up.
// Until the env vars are set (e.g. before the first Vercel deploy with secrets),
// the app gracefully falls back to the bundled demo data so previews never break.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Service-role key is server-only and used for admin operations
// (e.g. creating client portal logins). Never exposed to the browser.
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}
