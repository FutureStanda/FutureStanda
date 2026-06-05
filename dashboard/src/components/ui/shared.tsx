'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { Client } from '@/types'

// ---- Delta tag ----
export function Delta({ v, suffix = '' }: { v: number | null; suffix?: string }) {
  if (v === 0 || v == null) return <span className="delta delta-flat">—</span>
  const up = v > 0
  return (
    <span className={cn('delta', up ? 'delta-up' : 'delta-dn')}>
      {up ? '▲' : '▼'} {Math.abs(Math.round(v * 100))}%{suffix}
    </span>
  )
}

// ---- Health pill ----
export function HealthPill({ score }: { score: number }) {
  let cls = 'chip-lime'
  let label = 'Healthy'
  if (score < 65) { cls = 'chip-red'; label = 'At risk' }
  else if (score < 80) { cls = 'chip-amber'; label = 'Watch' }
  return (
    <span className={cn('chip', cls)}>
      <span className="dot" />
      {score}
    </span>
  )
}

// ---- Plan badge ----
export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    Domination: 'chip-lime',
    Growth: 'chip-teal',
    Starter: 'chip-dim',
  }
  return <span className={cn('chip', map[plan] || 'chip-dim')}>{plan}</span>
}

// ---- Avatar ----
export function Avatar({ client, size = '' }: { client: Client; size?: string }) {
  return (
    <span
      className={cn('avatar', size)}
      style={{ background: client.color }}
    >
      {client.avatar}
    </span>
  )
}

// ---- Segmented control ----
interface SegmentedProps<T extends string> {
  options: T[] | Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="row" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 999, padding: 3, gap: 2 }}>
      {options.map(o => {
        const val = typeof o === 'string' ? o as T : o.value
        const lbl = typeof o === 'string' ? o : o.label
        const active = val === value
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            style={{
              height: 26, padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? 'var(--lime)' : 'transparent',
              color: active ? '#0a0a0a' : 'var(--text-2)',
              font: `${active ? 600 : 500} 12px var(--font-sans)`,
              transition: 'all .15s ease',
            }}
          >
            {lbl}
          </button>
        )
      })}
    </div>
  )
}

// ---- Priority dot ----
export function PriorityDot({ p }: { p: string }) {
  const colors: Record<string, string> = { P0: 'var(--red)', P1: 'var(--amber)', P2: 'var(--text-3)' }
  return (
    <span
      title={p}
      style={{ width: 7, height: 7, borderRadius: 2, background: colors[p] || 'var(--text-3)', flexShrink: 0, display: 'inline-block' }}
    />
  )
}

// ---- Progress bar ----
export function ProgressBar({ value, color = 'var(--lime)' }: { value: number; color?: string }) {
  return (
    <div className="prog">
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  )
}

// ---- Stat block ----
export function Stat({ label, value, delta, sub, accent }: { label: string; value: React.ReactNode; delta?: number | null; sub?: string; accent?: string }) {
  return (
    <div className="col" style={{ gap: 4, minWidth: 0 }}>
      <div className="eyebrow">{label}</div>
      <div className="row gap-2" style={{ alignItems: 'baseline' }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: accent || 'var(--text)' }}>{value}</span>
        {delta != null && <Delta v={delta} />}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{sub}</div>}
    </div>
  )
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; width?: number }) {
  if (!open) return null
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, width, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)', overflow: 'auto', boxShadow: 'var(--shadow-modal)' }}>
        {title && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: '600 15px var(--font-sans)' }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8 }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ---- Chip ----
export function Chip({ children, color, onClick }: { children: React.ReactNode; color?: string; onClick?: () => void }) {
  return (
    <span
      className={cn('chip', color)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </span>
  )
}

// ---- Panel ----
export function Panel({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={cn('panel', className)} style={style}>
      {children}
    </div>
  )
}

// ---- Empty state ----
export function Empty({ icon = '📭', title, sub, action }: { icon?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-2)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: 'var(--text)' }}>{title}</div>
      {sub && <div style={{ fontSize: 13, marginBottom: 16 }}>{sub}</div>}
      {action}
    </div>
  )
}
