'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { landingPathFor, getSessionUser } from '@/lib/auth'

export type AuthState = { error: string | null }

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  // Demo mode (Supabase not connected yet): just open the dashboard preview.
  if (!isSupabaseConfigured()) {
    redirect('/dashboard/briefing')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }

  const user = await getSessionUser()
  redirect(landingPathFor(user))
}
