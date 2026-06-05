'use client'

import React from 'react'
import { Icon } from '@/components/ui/icons'
import type { Client } from '@/types'

interface Props {
  c: Client
}

interface MemoryFact {
  label: string
  value: string
  icon: string
}

interface Observation {
  t: string
  kind: 'win' | 'risk' | 'trend'
  text: string
}

function PanelHead({
  title,
  sub,
  action,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
}) {
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

export function ClientMemory({ c }: Props) {
  const m = c.memory || {}

  // Static facts captured at onboarding
  const facts: MemoryFact[] = [
    m.why       && { label: 'Why them',      value: m.why,              icon: 'flame' },
    m.ideal     && { label: 'Ideal client',  value: m.ideal,            icon: 'target' },
    m.competitor && { label: 'Hunting',      value: m.competitor,       icon: 'trend' },
    m.vibe      && { label: 'Brand vibe',    value: m.vibe,             icon: 'sparkle' },
    (c.services && c.services.length > 0) && { label: 'Lead service', value: c.services[0], icon: 'bolt' },
  ].filter(Boolean) as MemoryFact[]

  // Observations derived from live metrics
  const obs: Observation[] = []

  if (c.leads_delta > 0.2) {
    obs.push({ t: '2d', kind: 'win', text: `Leads accelerating — up ${Math.round(c.leads_delta * 100)}% MoM. Demand engine is working.` })
  }
  if (c.leads_delta < 0) {
    obs.push({ t: '1d', kind: 'risk', text: `Leads softened ${Math.round(Math.abs(c.leads_delta) * 100)}% — watching for a fix before it compounds.` })
  }
  if (c.roas >= 5) {
    obs.push({ t: '4d', kind: 'win', text: `ROAS holding at ${c.roas.toFixed(1)}x — top quartile. Room to scale spend.` })
  }
  if (c.roas > 0 && c.roas < 3.5) {
    obs.push({ t: '3d', kind: 'risk', text: `ROAS at ${c.roas.toFixed(1)}x is below target — creative likely fatigued.` })
  }
  if (c.missed_calls > 3) {
    obs.push({ t: '6h', kind: 'risk', text: `${c.missed_calls} missed calls this week — chatbot routing needs a look.` })
  }
  if (c.reviews_new30 > 15) {
    obs.push({ t: '1w', kind: 'win', text: `${c.reviews_new30} new 5★ reviews in 30 days — reputation compounding.` })
  }
  if (c.bookings_delta > 0.15) {
    obs.push({ t: '5d', kind: 'trend', text: `Booking rate climbing — qualifying flow converting better.` })
  }
  // Always present trailing summary
  obs.push({
    t: 'now',
    kind: 'trend',
    text: `Tracking ${c.leads30} leads, ${c.bookings30} bookings and €${(c.revenue30 || 0).toLocaleString()} revenue this month.`,
  })

  const kindStyle: Record<string, { color: string; icon: string }> = {
    win:   { color: 'var(--lime)',   icon: 'trend' },
    risk:  { color: 'var(--red)',    icon: 'shield' },
    trend: { color: 'var(--blue)',   icon: 'pulse' },
  }

  const firstName = c.name.split(' ')[0]

  return (
    <div className="col gap-4 fadeup">
      {/* Header */}
      <div
        className="panel"
        style={{
          padding: 18,
          background: 'linear-gradient(120deg,#14111f,transparent 60%)',
          borderColor: '#8b7cff3a',
        }}
      >
        <div className="row gap-3">
          <span style={{
            width: 38, height: 38, borderRadius: 11,
            background: '#8B7CFF', color: '#0a0a0a',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name="sparkle" size={18} />
          </span>
          <div className="col" style={{ gap: 2 }}>
            <span className="row gap-2" style={{ font: '600 14px var(--font-sans)' }}>
              What BizBoost knows about {firstName}
              <span
                className="live-dot"
                style={{ background: '#8B7CFF', width: 6, height: 6, borderRadius: 99, flexShrink: 0 }}
              />
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Seeded at onboarding · keeps learning as the numbers move
            </span>
          </div>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
        {/* Profile memory — left */}
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Profile memory" sub="From the onboarding inputs" />
          {facts.length > 0 ? (
            <div className="col gap-2">
              {facts.map((f, i) => (
                <div
                  key={i}
                  className="col gap-2"
                  style={{
                    padding: '11px 13px',
                    borderRadius: 11,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    className="row gap-2"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--violet)',
                    }}
                  >
                    <Icon name={f.icon} size={11} />
                    {f.label}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>No onboarding notes captured yet.</span>
          )}
        </div>

        {/* Learned over time — right */}
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead
            title="Learned over time"
            sub="Observations from live metrics"
            action={
              <span className="chip chip-violet">
                <span
                  className="live-dot"
                  style={{ background: '#8B7CFF', width: 6, height: 6, borderRadius: 99, flexShrink: 0 }}
                />
                live
              </span>
            }
          />
          <div className="col" style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute', left: 13, top: 6, bottom: 6,
              width: 1, background: 'var(--border)',
            }} />
            {obs.map((o, i) => {
              const k = kindStyle[o.kind] || kindStyle.trend
              return (
                <div key={i} className="row gap-3" style={{ padding: '8px 0', position: 'relative' }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    display: 'grid', placeItems: 'center',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    color: k.color,
                    zIndex: 1,
                  }}>
                    <Icon name={k.icon} size={12} />
                  </span>
                  <div className="col" style={{ gap: 2, flex: 1 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                      {o.text}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                      {o.t === 'now' ? 'just now' : `${o.t} ago`}
                    </span>
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

export default ClientMemory
