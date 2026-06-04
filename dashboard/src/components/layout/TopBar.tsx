'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icons'
import { useUI } from '@/store/use-store'

interface Crumb { label: string; href?: string }

export function TopBar({ crumbs, title }: { crumbs?: Crumb[]; title?: string }) {
  const { setCmdOpen, aiOpen, setAiOpen } = useUI()

  return (
    <header style={{
      height: 56, flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      background: 'linear-gradient(180deg, #0e100e, #0b0c0b)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', gap: 16,
      backdropFilter: 'blur(8px)',
    }}>
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {crumbs ? crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>/</span>}
            {c.href ? (
              <Link href={c.href} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                font: '500 14px var(--font-sans)', color: 'var(--text-2)', textDecoration: 'none',
              }}>{c.label}</Link>
            ) : (
              <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>{c.label}</span>
            )}
          </React.Fragment>
        )) : (
          <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>{title}</span>
        )}
      </div>

      {/* center: live status */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="row gap-2 chip" style={{ height: 28, background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
          <span className="live-dot" />
          <span style={{ color: 'var(--text-2)', fontSize: 11.5 }}>Live · synced 2m ago</span>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setCmdOpen(true)} className="btn" title="Command (⌘K)" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="command" size={14} />
          <span style={{ fontSize: 12, color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>⌘K</span>
        </button>
        <button className="btn" style={{ width: 32, padding: 0, justifyContent: 'center', position: 'relative' }} title="Notifications">
          <Icon name="bell" size={14} />
          <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: 3, background: 'var(--lime)' }} />
        </button>
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className={aiOpen ? 'btn btn-primary' : 'btn'}
          style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="sparkle" size={14} />
          Ask Boost
        </button>
      </div>
    </header>
  )
}
