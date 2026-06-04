'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { CLIENTS, TASKS, LEADS_DATA } from '@/lib/data'
import { useUI } from '@/store/use-store'
import { cn } from '@/lib/utils'

function NavRow({ icon, label, href, active, trailing, emoji, indent }: {
  icon?: string; label: string; href: string; active?: boolean; trailing?: React.ReactNode; emoji?: string; indent?: boolean
}) {
  return (
    <Link href={href} className={cn('sb-row', active && 'sb-row-active')} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      height: 32, padding: indent ? '0 10px 0 30px' : '0 10px', borderRadius: 8,
      textDecoration: 'none',
      background: active ? 'var(--bg-active)' : 'transparent',
      color: active ? 'var(--text)' : 'var(--text-2)',
      transition: 'background .12s ease, color .12s ease',
      position: 'relative',
    }}>
      {active && <span style={{ position: 'absolute', left: -10, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--lime)' }} />}
      {emoji
        ? <span style={{ width: 16, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>{emoji}</span>
        : icon ? <Icon name={icon} size={15} /> : null
      }
      <span style={{ flex: 1, font: `${active ? 600 : 500} 13px var(--font-sans)`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {trailing != null && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{trailing}</span>}
    </Link>
  )
}

function SectionToggle({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', height: 26, marginTop: 4 }}>
      <button onClick={onToggle} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: 'var(--text-3)', font: '600 10.5px var(--font-sans)', letterSpacing: '0.12em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease', display: 'inline-flex' }}>
          <Icon name="chevR" size={12} />
        </span>
        {label}
      </button>
    </div>
  )
}

function AccountMenu({ onClose }: { onClose: () => void }) {
  const items: Array<[string, string, string?]> = [
    ['settings', 'Settings', '⌘,'],
    ['globe', 'Language'],
    ['shield', 'Get help'],
  ]
  const items2: Array<[string, string]> = [
    ['bolt', 'Upgrade plan'],
    ['plug', 'Get apps & extensions'],
    ['star', 'Refer & earn credit'],
    ['sparkle', "What's new"],
  ]
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
      <div style={{
        position: 'absolute', bottom: '100%', left: 12, right: 12, zIndex: 70,
        background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12,
        boxShadow: 'var(--shadow-modal)', marginBottom: 6, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="avatar" style={{ background: '#cfff3a', width: 30, height: 30 }}>B</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span style={{ font: '600 12px var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>bartekstanda@icloud.com</span>
            <span style={{ fontSize: 10.5, color: 'var(--lime)' }}>STANDA · Max plan</span>
          </div>
        </div>
        <div style={{ padding: '6px' }}>
          {items.map(([icon, label, right]) => (
            <button key={label} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, color: 'var(--text-2)', font: '500 12.5px var(--font-sans)', textAlign: 'left' }}>
              <Icon name={icon} size={14} />
              <span style={{ flex: 1 }}>{label}</span>
              {right && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{right}</span>}
            </button>
          ))}
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '0 6px' }} />
        <div style={{ padding: '6px' }}>
          {items2.map(([icon, label]) => (
            <button key={label} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, color: 'var(--text-2)', font: '500 12.5px var(--font-sans)' }}>
              <Icon name={icon} size={14} />
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '0 6px' }} />
        <div style={{ padding: '6px' }}>
          <Link href="/login" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, color: 'var(--red)', font: '500 12.5px var(--font-sans)', textDecoration: 'none' }}>
            <Icon name="logout" size={14} />
            <span>Log out</span>
          </Link>
        </div>
      </div>
    </>
  )
}

