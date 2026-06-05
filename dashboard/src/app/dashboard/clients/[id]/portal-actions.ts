'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured, hasServiceRole } from '@/lib/supabase/config'
import { getSessionUser } from '@/lib/auth'

export type CreateLoginState = {
  error: string | null
  ok: boolean
  email?: string
}

// Admin-only: creates (or repoints) a client portal login bound to one client.
export async function createPortalLogin(_prev: CreateLoginState, formData: FormData): Promise<CreateLoginState> {
  const clientId = String(formData.get('clientId') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!isSupabaseConfigured() || !hasServiceRole()) {
    return { error: 'Connect Supabase (and add the service-role key) to create client logins.', ok: false }
  }

  // Only an admin may create logins.
  const me = await getSessionUser()
  if (me?.profile?.role !== 'admin') {
    return { error: 'Only an admin can create client logins.', ok: false }
  }

  if (!clientId) return { error: 'Missing client.', ok: false }
  if (!email) return { error: 'Enter the client’s email.', ok: false }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.', ok: false }

  const admin = createAdminClient()

  // Create the auth user with role + client_id in metadata.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', client_id: clientId },
  })

  if (createErr || !created?.user) {
    return { error: createErr?.message || 'Could not create the login.', ok: false }
  }

  // Ensure the profile is correct even if the DB trigger differs.
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({ id: created.user.id, email, role: 'client', client_id: clientId }, { onConflict: 'id' })

  if (profileErr) {
    return { error: `Login created, but profile sync failed: ${profileErr.message}`, ok: false }
  }

  return { error: null, ok: true, email }
}
