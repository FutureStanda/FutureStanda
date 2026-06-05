import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSessionUser, landingPathFor } from '@/lib/auth'

export default async function Home() {
  // Before Supabase is connected, show the live design preview (real app, demo data).
  if (!isSupabaseConfigured()) {
    redirect('/dashboard/briefing')
  }
  // Once connected: route by who's signed in (admin → command centre, client → their portal).
  const user = await getSessionUser()
  redirect(landingPathFor(user))
}