function PinnedClientRow({ c, isActive }: { c: (typeof CLIENTS)[number]; isActive: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={`/dashboard/clients/${c.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%', height: 30,
        padding: '0 10px', borderRadius: 8, textDecoration: 'none',
        background: isActive ? 'var(--bg-active)' : hovered ? 'var(--bg-2)' : 'transparent',
        color: isActive ? 'var(--text)' : 'var(--text-2)',
        transition: 'background .12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color, flexShrink: 0 }} />
      <span style={{ flex: 1, font: '500 12.5px var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
      {c.flag === 'At risk' && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--red)', flexShrink: 0 }} />}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { setQuickOpen, setSidebarCollapsed, sidebarCollapsed } = useUI()
  const [openWork, setOpenWork] = useState(true)
  const [openClients, setOpenClients] = useState(true)
  const [openDB, setOpenDB] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const pendingTotal = TASKS.filter(t => t.status !== 'done').length
  const activeLeadsCount = LEADS_DATA.leads.filter(l => !['won', 'lost'].includes(l.stage)).length
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const navLinks = [
    { icon: 'home', label: 'Briefing', href: '/dashboard/briefing' },
    { icon: 'users', label: 'Clients', href: '/dashboard/clients', trailing: <span className="chip chip-dim" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>{CLIENTS.length}</span> },
    { icon: 'inbox', label: 'Leads', href: '/dashboard/leads', trailing: <span className="chip chip-lime" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>{activeLeadsCount}</span> },
    { icon: 'checkSquare', label: 'Tasks', href: '/dashboard/tasks', trailing: <span className="chip chip-lime" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>{pendingTotal}</span> },
    { icon: 'megaphone', label: 'Marketing', href: '/dashboard/marketing' },
    { icon: 'target', label: 'Objectives', href: '/dashboard/objectives' },
    { icon: 'refresh', label: 'Automations', href: '/dashboard/automations' },
    { icon: 'sparkle', label: 'Agents', href: '/dashboard/agents' },
    { icon: 'plug', label: 'Integrations', href: '/dashboard/integrations' },
  ]

  return (
    <aside style={{
      width: sidebarCollapsed ? 52 : 220,
      minWidth: sidebarCollapsed ? 52 : 220,
      background: 'linear-gradient(180deg, #0d0f0d, #0a0b0a)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      transition: 'width .2s ease, min-width .2s ease',
      flexShrink: 0,
    }}>
      {/* workspace header */}
      <div style={{ padding: '14px 12px 10px' }}>
        <Link href="/dashboard/briefing" style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '4px 6px', borderRadius: 10, textDecoration: 'none',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'var(--lime)', color: '#0a0a0a',
            display: 'grid', placeItems: 'center', boxShadow: '0 0 20px #CFFF3A40',
          }}>
            <Icon name="bolt" size={16} color="#0a0a0a" />
          </div>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ font: '600 14px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lime)', textShadow: '0 0 18px #CFFF3A33' }}>BizBoost</span>
              <span style={{ font: '500 11px var(--font-sans)', color: 'var(--text-2)' }}>Command Centre</span>
            </div>
          )}
        </Link>
      </div>

      {!sidebarCollapsed && (
        <div style={{ padding: '2px 12px 10px' }}>
          <button onClick={() => setQuickOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 34,
            padding: '0 10px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
            background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-3)',
          }}>
            <Icon name="search" size={14} />
            <span style={{ flex: 1, fontSize: 12.5 }}>Search or jump to…</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>⌘K</span>
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 12px 12px' }}>
        {!sidebarCollapsed && (
          <button onClick={() => setQuickOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 34, marginBottom: 8,
            padding: '0 10px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
            background: 'var(--lime-soft)', border: '1px solid #cfff3a3a', color: 'var(--lime)', fontWeight: 600,
          }}>
            <Icon name="plus" size={14} />
            <span style={{ fontSize: 12.5 }}>Quick Add</span>
          </button>
        )}

        {!sidebarCollapsed && (
          <SectionToggle label="Workspace" open={openWork} onToggle={() => setOpenWork(!openWork)} />
        )}
        {(openWork || sidebarCollapsed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
            {navLinks.map(({ icon, label, href, trailing }) => (
              sidebarCollapsed ? (
                <Link key={href} href={href} title={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8, margin: '0 auto',
                  background: isActive(href) ? 'var(--bg-active)' : 'transparent',
                  color: isActive(href) ? 'var(--text)' : 'var(--text-2)',
                  textDecoration: 'none',
                }}>
                  <Icon name={icon} size={15} />
                </Link>
              ) : (
                <NavRow key={href} icon={icon} label={label} href={href} active={isActive(href)} trailing={trailing} />
              )
            ))}
          </div>
        )}

        {!sidebarCollapsed && (
          <>
            <SectionToggle label="Pinned clients" open={openClients} onToggle={() => setOpenClients(!openClients)} />
            {openClients && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
                {CLIENTS.slice(0, 5).map(c => {
                  const isCurrentClient = pathname.endsWith(c.id)
                  return (
                    <PinnedClientRow key={c.id} c={c} isActive={isCurrentClient} />
                  )
                })}
              </div>
            )}

            <SectionToggle label="Master databases" open={openDB} onToggle={() => setOpenDB(!openDB)} />
            {openDB && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <NavRow icon="folder" label="Resources" href="/dashboard/resources" active={isActive('/dashboard/resources')} />
                <NavRow icon="doc" label="Pages" href="/dashboard/docs" active={isActive('/dashboard/docs')} />
                <NavRow emoji="📘" label="Playbooks" href="/dashboard/resources" active={false} />
                <NavRow emoji="💷" label="Pricing & guarantees" href="/dashboard/docs" active={false} />
              </div>
            )}
          </>
        )}
      </div>

      {/* footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', position: 'relative' }}>
        {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!sidebarCollapsed && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 6px', borderRadius: 8 }}>
              <span className="avatar" style={{ background: '#cfff3a', width: 26, height: 26, flexShrink: 0 }}>B</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <span style={{ font: '600 12.5px var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Bartek</span>
                <span style={{ font: '500 10.5px var(--font-sans)', color: 'var(--text-2)' }}>Founder · Max</span>
              </div>
              <Icon name="chevD" size={12} color="var(--text-3)" />
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer', color: 'var(--text-3)', background: 'transparent', flexShrink: 0 }}
            title="Toggle sidebar"
          >
            <Icon name="collapse" size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
