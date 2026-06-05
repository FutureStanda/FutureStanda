import React from 'react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppProviders } from '@/components/layout/AppProviders'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSessionUser } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The command centre is admin-only. When Supabase is connected, enforce it:
  // signed-out users go to login; clients are sent to their own portal.
  if (isSupabaseConfigured()) {
    const user = await getSessionUser()
    if (!user) redirect('/login')
    if (user.profile?.role !== 'admin') {
      redirect(user.profile?.client_id ? `/portal/${user.profile.client_id}` : '/login')
    }
  }

  return (
    <AppProviders>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {children}
        </div>
      </div>
    </AppProviders>
  )
}
