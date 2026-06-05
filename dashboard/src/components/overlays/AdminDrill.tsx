'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { Avatar } from '@/components/ui/shared'
import { CLIENTS, getClient } from '@/lib/data'
import { fmtMoney } from '@/lib/utils'
import { useData } from '@/store/use-store'
import type { Client } from '@/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export type BriefItem = {
  t: string
  client?: string
  metric: string
  why: string
  action: string
  actionKind: 'task' | 'client' | 'tasks'
  urgent?: boolean
}

export type DrillTopic =
  | { type: 'stat'; key: 'mrr' | 'leads' | 'revenue' | 'health'; label: string }
  | { type: 'brief'; item: BriefItem; tone: 'lime' | 'red' | 'amber'; icon: string; toneLabel: string }
  | { type: 'clientMetric'; clientId: string; metric: 'leads' | 'revenue' | 'bookings' | 'reviews' }

// ─── Fake lead records per client ───────────────────────────────────────────

type LeadRecord = {
  id: string
  name: string
  svc: string
  area: string
  status: 'new' | 'contacted' | 'won' | 'lost' | 'quoted' | 'booked'
  src: string
  srcColor: string
  phone: string
  value: number
  ago: string
  enquiry: string
  reviewText: string
  timeline: Array<{ icon: string; t: string; d: string; when: string; c: string }>
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  new:       { label: 'New',     color: 'var(--blue)' },
  contacted: { label: 'Called',  color: 'var(--violet)' },
  quoted:    { label: 'Quoted',  color: 'var(--amber)' },
  booked:    { label: 'Booked',  color: 'var(--lime)' },
  won:       { label: 'Won',     color: '#3FE0A8' },
  lost:      { label: 'Lost',    color: 'var(--red)' },
}

function buildLeads(client: Client): LeadRecord[] {
  const seed = [
    { name: 'James O\'Brien',  svc: client.services[0] || 'Service', src: 'Google',    srcColor: '#4285F4', status: 'won'       as const, phone: '087 112 3456', value: 1800, ago: '3d ago',  enquiry: 'Looking for a full job done ASAP, been let down before.',  reviewText: 'Brilliant work, would highly recommend.' },
    { name: 'Siobhán Kelly',   svc: client.services[1] || 'Service', src: 'Facebook',  srcColor: '#1877F2', status: 'won'       as const, phone: '085 234 5678', value: 3200, ago: '5d ago',  enquiry: 'Wanted the best finish, budget not an issue.',              reviewText: 'Absolutely delighted, 10 out of 10.' },
    { name: 'Declan Walsh',    svc: client.services[0] || 'Service', src: 'Google',    srcColor: '#4285F4', status: 'quoted'    as const, phone: '086 345 6789', value: 950,  ago: '1d ago',  enquiry: 'Quick job, need it done before the weekend.',               reviewText: '' },
    { name: 'Aoife Byrne',     svc: client.services[2] || 'Service', src: 'Instagram', srcColor: '#E1306C', status: 'booked'    as const, phone: '083 456 7890', value: 600,  ago: '2d ago',  enquiry: 'Saw your work on Instagram, want the same.',                reviewText: '' },
    { name: 'Cormac Doyle',    svc: client.services[0] || 'Service', src: 'WhatsApp',  srcColor: '#25D366', status: 'new'       as const, phone: '087 567 8901', value: 1200, ago: 'today',   enquiry: 'Referred by a friend. Need a quote this week.',             reviewText: '' },
    { name: 'Niamh Murphy',    svc: client.services[1] || 'Service', src: 'Google',    srcColor: '#4285F4', status: 'contacted' as const, phone: '085 678 9012', value: 2400, ago: 'yesterday', enquiry: 'Big job, multiple areas, need full quote.',               reviewText: '' },
    { name: 'Pádraig Flynn',   svc: client.services[0] || 'Service', src: 'Referral',  srcColor: '#8B7CFF', status: 'won'       as const, phone: '086 789 0123', value: 4100, ago: '8d ago',  enquiry: 'Was told you\'re the only one to call for this.',           reviewText: 'Amazing, exactly what we needed.' },
    { name: 'Roisín McCarthy', svc: client.services[2] || 'Service', src: 'TikTok',   srcColor: '#FE2C55', status: 'lost'      as const, phone: '083 890 1234', value: 800,  ago: '4d ago',  enquiry: 'Budget is quite tight, looking for best price.',            reviewText: '' },
  ]

  return seed.slice(0, Math.min(client.leads30 || 5, seed.length)).map((s, i) => ({
    id: client.id + '-l' + i,
    name: s.name,
    svc: s.svc,
    area: client.city || 'Ireland',
    status: s.status,
    src: s.src,
    srcColor: s.srcColor,
    phone: s.phone,
    value: s.value,
    ago: s.ago,
    enquiry: s.enquiry,
    reviewText: s.reviewText,
    timeline: [
      { icon: 'inbox',    t: 'Lead received',     d: 'via ' + s.src,                                c: 'var(--blue)',    when: s.ago },
      { icon: 'phone',    t: 'Called back',        d: 'Spoke for 4 mins, interested',                c: 'var(--violet)', when: s.ago },
      { icon: 'doc',      t: 'Quote sent',         d: fmtMoney(s.value) + ' inc. materials',        c: 'var(--amber)',  when: s.ago },
      ...(s.status === 'won' ? [{ icon: 'check', t: 'Job won', d: 'Deposit received', c: '#3FE0A8', when: s.ago }] : []),
    ],
  }))
}

