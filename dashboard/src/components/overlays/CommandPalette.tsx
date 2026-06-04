'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { CLIENTS, TASKS } from '@/lib/data'

const NAV_ITEMS = [
  { label: 'Briefing', icon: 'home', href: '/dashboard/briefing' },
  { label: 'Clients', icon: 'users', href: '/dashboard/clients' },
  { label: 'Leads', icon: 'inbox', href: '/dashboard/leads' },
  { label: 'Tasks', icon: 'checkSquare', href: '/dashboard/tasks' },
  { label: 'Marketing', icon: 'megaphone', href: '/dashboard/marketing' },
  { label: 'Objectives', icon: 'target', href: '/dashboard/objectives' },
  { label: 'Automations', icon: 'refresh', href: '/dashboard/automations' },
  { label: 'Agents', icon: 'sparkle', href: '/dashboard/agents' },
  { label: 'Resources', icon: 'folder', href: '/dashboard/resources' },
  { label: 'Pages', icon: 'doc', href: '/dashboard/docs' },
  { label: 'Integrations', icon: 'plug', href: '/dashboard/integrations' },
]

interface Props { open: boolean; onClose: () => void; onNewLead?: () => void; onNewTask?: () => void }

export function CommandPalette({ open, onClose, onNewLead, onNewTask }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  if (!open) return null

  const q = query.toLowerCase()

  const results = [
    ...NAV_ITEMS.filter(n => n.label.toLowerCase().includes(q)).map(n => ({
      id: n.href, label: n.label, icon: n.icon, group: 'Pages',
      action: () => { router.push(n.href); onClose() },
    })),
    ...CLIENTS.filter(c => c.name.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)).slice(0, 5).map(c => ({
      id: c.id, label: c.name, sub: `${c.city} · ${c.niche}`, group: 'Clients',
      action: () => { router.push(`/dashboard/clients/${c.id}`); onClose() },
      color: c.color,
    })),
    ...(!q ? [
      { id: 'new-task', label: 'New task', icon: 'plus', group: 'Actions', action: () => { onNewTask?.(); onClose() } },
      { id: 'new-lead', label: 'New lead', icon: 'inbox', group: 'Actions', action: () => { onNewLead?.(); onClose() } },
    ] : []),
  ]

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) { results[selected].action() }
    if (e.key === 'Escape') onClose()
  }

  const groups = [...new Set(results.map(r => r.group))]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', paddingTop: '15vh' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 560, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', borderRadius: 16, boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <Icon name="search" size={16} color="var(--text-3)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, clients, tasks…"
            style={{ flex: 1, height: 52, background: 'transparent', border: 'none', outline: 'none', font: '400 15px var(--font-sans)', color: 'var(--text)' }}
          />
          <kbd style={{ font: '500 11px var(--font-sans)', color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 8 }}>
          {results.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No results for "{query}"</div>
          )}
          {groups.map(group => (
            <div key={group}>
              <div style={{ padding: '6px 10px 4px', font: '600 10.5px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{group}</div>
              {results.filter(r => r.group === group).map((r, i) => {
                const idx = results.indexOf(r)
                return (
                  <button key={r.id} onMouseEnter={() => setSelected(idx)} onClick={r.action} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', background: idx === selected ? 'var(--bg-active)' : 'transparent', color: 'var(--text)' }}>
                    {(r as any).color
                      ? <span style={{ width: 20, height: 20, borderRadius: 6, background: (r as any).color, font: '700 9px var(--font-sans)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>{r.label[0]}</span>
                      : <Icon name={(r as any).icon || 'arrowR'} size={15} color="var(--text-2)" />
                    }
                    <span style={{ flex: 1, fontSize: 13.5 }}>{r.label}</span>
                    {(r as any).sub && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{(r as any).sub}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
