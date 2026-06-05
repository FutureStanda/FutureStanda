import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSessionUser } from '@/lib/auth'
import { TASKS, getClient } from '@/lib/data'
import type { Client, Task } from '@/types'
import { PortalView } from './PortalView'

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
      Client not found. <Link href="/dashboard" style={{ color: 'var(--lime)', marginLeft: 8 }}>← Back</Link>
    </div>
  )
}

export default async function ClientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── Demo mode (no Supabase yet): render from bundled data, no auth. ──
  if (!isSupabaseConfigured()) {
    const c = getClient(id)
    if (!c) return <NotFound />
    const tasks = TASKS.filter(t => t.client_id === c.id && t.status !== 'done')
    return <PortalView client={c} tasks={tasks} viewer="demo" email={null} />
  }

  // ── Live mode: require auth + enforce role access. ──
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const role = user.profile?.role
  // A client may only ever view their own portal.
  if (role === 'client' && user.profile?.client_id !== id) {
    redirect(user.profile?.client_id ? `/portal/${user.profile.client_id}` : '/login')
  }
  // Anyone who is neither an admin nor the matching client is denied.
  if (role !== 'admin' && role !== 'client') redirect('/login')

  const supabase = await createClient()
  const { data: clientRow } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!clientRow) {
    // Fall back to seed data if the row isn't in the DB yet (admin viewing).
    const seeded = getClient(id)
    if (!seeded) return <NotFound />
    const tasks = TASKS.filter(t => t.client_id === seeded.id && t.status !== 'done')
    return <PortalView client={seeded} tasks={tasks} viewer={role === 'admin' ? 'admin' : 'client'} email={user.email} />
  }

  const { data: taskRows } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', id)
    .neq('status', 'done')
    .order('created_at', { ascending: false })

  const client = clientRow as unknown as Client
  const tasks = (taskRows ?? []) as unknown as Task[]

  return <PortalView client={client} tasks={tasks} viewer={role === 'admin' ? 'admin' : 'client'} email={user.email} />
}

// Portal is always rendered at request time (auth + live data).
export const dynamic = 'force-dynamic'