// ─── AdminRecord (lead deep view) ───────────────────────────────────────────

function AdminRecord({ l }: { l: LeadRecord }) {
  const sm = STATUS_META[l.status] || { label: l.status, color: 'var(--text-3)' }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, display: 'grid', placeItems: 'center', background: l.srcColor + '26', color: l.srcColor, font: '700 17px var(--font-sans)' }}>
          {l.name[0]}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.svc} · {l.area}</span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 99, border: `1px solid ${sm.color}55`, color: sm.color, background: sm.color + '14', whiteSpace: 'nowrap' }}>{sm.label}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)' }}>
        <a
          href={`tel:${l.phone.replace(/\s/g, '')}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 16px', alignItems: 'center', textDecoration: 'none', borderRight: '1px solid var(--border)' }}
        >
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{l.phone}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Phone</span>
        </a>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 16px', alignItems: 'center', borderRight: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: l.srcColor }}>{l.src}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Source</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 16px', alignItems: 'center' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{fmtMoney(l.value)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.status === 'won' ? 'Job value' : l.status === 'lost' ? 'Missed' : 'Quote'}</span>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>The enquiry</span>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '3px solid var(--border-strong)' }}>
          "{l.enquiry}"
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Full journey</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {l.timeline.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: e.c + '22', color: e.c, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={e.icon} size={13} />
                </span>
                {i < l.timeline.length - 1 && (
                  <span style={{ flex: 1, width: 1, background: 'var(--border)', margin: '3px 0' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 14, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{e.t}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.when}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{e.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── AdminDrill main component ───────────────────────────────────────────────

export function AdminDrill({ topic, onClose }: { topic: DrillTopic | null; onClose: () => void }) {
  const router = useRouter()
  const addTask = useData(s => s.addTask)
  const [record, setRecord] = useState<LeadRecord | null>(null)

  useEffect(() => { setRecord(null) }, [topic])

  if (!topic) return null

  function go(clientId: string) {
    router.push(`/dashboard/clients/${clientId}`)
    onClose()
  }

  // ─── Stat body ──────────────────────────────────────────────────────────

  let headTitle = ''
  let headSub = ''
  let headTone: string | undefined
  let headBack = false
  let body: React.ReactNode = null

  if (topic.type === 'stat') {
    const { key } = topic
    const getVal = (c: Client) =>
      key === 'mrr' ? c.mrr :
      key === 'leads' ? c.leads30 :
      key === 'revenue' ? c.revenue30 :
      c.health

    const fmt = (v: number) =>
      key === 'mrr' || key === 'revenue' ? fmtMoney(v) : String(v)

    const rows = [...CLIENTS].map(c => ({ c, v: getVal(c) })).sort((a, b) => b.v - a.v)
    const total = key === 'health'
      ? Math.round(rows.reduce((a, r) => a + r.v, 0) / rows.length)
      : rows.reduce((a, r) => a + r.v, 0)
    const max = Math.max(...rows.map(r => r.v), 1)
    const sorted = key === 'health' ? [...rows].reverse() : rows

    headTitle = topic.label
    headSub = (key === 'health' ? 'Avg ' + total : fmt(total)) + ' across ' + rows.length + ' clients'

    body = (
      <>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            {key === 'health' ? total : fmt(total)}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>{topic.label} · this month</div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {key === 'health' ? 'Lowest first — who needs attention' : "Who's contributing"}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sorted.map(({ c, v }) => (
              <button
                key={c.id}
                onClick={() => go(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginLeft: 8, flexShrink: 0 }}>{fmt(v)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, transition: 'width 0.4s ease',
                      width: (v / max * 100) + '%',
                      background: key === 'health'
                        ? (v < 65 ? 'var(--red)' : v < 80 ? 'var(--amber)' : 'var(--lime)')
                        : c.color,
                    }} />
                  </div>
                </div>
                <Icon name="chevR" size={14} color="var(--text-3)" />
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ─── Brief body ──────────────────────────────────────────────────────────

  else if (topic.type === 'brief') {
    const it = topic.item
    const c = it.client ? getClient(it.client) : undefined
    const toneColor =
      topic.tone === 'lime' ? 'var(--lime)' :
      topic.tone === 'red'  ? 'var(--red)'  :
      'var(--amber)'

    headTitle = topic.toneLabel
    headSub = c ? c.name : 'Portfolio'
    headTone = toneColor

    const readout: [string, string][] = []
    if (c) {
      if (it.metric === 'roas')    { readout.push(['ROAS', (c.roas || 0).toFixed(1) + '×']); readout.push(['Ad spend', fmtMoney(c.ad_spend || 0)]); readout.push(['Leads · 30d', String(c.leads30)]) }
      else if (it.metric === 'leads')   { readout.push(['Leads · 30d', String(c.leads30)]); readout.push(['Change', (c.leads_delta >= 0 ? '+' : '') + Math.round(c.leads_delta * 100) + '%']); readout.push(['Bookings', String(c.bookings30)]) }
      else if (it.metric === 'reviews') { readout.push(['Rating', c.reviews_rating.toFixed(1)]); readout.push(['New · 30d', '+' + c.reviews_new30]); readout.push(['Total', String(c.reviews_count)]) }
      else if (it.metric === 'missed')  { readout.push(['Missed calls', String(c.missed_calls)]); readout.push(['Leads · 30d', String(c.leads30)]); readout.push(['Health', String(c.health)]) }
      else if (it.metric === 'plan')    { readout.push(['Plan', c.plan]); readout.push(['MRR', fmtMoney(c.mrr)]); readout.push(['Leads · 30d', String(c.leads30)]) }
      else { readout.push(['Health', String(c.health)]); readout.push(['Leads', String(c.leads30)]); readout.push(['MRR', fmtMoney(c.mrr)]) }
    }

    body = (
      <>
        {/* Hero brief card */}
        <div style={{ margin: '16px 20px 0', padding: '14px 16px', borderRadius: 12, border: `1px solid ${toneColor}44`, background: toneColor + '10', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: toneColor, flexShrink: 0, marginTop: 1 }}>
            <Icon name={topic.icon} size={14} />
          </span>
          <span style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45 }}>{it.t}</span>
        </div>

        {/* Client card */}
        {c && (
          <button
            onClick={() => go(c.id)}
            style={{ margin: '10px 20px 0', display: 'flex', alignItems: 'center', gap: 12, width: 'calc(100% - 40px)', padding: '11px 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .12s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Avatar client={c} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{c.name}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{c.city} · {c.niche} · {c.plan}</span>
            </div>
            <Icon name="chevR" size={14} color="var(--text-3)" />
          </button>
        )}

        {/* Metric readout */}
        {readout.length > 0 && (
          <div style={{ margin: '10px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderRadius: 11, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {readout.map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '12px 14px', alignItems: 'center', borderRight: i < readout.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{v}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{l}</span>
              </div>
            ))}
          </div>
        )}

        {/* What this means */}
        <div style={{ margin: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>What this means</span>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{it.why}</p>
        </div>

        {/* Recommended next step */}
        <div style={{ margin: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Recommended next step</span>
          <div style={{ padding: '13px 14px', borderRadius: 11, border: `1px solid ${toneColor}44`, background: toneColor + '08', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: toneColor, flexShrink: 0 }}><Icon name="bolt" size={14} /></span>
            <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>{it.action}</span>
            {it.actionKind === 'task' && (
              <button
                onClick={() => {
                  addTask({
                    title: it.action + (c ? ' — ' + c.name : ''),
                    client_id: it.client || null,
                    priority: it.urgent ? 'P0' : 'P1',
                    due_date: 'Today',
                    category:
                      it.metric === 'roas' || it.metric === 'ads' ? 'Ads' :
                      it.metric === 'reviews' ? 'Reputation' :
                      it.metric === 'plan' ? 'Sales' : 'Account',
                    status: 'todo',
                  })
                  onClose()
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 11px', borderRadius: 8, border: 'none', background: toneColor, color: toneColor === 'var(--lime)' ? '#0a0a0a' : '#fff', font: '600 12px var(--font-sans)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <Icon name="plus" size={12} />
                Create task
              </button>
            )}
            {it.actionKind === 'tasks' && (
              <button
                onClick={() => { router.push('/dashboard/tasks'); onClose() }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 11px', borderRadius: 8, border: 'none', background: toneColor, color: toneColor === 'var(--lime)' ? '#0a0a0a' : '#fff', font: '600 12px var(--font-sans)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Open
                <Icon name="arrowR" size={12} />
              </button>
            )}
            {it.actionKind === 'client' && c && (
              <button
                onClick={() => go(c.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 11px', borderRadius: 8, border: 'none', background: toneColor, color: toneColor === 'var(--lime)' ? '#0a0a0a' : '#fff', font: '600 12px var(--font-sans)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Open
                <Icon name="arrowR" size={12} />
              </button>
            )}
          </div>
        </div>
      </>
    )
  }

  // ─── Client metric body ──────────────────────────────────────────────────

  else if (topic.type === 'clientMetric') {
    const c = getClient(topic.clientId)
    if (!c) {
      headTitle = 'Not found'
      headSub = ''
      body = <div style={{ padding: 20, color: 'var(--text-2)' }}>Client not found.</div>
    } else {
      const leads = buildLeads(c)
      const { metric } = topic

      if (record) {
        headTitle = record.name
        headSub = record.svc + ' · ' + record.area
        headBack = true
        body = <AdminRecord l={record} />
      } else if (metric === 'leads') {
        headTitle = c.name + ' · Leads'
        headSub = c.leads30 + ' this month · ' + (c.leads_delta >= 0 ? '+' : '') + Math.round(c.leads_delta * 100) + '%'
        body = (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Every lead · tap to open</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leads.map(l => {
                const sm = STATUS_META[l.status] || { label: l.status, color: 'var(--text-3)' }
                return (
                  <button
                    key={l.id}
                    onClick={() => setRecord(l)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .12s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: l.srcColor + '22', color: l.srcColor, display: 'grid', placeItems: 'center', flexShrink: 0, font: '700 12px var(--font-sans)' }}>
                      {l.name[0]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{l.svc} · via {l.src}</span>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 99, border: `1px solid ${sm.color}55`, color: sm.color, whiteSpace: 'nowrap' }}>{sm.label}</span>
                    <Icon name="chevR" size={14} color="var(--text-3)" />
                  </button>
                )
              })}
            </div>
          </div>
        )
      } else if (metric === 'reviews') {
        headTitle = c.name + ' · Reviews'
        headSub = c.reviews_rating + '★ · ' + c.reviews_count + ' total'
        const won = leads.filter(l => l.status === 'won')
        body = (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Recent reviewers</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {won.map(l => (
                <div key={l.id} style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{l.name}</span>
                    <span style={{ color: '#FFC53D', fontSize: 12 }}>★★★★★</span>
                  </div>
                  {l.reviewText && <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{l.reviewText}"</p>}
                </div>
              ))}
            </div>
          </div>
        )
      } else {
        // revenue / bookings
        const won = leads.filter(l => l.status === 'won')
        headTitle = c.name + ' · ' + (metric === 'revenue' ? 'Revenue' : 'Jobs')
        headSub = metric === 'revenue' ? fmtMoney(c.revenue30) + ' this month' : c.bookings30 + ' booked'
        body = (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Jobs won · tap to open</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {won.map(l => (
                <button
                  key={l.id}
                  onClick={() => setRecord(l)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--lime)22', color: 'var(--lime)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={13} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{l.svc} · {l.ago}</span>
                  </div>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, color: 'var(--lime)' }}>{fmtMoney(l.value)}</span>
                  <Icon name="chevR" size={14} color="var(--text-3)" />
                </button>
              ))}
            </div>
          </div>
        )
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
          background: 'var(--bg-1)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          animation: 'adr-slide-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 56, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {headBack ? (
            <button
              onClick={() => setRecord(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-2)', font: '500 12px var(--font-sans)', cursor: 'pointer' }}
            >
              <Icon name="chevL" size={13} />
              Back
            </button>
          ) : (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: headTone || 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headTitle}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{headSub}</span>
            </div>
          )}
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 16 }}>
          {body}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--lime)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Live data · pulled from connected accounts</span>
        </div>
      </div>
    </div>
  )
}

export default AdminDrill
