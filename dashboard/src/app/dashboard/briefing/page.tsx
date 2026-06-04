'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Delta, HealthPill, Avatar } from '@/components/ui/shared'
import { Sparkline } from '@/components/ui/charts'
import { Icon } from '@/components/ui/icons'
import { CLIENTS, ACTIVITY, MRR_TREND, BRIEFING } from '@/lib/data'
import { fmtMoney, fmtNum, timeAgo } from '@/lib/utils'
import type { Client } from '@/types'

function PortfolioStat({
  label, value, delta, spark, color, onClick,
}: {
  label: string
  value: string | number
  delta: number
  spark: number[]
  color?: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      className="panel"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 18px', flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'left',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        background: 'var(--bg-1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'border-color .15s, transform .15s',
      }}
    >
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="eyebrow">{label}</span>
        <Delta v={delta} />
      </div>
      <div
        className="num"
        style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: color || 'var(--text)', marginBottom: 8 }}
      >
        {value}
      </div>
      <Sparkline data={spark} w={200} h={30} color={color || 'var(--lime)'} id={label} />
    </button>
  )
}

function ActivityIcon({ kind }: { kind: string }) {
  const map: Record<string, { icon: string; color: string }> = {
    lead: { icon: 'inbox', color: 'var(--lime)' },
    review: { icon: 'star', color: 'var(--amber)' },
    booking: { icon: 'calendar', color: 'var(--teal)' },
    ad: { icon: 'trend', color: 'var(--blue)' },
    missed: { icon: 'phoneMissed', color: 'var(--red)' },
    ai: { icon: 'sparkle', color: 'var(--violet)' },
  }
  const m = map[kind] || map.lead
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      display: 'grid', placeItems: 'center',
      background: 'var(--bg-2)', color: m.color, border: '1px solid var(--border)',
    }}>
      <Icon name={m.icon} size={13} />
    </span>
  )
}

