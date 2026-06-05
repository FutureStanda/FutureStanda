import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'client'
  client_id: string | null
}

export type SessionUser = {
  id: string
  email: string | null
  profile: Profile | null
}

// Returns the signed-in user + their profile (role, client_id), or null.
// Returns null when Supabase isn't configured yet (demo mode).
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, client_id')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
  }
}

// Where a given user should land after auth, based on role.
export function landingPathFor(user: SessionUser | null): string {
  if (!user) return '/login'
  if (user.profile?.role === 'client' && user.profile.client_id) {
    return `/portal/${user.profile.client_id}`
  }
  return '/dashboard/briefing'
}
