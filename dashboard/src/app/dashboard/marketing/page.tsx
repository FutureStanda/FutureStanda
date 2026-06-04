'use client'

import React from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { BarChart } from '@/components/ui/charts'
import { CLIENTS, getClient } from '@/lib/data'
import { fmtMoney } from '@/lib/utils'

// ---- Horizontal bar chart for ROAS ranking ----
interface HBarItem {
  label: string
  value: number
  color: string
  name: string
}

function HBars({ items, valueFmt = (v: number) => String(v) }: { items: HBarItem[]; valueFmt?: (v: number) => string }) {
  const max = Math.max(...items.map(i => i.value)) || 1
  return (
    <div className="col gap-2" style={{ marginTop: 8 }}>
      {items.map((item, i) => (
        <div key={i} className="row gap-3" style={{ alignItems: 'center' }}>
          <span style={{ width: 72, fontSize: 11.5, color: 'var(--text-2)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
          <div style={{ flex: 1, height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(item.value / max) * 100}%`,
                background: item.color,
                borderRadius: 4,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <span style={{ width: 42, fontSize: 12, fontWeight: 600, color: item.color, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {valueFmt(item.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---- Content calendar data ----
const CONTENT_SCHEDULE: Record<string, Array<{ clientId: string; type: string }>> = {
  Mon: [{ clientId: 'coastal-roofing', type: 'Reel' }, { clientId: 'kelly-detailing', type: 'TikTok' }],
  Tue: [{ clientId: 'murphy-plumbing', type: 'Google post' }],
  Wed: [{ clientId: 'atlantic-dental', type: 'Carousel' }, { clientId: 'riverside-cafe', type: 'Story' }],
  Thu: [{ clientId: 'kelly-detailing', type: 'Reel' }, { clientId: 'riverside-cafe', type: 'Reel' }],
  Fri: [{ clientId: 'osullivan-electrical', type: 'Email' }],
  Sat: [{ clientId: 'burke-landscaping', type: 'Review post' }],
  Sun: [],
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ---- Page ----
export default function MarketingPage() {
  const withAds = CLIENTS.filter(c => c.ad_spend > 0)
  const totalSpend = withAds.reduce((a, c) => a + c.ad_spend, 0)
  const totalLeads = withAds.reduce((a, c) => a + c.leads30, 0)
  const avgRoas = withAds.length > 0
    ? (withAds.reduce((a, c) => a + c.roas, 0) / withAds.length).toFixed(1)
    : '0.0'
  const costPerLead = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0

  const roasBars: HBarItem[] = [...withAds]
    .sort((a, b) => b.roas - a.roas)
    .map(c => ({
      label: c.name.split(' ')[0],
      name: c.name,
      value: c.roas,
      color: c.roas >= 5 ? 'var(--lime)' : c.roas >= 3.5 ? 'var(--amber)' : 'var(--red)',
    }))

  const spendBars = [...withAds]
    .sort((a, b) => b.ad_spend - a.ad_spend)
    .slice(0, 6)
    .map(c => ({ l: c.name.split(' ')[0], v: c.ad_spend, color: c.color }))

  const stats = [
    { label: 'Ad spend · 30d', value: fmtMoney(totalSpend), color: 'var(--text)' },
    { label: 'Leads from ads', value: totalLeads.toString(), color: 'var(--teal)' },
    { label: 'Blended ROAS', value: avgRoas + 'x', color: 'var(--lime)' },
    { label: 'Cost / lead', value: '€' + costPerLead, color: 'var(--text)' },
  ]

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Marketing' }]} />
      <div className="page-inner col gap-4 fadeup" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60, paddingTop: 28 }}>
        {/* Header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">Across {withAds.length} advertising accounts</div>
            <h1 className="h-display" style={{ fontSize: 38, margin: 0 }}>Marketing</h1>
          </div>
          <button className="btn btn-primary">
            <Icon name="plus" size={14} />Launch campaign
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {stats.map((s, i) => (
            <div key={i} className="panel" style={{ padding: '16px 18px' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>{s.label}</div>
              <div
                className="num"
                style={{ font: '600 26px var(--font-sans)', color: s.color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
          {/* ROAS by client */}
          <div className="panel" style={{ padding: 18, flex: 1 }}>
            <div className="col gap-1" style={{ marginBottom: 14 }}>
              <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>ROAS by client</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Return on ad spend · ranked</span>
            </div>
            <HBars
              items={roasBars}
              valueFmt={v => v.toFixed(1) + 'x'}
            />
          </div>

          {/* Spend distribution */}
          <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
            <div className="col gap-1" style={{ marginBottom: 14 }}>
              <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>Spend distribution</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Top 6 accounts · this month</span>
            </div>
            <BarChart
              data={spendBars}
              h={170}
              valueFmt={v => '€' + v}
            />
          </div>
        </div>

        {/* Content calendar */}
        <div className="panel" style={{ padding: 18 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <div className="col gap-1">
              <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>Content calendar</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Scheduled across all accounts · this week</span>
            </div>
            <button className="btn" style={{ height: 28 }}>
              <Icon name="calendar" size={13} />Full calendar
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {DAYS.map(d => {
              const items = CONTENT_SCHEDULE[d] || []
              return (
                <div key={d} className="col gap-2">
                  <div className="row between" style={{ paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ font: '600 11px var(--font-sans)', color: 'var(--text-3)' }}>{d}</span>
                    {items.length > 0 && (
                      <span className="chip chip-dim" style={{ height: 16, padding: '0 5px', fontSize: 9 }}>
                        {items.length}
                      </span>
                    )}
                  </div>
                  <div className="col gap-2" style={{ minHeight: 90 }}>
                    {items.map((item, i) => {
                      const cl = getClient(item.clientId)
                      if (!cl) return null
                      return (
                        <div
                          key={i}
                          className="col gap-1"
                          style={{
                            padding: '7px 8px', borderRadius: 8,
                            background: 'var(--bg-2)',
                            border: '1px solid var(--border)',
                            borderLeft: `2px solid ${cl.color}`,
                          }}
                        >
                          <span style={{ fontSize: 10.5, color: 'var(--text-2)', fontWeight: 600 }}>{item.type}</span>
                          <span style={{ fontSize: 9.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cl.name.split(' ')[0]}
                          </span>
                        </div>
                      )
                    })}
                    {items.length === 0 && (
                      <div style={{ minHeight: 90 }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
