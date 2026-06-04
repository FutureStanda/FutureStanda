import React from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppProviders } from '@/components/layout/AppProviders'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
