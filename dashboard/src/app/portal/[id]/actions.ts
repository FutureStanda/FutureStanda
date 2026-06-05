'use server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export type PasswordState = { error: string | null; success: boolean }

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirm') || '')

  if (!isSupabaseConfigured()) {
    return { error: 'Password changes are available once the workspace is fully set up.', success: false }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', success: false }
  }
  if (password !== confirm) {
    return { error: 'Passwords don’t match.', success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You’re not signed in.', success: false }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message, success: false }

  return { error: null, success: true }
}
