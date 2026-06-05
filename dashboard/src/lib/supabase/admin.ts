import { createClient } from '@supabase/supabase-js'

// Server-only admin client (service-role key). Bypasses RLS — use ONLY in
// trusted server code (server actions / route handlers) after an admin check.
// Used to create client portal logins and seed data.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
