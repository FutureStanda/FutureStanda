'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar, Delta, HealthPill, PlanBadge, PriorityDot } from '@/components/ui/shared'
import { Sparkline, AreaChart, BarChart } from '@/components/ui/charts'
import { Icon } from '@/components/ui/icons'
import { CLIENTS, INTEGRATIONS_DATA, ACTIVITY } from '@/lib/data'
import { useData, useUI } from '@/store/use-store'
import { fmtMoney, fmtNum, healthColor } from '@/lib/utils'
import { OnboardingTracker } from '@/components/clients/OnboardingTracker'
import { ClientMemory } from '@/components/clients/ClientMemory'
import { ClientIntegrations } from '@/components/clients/ClientIntegrations'
import type { Client, Task } from '@/types'

// ---- Integration live-data rules ----
const LIVE_RULES: Record<string, string[]> = {
  leads30: ['meta', 'ga', 'gbp'],
  bookings30: ['cal', 'stripe'],
  revenue30: ['stripe'],
  roas: ['meta', 'gads'],
  reviews: ['gbp'],
  website: ['ga'],
  social: ['ig', 'meta', 'tt'],
  missedCalls: ['wa'],
}

function isLive(c: Client, key: string): boolean {
  const sources = LIVE_RULES[key] || []
  return sources.some(s => c.connected.includes(s))
}

function lockName(key: string): string {
  const sources = LIVE_RULES[key] || []
  const map: Record<string, string> = {
    meta: 'Meta', ga: 'Google Analytics', gbp: 'Google Business',
    cal: 'Calendly', stripe: 'Stripe', gads: 'Google Ads',
    ig: 'Instagram', wa: 'WhatsApp', tt: 'TikTok',
  }
  return map[sources[0]] || sources[0] || 'Integration'
}

// ---- Sub-components ----

function PanelHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="row between" style={{ marginBottom: 16 }}>
      <div className="col" style={{ gap: 2 }}>
        <span style={{ font: '600 14px var(--font-sans)' }}>{title}</span>
        {sub && <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{sub}</span>}
      </div>
      {action}
    </div>
  )
}

function KpiCard({
  label, value, delta, icon, color, sub, locked, lockSource, onConnect,
}: {
  label: string
  value: string | number
  delta?: number | null
  icon: string
  color?: string
  sub?: string
  locked: boolean
  lockSource: string
  onConnect: () => void
}) {
  const [hovered, setHovered] = useState(false)

  if (locked) {
    return (
      <button
        onClick={onConnect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="panel"
        style={{
          padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%', display: 'block',
          border: `1px dashed ${hovered ? '#cfff3a55' : 'var(--border-strong)'}`,
          background: 'var(--bg-1)',
          transition: 'border-color .15s',
        }}
      >
        <div className="row between" style={{ marginBottom: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'var(--bg-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <Icon name={icon} size={13} />
          </span>
          <span style={{ color: 'var(--text-3)' }}><Icon name="link" size={13} /></span>
        </div>
        <div className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-3)' }}>— —</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>{label}</div>
        <div className="row gap-2" style={{ fontSize: 10.5, color: 'var(--lime)', marginTop: 4, fontWeight: 600 }}>
          <Icon name="plus" size={12} />Connect {lockSource}
        </div>
      </button>
    )
  }

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="panel"
      style={{
        padding: '14px 16px', textAlign: 'left', width: '100%', display: 'block', cursor: 'default',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        background: 'var(--bg-1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'border-color .15s, transform .15s',
      }}
    >
      <div className="row between" style={{ marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'var(--bg-2)', color: color || 'var(--lime)', border: '1px solid var(--border)' }}>
          <Icon name={icon} size={13} />
        </span>
        {delta != null && <Delta v={delta} />}
      </div>
      <div className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>}
    </button>
  )
}

function ConnectInline({ name, onConnect }: { name: string; onConnect: () => void }) {
  return (
    <div className="col gap-3" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '26px 16px', border: '1px dashed var(--border-strong)', borderRadius: 12, background: 'var(--bg-1)' }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--bg-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
        <Icon name="link" size={18} />
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--text-2)', maxWidth: 220, lineHeight: 1.5 }}>
        Connect {name} to populate this with live data.
      </span>
      <button onClick={onConnect} className="btn btn-primary" style={{ height: 30 }}>
        <Icon name="plus" size={13} />Connect {name}
      </button>
    </div>
  )
}

