'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar, Delta, HealthPill, PlanBadge, Segmented } from '@/components/ui/shared'
import { Icon } from '@/components/ui/icons'
import { CLIENTS } from '@/lib/data'
import { useUI } from '@/store/use-store'
import type { Client } from '@/types'

type FilterType = 'All' | 'Domination' | 'Growth' | 'Starter' | 'At risk'
type SortType = 'health' | 'leads' | 'revenue' | 'name'

function MiniMetric({ label, value, delta }: { label: string; value: string | number; delta?: number | null }) {
  return (
    <div className="col" style={{ gap: 3, flex: 1, alignItems: 'center' }}>
      <span className="num" style={{ fontWeight: 600, fontSize: 17, color: '#fff' }}>{value}</span>
      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        {delta != null && delta !== 0 && (
          <span style={{ fontSize: 10, fontWeight: 600, color: delta > 0 ? 'var(--lime)' : 'var(--red)' }}>
            {delta > 0 ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  )
}

function ClientCard({ c, onClick }: { c: Client; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="panel"
      style={{
        padding: 16, textAlign: 'left', cursor: 'pointer', display: 'block', width: '100%',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        background: 'var(--bg-1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'border-color .15s, transform .15s',
      }}
    >
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="row gap-3" style={{ minWidth: 0 }}>
          <Avatar client={c} size="avatar-lg" />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#fff' }}>{c.name}</span>
            <span style={{ font: '500 11.5px var(--font-sans)', color: 'var(--text-2)' }}>{c.city} · {c.niche}</span>
          </div>
        </div>
        <HealthPill score={c.health} />
      </div>

      {c.flag && (
        <div
          className="chip"
          style={{
            marginBottom: 12,
            background: c.flag === 'At risk' ? '#ff6b5c1c' : c.flag === 'Top performer' ? '#cfff3a1c' : '#ffb5471c',
            color: c.flag === 'At risk' ? 'var(--red)' : c.flag === 'Top performer' ? 'var(--lime)' : 'var(--amber)',
            borderColor: 'transparent',
          }}
        >
          <span className="dot" />{c.flag}
        </div>
      )}

      <div className="row" style={{ gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', marginBottom: 12 }}>
        <MiniMetric label="Leads" value={c.leads30} delta={c.leads_delta} />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <MiniMetric label="Booked" value={c.bookings30} delta={c.bookings_delta} />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <MiniMetric label="ROAS" value={c.roas ? c.roas.toFixed(1) + 'x' : '—'} />
      </div>

      <div className="row between">
        <PlanBadge plan={c.plan} />
        <div className="row gap-2" style={{ color: 'var(--text-2)', fontSize: 11 }}>
          <Icon name="clock" size={12} />
          {c.last_touch}
        </div>
      </div>
    </button>
  )
}

function ClientRow({ c, onClick }: { c: Client; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1fr 0.8fr 0.8fr 0.7fr 0.9fr 0.6fr',
        gap: 12, alignItems: 'center',
        width: '100%', padding: '12px 16px',
        border: 'none', borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background .12s',
      }}
    >
      <div className="row gap-3" style={{ minWidth: 0 }}>
        <Avatar client={c} />
        <div className="col" style={{ gap: 1, minWidth: 0 }}>
          <span className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#fff' }}>{c.name}</span>
          <span style={{ font: '500 11px var(--font-sans)', color: 'var(--text-2)' }}>{c.city} · {c.niche}</span>
        </div>
      </div>
      <div><PlanBadge plan={c.plan} /></div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13 }}>
        {c.leads30}<span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}> lds</span>
      </div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13 }}>{c.bookings30}</div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13, color: c.roas >= 5 ? 'var(--lime)' : 'var(--text)' }}>
        {c.roas ? c.roas.toFixed(1) + 'x' : '—'}
      </div>
      <div className="row gap-2">
        <div className="prog" style={{ width: 50 }}>
          <i style={{ width: c.health + '%', background: c.health < 65 ? 'var(--red)' : c.health < 80 ? 'var(--amber)' : 'var(--lime)' }} />
        </div>
        <span className="num" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.health}</span>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {c.flag && (
          <span
            className="dot"
            style={{ color: c.flag === 'At risk' ? 'var(--red)' : 'var(--lime)' }}
          />
        )}
      </div>
    </button>
  )
}

const FILTERS: FilterType[] = ['All', 'Domination', 'Growth', 'Starter', 'At risk']

export default function ClientsPage() {
  const router = useRouter()
  const { setClientOpen } = useUI()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [filter, setFilter] = useState<FilterType>('All')
  const [sort, setSort] = useState<SortType>('health')

  let list = CLIENTS.filter(c => {
    if (filter === 'All') return true
    if (filter === 'At risk') return c.health < 65 || c.flag === 'At risk'
    return c.plan === filter
  })

  list = [...list].sort((a, b) => {
    if (sort === 'health') return b.health - a.health
    if (sort === 'leads') return b.leads30 - a.leads30
    if (sort === 'revenue') return b.revenue30 - a.revenue30
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Clients' }]} />
      <div className="page-inner" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60 }}>
        <div className="col gap-4">
          {/* Header */}
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div className="col gap-2">
              <div className="eyebrow">Portfolio · {CLIENTS.length} businesses</div>
              <div className="h-display" style={{ fontSize: 38 }}>Clients</div>
            </div>
            <div className="row gap-2">
              <Segmented
                options={[{ value: 'grid', label: 'Grid' }, { value: 'table', label: 'Table' }]}
                value={view}
                onChange={setView}
              />
              <button onClick={() => setClientOpen(true)} className="btn btn-primary">
                <Icon name="plus" size={14} />
                Add client
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="row between">
            <div className="row gap-2">
              {FILTERS.map(f => (
                <FilterButton key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
              ))}
            </div>
            <div className="row gap-2" style={{ color: 'var(--text-2)' }}>
              <Icon name="filter" size={14} />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortType)}
                style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', borderRadius: 999, height: 30,
                  padding: '0 12px', font: '500 12px var(--font-sans)', cursor: 'pointer',
                }}
              >
                <option value="health">Sort: Health</option>
                <option value="leads">Sort: Leads</option>
                <option value="revenue">Sort: Revenue</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          {/* Content */}
          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {list.map((c, i) => (
                <div key={c.id} className="fadeup" style={{ animationDelay: `${i * 0.03}s` }}>
                  <ClientCard c={c} onClick={() => router.push(`/dashboard/clients/${c.id}`)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="panel" style={{ overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1fr 0.8fr 0.8fr 0.7fr 0.9fr 0.6fr',
                gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg-2)',
              }}>
                {['Business', 'Plan', 'Leads', 'Booked', 'ROAS', 'Health', ''].map((h, i) => (
                  <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>
                ))}
              </div>
              {list.map(c => (
                <ClientRow key={c.id} c={c} onClick={() => router.push(`/dashboard/clients/${c.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{
        height: 30, cursor: 'pointer',
        background: active ? 'var(--lime)' : 'var(--bg-2)',
        color: active ? '#0a0a0a' : 'var(--text-2)',
        borderColor: active ? 'var(--lime)' : 'var(--border)',
        fontWeight: active ? 600 : 500,
      }}
    >
      {label}
      {label === 'At risk' && (
        <span className="dot" style={{ color: active ? '#0a0a0a' : 'var(--red)' }} />
      )}
    </button>
  )
}