function BriefColumn({
  icon, tone, title, items, onOpen,
}: {
  icon: string
  tone: 'lime' | 'red' | 'amber'
  title: string
  items: Array<{ t: string }>
  onOpen?: (item: { t: string }) => void
}) {
  const colorMap = { lime: 'var(--lime)', red: 'var(--red)', amber: 'var(--amber)' }
  const color = colorMap[tone]
  return (
    <div className="col gap-3 flex-1" style={{ padding: '16px 18px', minWidth: 0 }}>
      <div className="row gap-2" style={{ color }}>
        <Icon name={icon} size={14} />
        <span style={{ font: '600 12px var(--font-sans)', color: 'var(--text)' }}>{title}</span>
      </div>
      <div className="col gap-1">
        {items.map((it, i) => (
          <BriefItem key={i} item={it} color={color} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

function BriefItem({
  item, color, onOpen,
}: {
  item: { t: string }
  color: string
  onOpen?: (item: { t: string }) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => onOpen?.(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%', textAlign: 'left',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        border: 'none', cursor: 'pointer', padding: '7px 8px', borderRadius: 9,
        transition: 'background .12s',
      }}
    >
      <span style={{ width: 4, height: 4, borderRadius: 2, background: color, marginTop: 7, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4, flex: 1 }}>{item.t}</span>
      <span style={{ color: 'var(--text-3)', flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity .12s' }}>
        <Icon name="chevR" size={13} />
      </span>
    </button>
  )
}

export default function BriefingPage() {
  const router = useRouter()

  const totalLeads = CLIENTS.reduce((a, c) => a + c.leads30, 0)
  const totalRev = CLIENTS.reduce((a, c) => a + c.revenue30, 0)
  const totalMrr = CLIENTS.reduce((a, c) => a + c.mrr, 0)
  const avgHealth = Math.round(CLIENTS.reduce((a, c) => a + c.health, 0) / CLIENTS.length)

  const movers = [...CLIENTS].sort((a, b) => b.leads_delta - a.leads_delta)

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Briefing' }]} />
      <div className="page-inner" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60 }}>
        <div className="col gap-5">
          {/* Hero */}
          <div className="fadeup" style={{ paddingTop: 6 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{BRIEFING.date}</div>
            <div className="h-display" style={{ fontSize: 50, lineHeight: 1.04, marginBottom: 4 }}>
              Good morning, Bartek.
            </div>
            <div className="h-display" style={{ fontSize: 50, lineHeight: 1.04 }}>
              <span className="outline">9 businesses,</span>{' '}
              <span className="it">one cockpit.</span>
            </div>
          </div>

          {/* Portfolio strip */}
          <div className="row gap-3 stretch fadeup" style={{ animationDelay: '.05s' }}>
            <PortfolioStat
              label="Monthly recurring"
              value={fmtMoney(totalMrr)}
              delta={0.13}
              spark={MRR_TREND.map(m => m.v)}
            />
            <PortfolioStat
              label="Leads · 30d"
              value={totalLeads}
              delta={0.22}
              spark={[210, 244, 268, 290, 320, 358, totalLeads]}
              color="var(--teal)"
            />
            <PortfolioStat
              label="Client revenue · 30d"
              value={fmtMoney(totalRev)}
              delta={0.16}
              spark={[180, 195, 210, 225, 240, 252, 264]}
              color="var(--blue)"
            />
            <PortfolioStat
              label="Avg health"
              value={avgHealth}
              delta={0.04}
              spark={[78, 79, 77, 80, 81, 80, avgHealth]}
              color="var(--amber)"
            />
          </div>

          {/* AI Briefing card */}
          <div className="panel fadeup" style={{ padding: 0, overflow: 'hidden', animationDelay: '.1s', borderColor: '#cfff3a2e' }}>
            <div className="row between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, #14180d, transparent)' }}>
              <div className="row gap-2">
                <span style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: '0 0 12px #cfff3a55' }}>
                  <Icon name="sparkle" size={12} />
                </span>
                <span style={{ font: '600 13px var(--font-sans)' }}>Boost · Daily brief</span>
                <span className="chip chip-dim">auto-generated 06:00</span>
              </div>
              <button className="btn" style={{ height: 28 }}>
                <Icon name="refresh" size={13} />
                Regenerate
              </button>
            </div>
            <div className="row" style={{ alignItems: 'stretch' }}>
              <BriefColumn
                icon="flame"
                tone="lime"
                title="Wins"
                items={BRIEFING.wins}
              />
              <div style={{ width: 1, background: 'var(--border)' }} />
              <BriefColumn
                icon="shield"
                tone="red"
                title="Needs you"
                items={BRIEFING.risks}
              />
              <div style={{ width: 1, background: 'var(--border)' }} />
              <BriefColumn
                icon="clock"
                tone="amber"
                title="Today"
                items={BRIEFING.today}
              />
            </div>
          </div>

          {/* Two-col: movers + activity */}
          <div className="row gap-4 fadeup" style={{ animationDelay: '.15s', alignItems: 'flex-start' }}>
            {/* Client momentum */}
            <div className="panel flex-1" style={{ padding: 18 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <span style={{ font: '600 14px var(--font-sans)' }}>Client momentum</span>
                <button
                  onClick={() => router.push('/dashboard/clients')}
                  className="btn"
                  style={{ height: 26 }}
                >
                  All clients
                  <Icon name="arrowR" size={13} />
                </button>
              </div>
              <div className="col gap-2">
                {movers.slice(0, 6).map(c => (
                  <MoverRow key={c.id} c={c} onClick={() => router.push(`/dashboard/clients/${c.id}`)} />
                ))}
              </div>
            </div>

            {/* Live activity */}
            <div className="panel" style={{ padding: 18, width: 380, flexShrink: 0 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <span style={{ font: '600 14px var(--font-sans)' }}>Live activity</span>
                <span className="row gap-2 chip chip-dim">
                  <span className="live-dot" />
                  real-time
                </span>
              </div>
              <div className="col" style={{ gap: 2, maxHeight: 360, overflowY: 'auto', margin: '0 -8px', padding: '0 8px' }}>
                {ACTIVITY.map((a, i) => {
                  const client = a.client_id ? CLIENTS.find(c => c.id === a.client_id) : null
                  return (
                    <ActivityRow
                      key={a.id}
                      kind={a.type}
                      msg={a.message}
                      ts={timeAgo(a.created_at)}
                      client={client ?? null}
                      onClick={client ? () => router.push(`/dashboard/clients/${client.id}`) : undefined}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MoverRow({ c, onClick }: { c: Client; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        textAlign: 'left', transition: 'background .12s',
      }}
    >
      <Avatar client={c} />
      <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
        <span className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#fff' }}>{c.name}</span>
        <span style={{ font: '500 11px var(--font-sans)', color: 'var(--text-2)' }}>{c.city} · {c.niche}</span>
      </div>
      <Sparkline
        data={c.sparkline?.length ? c.sparkline : [c.leads30 * 0.6, c.leads30 * 0.8, c.leads30]}
        w={70}
        h={26}
        color={c.leads_delta >= 0 ? 'var(--lime)' : 'var(--red)'}
        fill={false}
        id={c.id}
      />
      <div className="col" style={{ alignItems: 'flex-end', gap: 2, width: 64 }}>
        <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>{c.leads30}</span>
        <Delta v={c.leads_delta} />
      </div>
    </button>
  )
}

function ActivityRow({
  kind, msg, ts, client, onClick,
}: {
  kind: string
  msg: string
  ts: string
  client: Client | null
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => { if (client) setHovered(true) }}
      onMouseLeave={() => setHovered(false)}
      className="row gap-3"
      style={{
        padding: '8px 6px', alignItems: 'flex-start', width: '100%', textAlign: 'left',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        border: 'none', borderRadius: 9,
        cursor: client ? 'pointer' : 'default',
        transition: 'background .12s',
      }}
    >
      <ActivityIcon kind={kind} />
      <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.35 }}>{msg}</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
          {client ? `${client.name} · ` : ''}{ts}
        </span>
      </div>
      {client && (
        <span style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }}>
          <Icon name="chevR" size={13} />
        </span>
      )}
    </button>
  )
}
