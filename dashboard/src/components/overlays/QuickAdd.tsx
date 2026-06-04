'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icons'

interface Props { open: boolean; onClose: () => void; onNewLead?: () => void; onNewTask?: () => void; onNewClient?: () => void }

export function QuickAdd({ open, onClose, onNewLead, onNewTask, onNewClient }: Props) {
  const router = useRouter()
  if (!open) return null

  const items = [
    { icon: 'inbox', label: 'New lead', sub: 'Add to pipeline', color: '#5BCEFA', action: onNewLead },
    { icon: 'checkSquare', label: 'New task', sub: 'Add to workspace', color: 'var(--lime)', action: onNewTask },
    { icon: 'users', label: 'New client', sub: 'Start onboarding', color: '#4FE3C1', action: onNewClient },
    { icon: 'doc', label: 'New page', sub: 'Blank document', color: '#8B7CFF', action: () => { router.push('/dashboard/docs'); onClose() } },
    { icon: 'folder', label: 'New resource', sub: 'Script, SOP, doc', color: '#FFB347', action: () => { router.push('/dashboard/resources'); onClose() } },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 420, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 8, boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <span style={{ font: '600 14px var(--font-sans)' }}>Quick add</span>
        </div>
        {items.map(item => (
          <button key={item.label} onClick={() => { item.action?.(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', textAlign: 'left', background: 'transparent', transition: 'background .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: 36, height: 36, borderRadius: 10, background: item.color + '22', border: `1px solid ${item.color}44`, color: item.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={item.icon} size={16} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ font: '600 13.5px var(--font-sans)' }}>{item.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