// ---- Overview Tab ----
function OverviewTab({ c, gotoConnect }: { c: Client; gotoConnect: () => void }) {
  const revSeries = [
    { m: 'Dec', v: c.revenue30 * 0.62 }, { m: 'Jan', v: c.revenue30 * 0.7 },
    { m: 'Feb', v: c.revenue30 * 0.78 }, { m: 'Mar', v: c.revenue30 * 0.86 },
    { m: 'Apr', v: c.revenue30 * 0.93 }, { m: 'May', v: c.revenue30 },
  ]
  const channelBars = [
    { l: 'Meta', v: Math.round(c.leads30 * 0.42), color: '#1877F2' },
    { l: 'Google', v: Math.round(c.leads30 * 0.31), color: '#34A853' },
    { l: 'Organic', v: Math.round(c.leads30 * 0.16), color: 'var(--lime)' },
    { l: 'Referral', v: Math.round(c.leads30 * 0.11), color: 'var(--violet)' },
  ]
  const clientActivity = ACTIVITY.filter(a => a.client_id === c.id)
  const revenueConnected = isLive(c, 'revenue30')
  const leadsConnected = isLive(c, 'leads30')
  const websiteConnected = isLive(c, 'website')
  const socialConnected = isLive(c, 'social')
  const missedConnected = isLive(c, 'missedCalls')

  const funnelStages = [
    { l: 'Impressions', v: c.website_visits30 * 6, color: '#2c3326' },
    { l: 'Site visits', v: c.website_visits30, color: '#4a5a36' },
    { l: 'Leads', v: c.leads30 * 3, color: '#7e9c46' },
    { l: 'Qualified', v: c.leads30, color: '#a8d24f' },
    { l: 'Booked', v: c.bookings30, color: 'var(--lime)' },
  ]
  const funnelMax = funnelStages[0].v || 1

  return (
    <div className="col gap-4 fadeup">
      <div className="row gap-4 stretch" style={{ alignItems: 'stretch' }}>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead
            title="Revenue trend"
            sub="Last 6 months"
            action={revenueConnected ? <span className="num" style={{ font: '600 18px var(--font-sans)', color: '#fff' }}>{fmtMoney(c.revenue30)}</span> : undefined}
          />
          {revenueConnected
            ? <AreaChart data={revSeries} h={200} valueFmt={v => fmtMoney(v)} color="var(--lime)" />
            : <ConnectInline name={lockName('revenue30')} onConnect={gotoConnect} />}
        </div>
        <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
          <PanelHead title="Lead sources" sub="Where leads come from" />
          {leadsConnected ? (
            <>
              <BarChart data={channelBars} h={150} />
              <div className="col gap-2" style={{ marginTop: 14 }}>
                {channelBars.map(ch => (
                  <div key={ch.l} className="row between" style={{ fontSize: 12 }}>
                    <span className="row gap-2" style={{ color: 'var(--text-2)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: ch.color }} />
                      {ch.l}
                    </span>
                    <span className="num" style={{ fontWeight: 600 }}>{ch.v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <ConnectInline name={lockName('leads30')} onConnect={gotoConnect} />}
        </div>
      </div>

      <div className="row gap-4 stretch" style={{ alignItems: 'stretch' }}>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Conversion funnel · 30d" />
          {leadsConnected ? (
            <div className="col gap-2">
              {funnelStages.map((s, i) => (
                <div key={i} className="row gap-3" style={{ alignItems: 'center' }}>
                  <span style={{ width: 90, fontSize: 12, color: 'var(--text-2)', flexShrink: 0 }}>{s.l}</span>
                  <div style={{ flex: 1, height: 26, borderRadius: 6, background: 'var(--bg-2)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${(s.v / funnelMax * 100)}%`, height: '100%', background: s.color, borderRadius: 6, transition: 'width .8s ease', minWidth: 30 }} />
                    <span className="num" style={{ position: 'absolute', left: 10, top: 0, height: 26, display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 600, color: i >= 3 ? '#0a0a0a' : 'var(--text)' }}>
                      {fmtNum(s.v)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <ConnectInline name={lockName('leads30')} onConnect={gotoConnect} />}
        </div>
        <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
          <PanelHead title="Website" sub={c.handle ?? undefined} />
          <div className="col gap-3">
            <div className="row between">
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>Visits · 30d</span>
              {websiteConnected
                ? <span className="row gap-2"><span className="num" style={{ fontWeight: 600 }}>{fmtNum(c.website_visits30)}</span><Delta v={c.website_visits_delta} /></span>
                : <button onClick={gotoConnect} className="chip" style={{ cursor: 'pointer', color: 'var(--lime)', borderColor: '#cfff3a3a' }}><Icon name="plus" size={12} />{lockName('website')}</button>}
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div className="row between">
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>Conversion rate</span>
              <span className="num" style={{ fontWeight: 600, color: websiteConnected ? 'var(--text)' : 'var(--text-3)' }}>
                {websiteConnected ? `${c.website_conv}%` : '—'}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div className="row between">
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>Missed calls · 7d</span>
              <span className="num" style={{ fontWeight: 600, color: !missedConnected ? 'var(--text-3)' : c.missed_calls > 3 ? 'var(--red)' : 'var(--text)' }}>
                {missedConnected ? c.missed_calls : '—'}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div className="col gap-2" style={{ marginTop: 4 }}>
              <span style={{ color: 'var(--text-2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Social following</span>
              {socialConnected ? (
                <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
                  <span className="chip"><span className="dot" style={{ color: '#E1306C' }} />IG {fmtNum(c.followers_ig)}</span>
                  <span className="chip"><span className="dot" style={{ color: '#1877F2' }} />FB {fmtNum(c.followers_fb)}</span>
                  {c.followers_tt > 0 && <span className="chip"><span className="dot" style={{ color: '#FE2C55' }} />TT {fmtNum(c.followers_tt)}</span>}
                </div>
              ) : (
                <button onClick={gotoConnect} className="chip" style={{ cursor: 'pointer', width: 'fit-content', color: 'var(--lime)', borderColor: '#cfff3a3a' }}>
                  <Icon name="plus" size={12} />Connect {lockName('social')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row gap-4 stretch" style={{ alignItems: 'flex-start' }}>
        <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
          <PanelHead title="Services" />
          <div className="col gap-2">
            {c.services.map((s, i) => (
              <div key={i} className="row between" style={{ padding: '8px 0', borderBottom: i < c.services.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{s}</span>
                <Icon name="chevR" size={13} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Recent activity" />
          {clientActivity.length > 0 ? (
            <div className="col gap-2">
              {clientActivity.map((a, i) => (
                <div key={i} className="row gap-3" style={{ padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--lime)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1 }}>{a.message}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>recently</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-2)', fontSize: 12.5 }}>No recent activity logged.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Tasks Tab ----
function TasksTab({ c }: { c: Client }) {
  const { tasks, toggleTask } = useData()
  const { setTaskCompose } = useUI()
  const clientTasks = tasks.filter(t => t.client_id === c.id)

  return (
    <div className="panel fadeup" style={{ padding: 18 }}>
      <PanelHead
        title="Tasks"
        sub={`${clientTasks.length} items for ${c.name}`}
        action={
          <button onClick={() => setTaskCompose({ client_id: c.id })} className="btn" style={{ height: 28 }}>
            <Icon name="plus" size={13} />Add task
          </button>
        }
      />
      {clientTasks.length > 0 ? (
        <div className="col gap-2">
          {clientTasks.map(t => (
            <TaskLine key={t.id} t={t} onToggle={() => toggleTask(t.id)} />
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-2)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
          All caught up —{' '}
          <button
            onClick={() => setTaskCompose({ client_id: c.id })}
            style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
          >
            add a task →
          </button>
        </div>
      )}
    </div>
  )
}

function TaskLine({ t, onToggle }: { t: Task; onToggle: () => void }) {
  const done = t.status === 'done'
  return (
    <div className="row gap-3" style={{ padding: '9px 10px', borderRadius: 9, alignItems: 'center', background: 'var(--bg-2)' }}>
      <button
        onClick={onToggle}
        style={{
          width: 17, height: 17, borderRadius: 5, flexShrink: 0,
          border: `1.5px solid ${done ? 'var(--lime)' : 'var(--border-strong)'}`,
          background: done ? 'var(--lime)' : 'transparent',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
          color: done ? '#0a0a0a' : 'transparent',
        }}
      >
        {done && <Icon name="check" size={10} />}
      </button>
      <PriorityDot p={t.priority} />
      <span style={{ flex: 1, fontSize: 13, color: done ? 'var(--text-2)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
        {t.title}
      </span>
      {t.due_date && (
        <span className="chip chip-dim" style={{ fontSize: 10.5 }}>{t.due_date}</span>
      )}
      {t.assignee && (
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.assignee}</span>
      )}
    </div>
  )
}

// ---- Marketing Tab ----
function MarketingTab({ c }: { c: Client }) {
  const channelBars = [
    { l: 'Meta', v: Math.round(c.leads30 * 0.42), color: '#1877F2' },
    { l: 'Google', v: Math.round(c.leads30 * 0.31), color: '#34A853' },
    { l: 'Organic', v: Math.round(c.leads30 * 0.16), color: 'var(--lime)' },
    { l: 'Referral', v: Math.round(c.leads30 * 0.11), color: 'var(--violet)' },
  ]
  const campaigns = [
    { name: `${c.niche} · Search`, platform: 'Google Ads', spend: Math.round(c.ad_spend * 0.5), roas: (c.roas * 1.1).toFixed(1), status: 'active', color: '#34A853' },
    { name: `${c.niche} · Lead form`, platform: 'Meta', spend: Math.round(c.ad_spend * 0.35), roas: (c.roas * 0.9).toFixed(1), status: 'active', color: '#1877F2' },
    { name: 'Retargeting', platform: 'Meta', spend: Math.round(c.ad_spend * 0.15), roas: (c.roas * 1.3).toFixed(1), status: c.health < 65 ? 'paused' : 'active', color: '#1877F2' },
  ]
  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead
          title="Active campaigns"
          sub={`€${c.ad_spend} total spend · 30d`}
          action={<button className="btn" style={{ height: 28 }}><Icon name="plus" size={13} />New campaign</button>}
        />
        <div className="col gap-2">
          {campaigns.map((cp, i) => (
            <div key={i} className="row between" style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <div className="row gap-3">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: cp.color }} />
                <div className="col" style={{ gap: 1 }}>
                  <span style={{ font: '600 13px var(--font-sans)' }}>{cp.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{cp.platform}</span>
                </div>
              </div>
              <div className="row gap-4">
                <div className="col" style={{ alignItems: 'flex-end', gap: 1 }}>
                  <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>€{cp.spend}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-2)' }}>spend</span>
                </div>
                <div className="col" style={{ alignItems: 'flex-end', gap: 1 }}>
                  <span className="num" style={{ fontWeight: 600, fontSize: 13, color: 'var(--lime)' }}>{cp.roas}x</span>
                  <span style={{ fontSize: 10, color: 'var(--text-2)' }}>ROAS</span>
                </div>
                <span className={`chip ${cp.status === 'active' ? 'chip-lime' : 'chip-dim'}`} style={{ minWidth: 60, justifyContent: 'center' }}>{cp.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="row gap-4 stretch">
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Content calendar" sub="This week" />
          <div className="col gap-2">
            {['Mon · Reel — before/after', 'Wed · Google post — offer', 'Thu · IG carousel — tips', 'Sat · Review highlight'].map((x, i) => (
              <div key={i} className="row gap-3" style={{ padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <span className="chip chip-dim" style={{ width: 18, height: 18, padding: 0, justifyContent: 'center', fontSize: 10 }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{x}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Channel mix" />
          <BarChart data={channelBars} h={160} />
        </div>
      </div>
    </div>
  )
}

// ---- Leads Tab ----
function LeadsTab({ c }: { c: Client }) {
  const names = ["Sarah O'Brien", 'John Walsh', 'Mary Collins', 'Patrick Doyle', 'Emma Ryan', 'Ciarán Murphy']
  const leads = names.slice(0, 6).map((n, i) => ({
    name: n,
    service: c.services[i % c.services.length],
    status: ['Booked', 'New', 'Contacted', 'Booked', 'New', 'Quoted'][i],
    src: ['Meta', 'Google', 'Organic', 'Referral', 'Meta', 'Google'][i],
    time: ['12m', '38m', '1h', '2h', '3h', '5h'][i],
    value: ['€2,400', '—', '€890', '€3,100', '—', '€1,650'][i],
  }))
  const stColor: Record<string, string> = { Booked: 'chip-lime', New: 'chip-dim', Contacted: 'chip-amber', Quoted: 'chip-dim' }
  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '16px 18px' }}>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '600 14px var(--font-sans)' }}>Lead inbox</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{c.leads30} leads · 30d · {c.missed_calls} missed calls auto-recovered</span>
          </div>
          <button className="btn" style={{ height: 28 }}>Export<Icon name="download" size={13} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.4fr 0.9fr 0.8fr 0.7fr 0.6fr', gap: 12, padding: '10px 18px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {['Lead', 'Service', 'Source', 'Status', 'Value', 'When'].map((h, i) => (
            <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>
          ))}
        </div>
        {leads.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.4fr 0.9fr 0.8fr 0.7fr 0.6fr', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div className="row gap-2">
              <span className="avatar" style={{ width: 24, height: 24, fontSize: 11, background: 'var(--bg-3)', color: 'var(--text-2)' }}>{l.name[0]}</span>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{l.name}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.service}</span>
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{l.src}</span>
            <span className={`chip ${stColor[l.status] || 'chip-dim'}`} style={{ width: 'fit-content' }}>{l.status}</span>
            <span className="num" style={{ fontSize: 12.5, fontWeight: 600 }}>{l.value}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Reputation Tab ----
function ReputationTab({ c }: { c: Client }) {
  const reviews = [
    { name: "Sarah O'Brien", stars: 5, text: "Absolutely brilliant — fast, tidy and fairly priced. Couldn't recommend more.", time: '2d', src: 'Google' },
    { name: 'John Walsh', stars: 5, text: 'Turned up on time, sorted the job in an hour. Proper professionals.', time: '4d', src: 'Google' },
    { name: 'Mary Collins', stars: 4, text: 'Great work overall, only small delay getting started but happy with the result.', time: '1w', src: 'Facebook' },
  ]
  return (
    <div className="col gap-4 fadeup">
      <div className="row gap-4 stretch">
        <div className="panel" style={{ padding: 20, width: 280, flexShrink: 0, textAlign: 'center' }}>
          <div className="num" style={{ font: '600 48px var(--font-sans)', color: 'var(--amber)', letterSpacing: '-0.03em' }}>{c.reviews_rating}</div>
          <div className="row gap-2" style={{ justifyContent: 'center', color: 'var(--amber)', marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={14} />)}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{c.reviews_count} total reviews</div>
          <div className="chip chip-lime" style={{ margin: '12px auto 0', width: 'fit-content' }}>+{c.reviews_new30} this month</div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead
            title="Latest reviews"
            action={<button className="btn" style={{ height: 28 }}><Icon name="msg" size={13} />Request batch</button>}
          />
          <div className="col gap-3">
            {reviews.map((r, i) => (
              <div key={i} className="col gap-2" style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <div className="row between">
                  <span className="row gap-2">
                    <span className="avatar" style={{ width: 24, height: 24, fontSize: 11, background: 'var(--bg-3)', color: 'var(--text-2)' }}>{r.name[0]}</span>
                    <span style={{ font: '600 12.5px var(--font-sans)' }}>{r.name}</span>
                  </span>
                  <div className="row gap-1" style={{ color: 'var(--amber)' }}>
                    {Array(r.stars).fill(0).map((_, j) => <Icon key={j} name="star" size={12} />)}
                  </div>
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>"{r.text}"</span>
                <div className="row gap-2" style={{ color: 'var(--text-3)', fontSize: 11 }}>
                  <span>{r.src}</span><span>·</span><span>{r.time} ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Integrations Tab ----
function IntegrationsTab({ c }: { c: Client }) {
  return (
    <div className="col gap-4 fadeup">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {INTEGRATIONS_DATA.map(integ => {
          const connected = c.connected.includes(integ.id)
          return (
            <div key={integ.id} className="panel" style={{ padding: 16, border: `1px solid ${connected ? integ.color + '44' : 'var(--border)'}`, background: 'var(--bg-1)' }}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="row gap-3">
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: integ.color + '22', border: `1px solid ${integ.color}44`, display: 'grid', placeItems: 'center', fontSize: 14, color: integ.color, fontWeight: 700 }}>
                    {integ.icon}
                  </span>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ font: '600 13px var(--font-sans)' }}>{integ.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{integ.connectedTo} clients</span>
                  </div>
                </div>
                <span className={`chip ${connected ? 'chip-lime' : integ.status === 'partial' ? 'chip-amber' : 'chip-dim'}`}>
                  {connected ? 'Connected' : integ.status === 'partial' ? 'Partial' : 'Connect'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Memory Tab ----
function MemoryTab({ c }: { c: Client }) {
  const { setAiOpen } = useUI()
  const [fields, setFields] = useState({
    why: c.memory?.why || '',
    ideal: c.memory?.ideal || '',
    vibe: c.memory?.vibe || '',
    competitor: c.memory?.competitor || '',
  })
  const memoryFields = [
    { key: 'why', label: 'Founder story / positioning', placeholder: 'Why do they do what they do? What makes them different?' },
    { key: 'ideal', label: 'Ideal customer profile', placeholder: 'Who is their perfect client? Job type, budget, location…' },
    { key: 'vibe', label: 'Brand tone & vibe', placeholder: 'e.g. Premium & clean, Friendly expert, Trustworthy & local…' },
    { key: 'competitor', label: 'Main competitor', placeholder: 'Who are they competing against?' },
  ] as const

  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead
          title="Client memory"
          sub="This context is fed to Boost AI for every action on this account"
          action={
            <button onClick={() => setAiOpen(true)} className="btn btn-primary" style={{ height: 30 }}>
              <Icon name="sparkle" size={13} />Ask Boost about {c.name.split(' ')[0]}
            </button>
          }
        />
        <div className="col gap-4">
          {memoryFields.map(f => (
            <div key={f.key} className="col gap-2">
              <label style={{ font: '600 12px var(--font-sans)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {f.label}
              </label>
              <textarea
                value={fields[f.key]}
                onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={3}
                style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text)', fontSize: 13, padding: '10px 12px', resize: 'vertical',
                  fontFamily: 'var(--font-sans)', lineHeight: 1.5, outline: 'none',
                  transition: 'border-color .15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-strong)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
          ))}
        </div>
        <div className="row gap-2" style={{ marginTop: 20 }}>
          <button className="btn btn-primary">Save memory</button>
          <button className="btn">Reset</button>
        </div>
      </div>
    </div>
  )
}

// ---- Onboarding Tab ----
const ONBOARDING_STEPS = [
  { id: 'k1', label: 'Intake call completed', desc: 'Confirm niche, services, target area and ideal client.' },
  { id: 'k2', label: 'Domain & hosting set up', desc: 'Point domain to BizBoost servers and issue SSL.' },
  { id: 'k3', label: 'Website live on subdomain', desc: 'First draft of the site is live at staging URL.' },
  { id: 'k4', label: 'Google Business Profile claimed', desc: 'GBP verified and linked to the dashboard.' },
  { id: 'k5', label: 'Meta Pixel + Google Tag firing', desc: 'Both tracking pixels confirmed via Tag Assistant.' },
  { id: 'k6', label: 'First ad set approved', desc: 'Creative + copy reviewed and approved by client.' },
  { id: 'k7', label: 'Review request automation live', desc: 'Post-job SMS flow tested and confirmed sending.' },
  { id: 'k8', label: 'Client portal walkthrough done', desc: 'Client knows how to read their dashboard.' },
]

function OnboardingTab({ c, onComplete }: { c: Client; onComplete: () => void }) {
  const done = c.onboarding_done || []
  const pct = Math.round((done.length / ONBOARDING_STEPS.length) * 100)
  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 18 }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <div className="col" style={{ gap: 4 }}>
            <span style={{ font: '600 14px var(--font-sans)' }}>Onboarding checklist</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Started {c.onboarding_started} · {done.length}/{ONBOARDING_STEPS.length} complete</span>
          </div>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <div className="prog" style={{ width: 120 }}>
              <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--lime)' : 'var(--amber)' }} />
            </div>
            <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{pct}%</span>
          </div>
        </div>
        <div className="col gap-2">
          {ONBOARDING_STEPS.map(step => {
            const isDone = done.includes(step.id)
            return (
              <div key={step.id} className="row gap-3" style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-2)', border: `1px solid ${isDone ? '#cfff3a22' : 'var(--border)'}` }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${isDone ? 'var(--lime)' : 'var(--border-strong)'}`,
                  background: isDone ? 'var(--lime)' : 'transparent',
                  display: 'grid', placeItems: 'center',
                  color: isDone ? '#0a0a0a' : 'transparent',
                }}>
                  {isDone && <Icon name="check" size={11} />}
                </span>
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isDone ? 'var(--text-2)' : 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
                    {step.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{step.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
        {pct >= 100 && (
          <button onClick={onComplete} className="btn btn-primary" style={{ marginTop: 20, width: '100%' }}>
            <Icon name="check" size={14} />Mark onboarding complete
          </button>
        )}
      </div>
    </div>
  )
}

// ---- Main Page ----
type TabId = 'onboarding' | 'overview' | 'tasks' | 'marketing' | 'automations' | 'leads' | 'reputation' | 'integrations' | 'memory'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { setAiOpen } = useUI()
  const c = CLIENTS.find(cl => cl.id === params.id)

  const defaultTab: TabId = c?.onboarding_active ? 'onboarding' : 'overview'
  const [tab, setTab] = useState<TabId>(defaultTab)
  const [connectedIds, setConnectedIds] = useState<string[]>(c?.connected || [])

  const gotoConnect = useCallback(() => setTab('integrations'), [])

  if (!c) {
    return (
      <div className="page-root">
        <TopBar crumbs={[{ label: 'Clients', href: '/dashboard/clients' }, { label: 'Not found' }]} />
        <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
          Client not found.
        </div>
      </div>
    )
  }

  const tabs: Array<[TabId, string]> = [
    ['onboarding', 'Onboarding'],
    ['overview', 'Overview'],
    ['tasks', 'Tasks'],
    ['marketing', 'Marketing'],
    ['automations', 'Automations'],
    ['leads', 'Leads & calls'],
    ['reputation', 'Reputation'],
    ['integrations', 'Integrations'],
    ['memory', 'Memory'],
  ]

  const showKpiStrip = !['onboarding', 'integrations', 'memory', 'automations'].includes(tab)

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Clients', href: '/dashboard/clients' }, { label: c.name }]} />
      <div className="page-inner" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60 }}>
        <div className="col gap-4">
          {/* Hero panel */}
          <div
            className="panel fadeup"
            style={{
              padding: 20,
              background: `linear-gradient(120deg, ${c.color}14, transparent 55%)`,
              borderColor: c.color + '33',
            }}
          >
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div className="row gap-4" style={{ minWidth: 0 }}>
                <div
                  className="avatar"
                  style={{ background: c.color, width: 52, height: 52, borderRadius: 14, fontSize: 22, flexShrink: 0 }}
                >
                  {c.avatar}
                </div>
                <div className="col" style={{ gap: 6, minWidth: 0 }}>
                  <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ font: '600 22px var(--font-sans)', letterSpacing: '-0.02em' }}>{c.name}</span>
                    <HealthPill score={c.health} />
                    <PlanBadge plan={c.plan} />
                  </div>
                  <div className="row gap-3" style={{ color: 'var(--text-2)', fontSize: 12.5, flexWrap: 'wrap' }}>
                    {c.city && (
                      <span className="row gap-2" style={{ whiteSpace: 'nowrap' }}>
                        <Icon name="pin" size={13} />{c.city}
                      </span>
                    )}
                    {c.handle && (
                      <span className="row gap-2" style={{ whiteSpace: 'nowrap' }}>
                        <Icon name="globe" size={13} />{c.handle}
                      </span>
                    )}
                    {c.owner && (
                      <span className="row gap-2" style={{ whiteSpace: 'nowrap' }}>
                        <Icon name="users" size={13} />{c.owner}
                      </span>
                    )}
                    {c.since && (
                      <span className="row gap-2" style={{ whiteSpace: 'nowrap' }}>
                        <Icon name="clock" size={13} />Client since {c.since}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="row gap-2" style={{ flexShrink: 0 }}>
                {c.handle && (
                  <a href={`https://${c.handle}`} target="_blank" rel="noopener noreferrer" className="btn">
                    <Icon name="globe" size={13} />Visit site
                  </a>
                )}
                <Link href={`/portal/${c.id}`} className="btn">
                  <Icon name="eye" size={13} />Client view
                </Link>
                <button
                  onClick={() => setAiOpen(true)}
                  className="btn"
                  style={{ color: '#fff', whiteSpace: 'nowrap', background: 'var(--bg-3)', borderColor: 'var(--lime)' }}
                >
                  <Icon name="sparkle" size={13} />Ask about {c.name.split(' ')[0]}
                </button>
              </div>
            </div>
            {c.flag && (
              <div className="row gap-2" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span
                  className="chip"
                  style={{
                    background: c.flag === 'At risk' ? '#ff6b5c1c' : '#cfff3a1c',
                    color: c.flag === 'At risk' ? 'var(--red)' : 'var(--lime)',
                    borderColor: 'transparent',
                  }}
                >
                  <Icon name={c.flag === 'At risk' ? 'shield' : 'flame'} size={12} />
                  {c.flag}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                  {c.flag === 'At risk' && 'ROAS below target and engagement falling — schedule a retention call.'}
                  {c.flag === 'Top performer' && 'Strongest account this quarter — ideal candidate for a case study.'}
                  {c.flag === 'Upsell opportunity' && 'Consistent demand on Starter — strong fit for a Growth upgrade.'}
                  {c.flag === 'Onboarding' && 'Fresh client — work through the onboarding checklist to take them live.'}
                  {!['At risk', 'Top performer', 'Upsell opportunity', 'Onboarding'].includes(c.flag) && 'Needs your attention this week.'}
                </span>
              </div>
            )}
          </div>

          {/* Tab nav */}
          <div className="row gap-2 fadeup" style={{ animationDelay: '.05s', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {tabs.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', marginRight: 14,
                  font: `${tab === v ? 600 : 500} 13px var(--font-sans)`,
                  color: tab === v ? 'var(--text)' : 'var(--text-2)',
                  borderBottom: `2px solid ${tab === v ? 'var(--lime)' : 'transparent'}`,
                  marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {v === 'onboarding' && <span className="live-dot" style={{ width: 5, height: 5 }} />}
                {l}
                {v === 'memory' && <Icon name="sparkle" size={12} />}
              </button>
            ))}
          </div>

          {/* KPI strip */}
          {showKpiStrip && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }} className="fadeup">
              <KpiCard
                label="Leads · 30d"
                value={c.leads30}
                delta={c.leads_delta}
                icon="inbox"
                color="var(--lime)"
                locked={!isLive(c, 'leads30')}
                lockSource={lockName('leads30')}
                onConnect={gotoConnect}
              />
              <KpiCard
                label="Booked jobs"
                value={c.bookings30}
                delta={c.bookings_delta}
                icon="calendar"
                color="var(--teal)"
                locked={!isLive(c, 'bookings30')}
                lockSource={lockName('bookings30')}
                onConnect={gotoConnect}
              />
              <KpiCard
                label="Revenue · 30d"
                value={fmtMoney(c.revenue30)}
                delta={c.revenue_delta}
                icon="euro"
                color="var(--blue)"
                locked={!isLive(c, 'revenue30')}
                lockSource={lockName('revenue30')}
                onConnect={gotoConnect}
              />
              <KpiCard
                label="ROAS"
                value={c.roas ? `${c.roas.toFixed(1)}x` : '—'}
                icon="trend"
                color="var(--amber)"
                sub={c.roas ? `€${c.ad_spend} spend` : 'no ads'}
                locked={!isLive(c, 'roas')}
                lockSource={lockName('roas')}
                onConnect={gotoConnect}
              />
              <KpiCard
                label="Reviews"
                value={c.reviews_rating}
                icon="star"
                color="var(--amber)"
                sub={`+${c.reviews_new30} this month · ${c.reviews_count} total`}
                locked={!isLive(c, 'reviews')}
                lockSource={lockName('reviews')}
                onConnect={gotoConnect}
              />
            </div>
          )}

          {/* Tab content */}
          {tab === 'onboarding' && (
            c.onboarding_active
              ? <OnboardingTracker c={c} onComplete={() => setTab('overview')} />
              : (
                <div className="panel fadeup" style={{ padding: 36, textAlign: 'center', borderColor: '#cfff3a3a', background: 'linear-gradient(135deg,#14180d,transparent 60%)' }}>
                  <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-lime)' }}>
                    <Icon name="check" size={22} />
                  </span>
                  <div style={{ font: '600 22px var(--font-sans)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                    Onboarding <em style={{ fontStyle: 'italic' }}>complete.</em>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 auto 20px', maxWidth: 340, lineHeight: 1.6 }}>
                    {c.name} was fully onboarded{c.onboarding_started ? ` — started ${c.onboarding_started}` : ''} and is now live on the dashboard.
                  </p>
                  <button onClick={() => setTab('overview')} className="btn btn-primary" style={{ height: 36, margin: '0 auto' }}>
                    <Icon name="arrowR" size={14} />Go to live dashboard
                  </button>
                </div>
              )
          )}
          {tab === 'overview' && <OverviewTab c={c} gotoConnect={gotoConnect} />}
          {tab === 'tasks' && <TasksTab c={c} />}
          {tab === 'marketing' && <MarketingTab c={c} />}
          {tab === 'automations' && (
            <div className="panel fadeup" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
              <div style={{ font: '600 15px var(--font-sans)', color: 'var(--text)', marginBottom: 8 }}>Automation canvas</div>
              <div style={{ fontSize: 13 }}>Coming soon — visual n8n workflow builder.</div>
            </div>
          )}
          {tab === 'leads' && <LeadsTab c={c} />}
          {tab === 'reputation' && <ReputationTab c={c} />}
          {tab === 'integrations' && (
            <ClientIntegrations
              c={c}
              onConnected={ids => setConnectedIds(ids)}
            />
          )}
          {tab === 'memory' && <ClientMemory c={c} />}
        </div>
      </div>
    </div>
  )
}
