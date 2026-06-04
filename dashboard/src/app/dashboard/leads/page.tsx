'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Segmented } from '@/components/ui/shared'
import { Icon } from '@/components/ui/icons'
import { useUI } from '@/store/use-store'
import { LEADS_DATA } from '@/lib/data'

// ---- Types ----
interface LeadItem {
  id: string
  business: string
  person: string
  niche: string
  area: string
  stage: string
  research: string
  meetingAt: string
  meetingIn: string
  value: number
  color: string
  introSent: boolean
  priority: number
}

// ---- Research badge ----
function ResearchBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: string }> = {
    complete: { cls: 'chip-lime', label: 'Dossier ready', icon: 'check' },
    running: { cls: 'chip-violet', label: 'Researching', icon: 'sparkle' },
    queued: { cls: 'chip-dim', label: 'Queued', icon: 'clock' },
  }
  const m = map[status] || map.queued
  return (
    <span className={`chip ${m.cls}`}>
      <Icon name={m.icon} size={11} />{m.label}
    </span>
  )
}

// ---- Stage helpers ----
function stageColor(id: string) {
  return (LEADS_DATA.stages.find(s => s.id === id) || { color: 'var(--text-3)' }).color
}
function stageLabel(id: string) {
  return (LEADS_DATA.stages.find(s => s.id === id) || { label: id }).label
}

// ---- Pipeline view ----
function PipelineView({ leads }: { leads: LeadItem[] }) {
  const stages = LEADS_DATA.stages.filter(s => s.id !== 'lost')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(180px, 1fr))`, gap: 12, alignItems: 'flex-start', overflowX: 'auto' }}>
      {stages.map(st => {
        const items = leads.filter(l => l.stage === st.id)
        return (
          <div key={st.id} className="panel" style={{ padding: 12 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="row gap-2" style={{ font: '600 12px var(--font-sans)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: st.color }} />
                {st.label}
              </span>
              <span className="chip chip-dim">{items.length}</span>
            </div>
            <div className="col gap-2">
              {items.map(l => (
                <div
                  key={l.id}
                  className="col gap-2"
                  style={{
                    padding: 12, borderRadius: 11,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    cursor: 'default',
                    borderLeft: `3px solid ${l.color}`,
                  }}
                >
                  <div className="row gap-2" style={{ minWidth: 0 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, background: l.color, color: '#0a0a0a',
                      display: 'grid', placeItems: 'center', font: '700 10px var(--font-sans)', flexShrink: 0,
                    }}>
                      {l.business[0]}
                    </span>
                    <span style={{ font: '600 12.5px var(--font-sans)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.business}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.person} · {l.niche}</span>
                  <div className="row between" style={{ marginTop: 2 }}>
                    <span className="row gap-2" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                      <Icon name="calendar" size={11} />{l.meetingIn}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lime)', fontVariantNumeric: 'tabular-nums' }}>
                      €{l.value.toLocaleString()}
                    </span>
                  </div>
                  {l.stage === 'researching' && <ResearchBadge status={l.research} />}
                </div>
              ))}
              {!items.length && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '14px 0' }}>—</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Meetings view ----
function MeetingsView({ leads }: { leads: LeadItem[] }) {
  const upcoming = leads
    .filter(l => !['won', 'lost'].includes(l.stage) && l.meetingIn !== 'done')
    .sort((a, b) => a.priority - b.priority)

  return (
    <div className="col gap-4">
      {/* Telegram banner */}
      <div
        className="panel"
        style={{
          padding: 16,
          background: 'linear-gradient(120deg, #0e1a1f, transparent 60%)',
          borderColor: '#229ED944',
        }}
      >
        <div className="row gap-3">
          <span style={{
            width: 34, height: 34, borderRadius: 10, background: '#229ED9', color: '#fff',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name="msg" size={18} />
          </span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '600 13.5px var(--font-sans)' }}>Telegram reminders are on</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              You&apos;ll get pinged 1 hour and 10 minutes before every call below — no meeting slips.
            </span>
          </div>
          <span className="chip chip-lime" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--lime)' }} />Connected
          </span>
        </div>
      </div>

      {/* Upcoming calls */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ font: '600 14px var(--font-sans)' }}>Upcoming discovery calls</span>
        </div>
        {upcoming.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No upcoming meetings
          </div>
        )}
        {upcoming.map((l, i) => {
          const parts = l.meetingAt.split('·')
          const time = parts[1]?.trim() || ''
          const date = parts[0]?.trim() || l.meetingAt
          return (
            <div
              key={l.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'transparent',
              }}
            >
              <div className="col" style={{ alignItems: 'center', width: 64, flexShrink: 0, gap: 2 }}>
                <span style={{ font: '600 17px var(--font-sans)', color: l.color }}>{time}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{date}</span>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ font: '600 13.5px var(--font-sans)', color: 'var(--text)' }}>{l.business}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l.person} · {l.niche} · {l.area}</span>
              </div>
              <span className="chip chip-dim">{l.meetingIn}</span>
              <div className="row gap-2">
                {l.introSent && (
                  <span className="chip chip-lime" title="Intro sent">
                    <Icon name="check" size={11} />Intro
                  </span>
                )}
                <ResearchBadge status={l.research} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Process map ----
function ProcessMapView() {
  const steps = [
    { n: '01', t: 'Capture', c: '#5BCEFA', icon: 'plus', d: 'Click New Lead, fill the intake — contact, their world, and the qualifying gold.', tags: ['Quick Add', 'Intake form'] },
    { n: '02', t: 'Automations fire', c: '#25D366', icon: 'bolt', d: 'One submit triggers 5 systems at once — nothing done by hand.', tags: ['Saved to DB', 'Telegram', 'Intro msg'] },
    { n: '03', t: 'Research agent', c: '#8B7CFF', icon: 'sparkle', d: 'Deep-mode scan: audit, competitors, Meta Ad Library, US-niche plays, gap → goal.', tags: ['47 sources', 'Deep mode'] },
    { n: '04', t: 'Auto-prep', c: '#CFFF3A', icon: 'doc', d: 'A custom meeting brief + proposal draft built from their answers and the research.', tags: ['Brief', 'Proposal draft'] },
    { n: '05', t: 'Meeting', c: '#FFB547', icon: 'phone', d: 'Walk in with their competition pulled apart and a plan. Telegram reminded you.', tags: ['Reminded', 'Pitched'] },
    { n: '06', t: 'Delivery', c: '#3FE0A8', icon: 'shield', d: 'Won → onboarding → their own command centre live. Lead becomes a client.', tags: ['Onboard', 'Dashboard live'] },
  ]

  return (
    <div className="col gap-4">
      <div className="panel" style={{ padding: 20 }}>
        <div className="col gap-1" style={{ marginBottom: 18 }}>
          <span style={{ font: '600 15px var(--font-sans)', color: 'var(--text)' }}>Lead capture → delivery</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>The full machine, end to end</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              className="col gap-3"
              style={{
                padding: 16, borderRadius: 14,
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: -10, right: -6,
                font: '700 56px var(--font-sans)', color: s.c,
                opacity: 0.08, letterSpacing: '-0.04em',
                pointerEvents: 'none',
              }}>
                {s.n}
              </div>
              <div className="row gap-2">
                <span style={{
                  width: 32, height: 32, borderRadius: 9, background: s.c, color: '#0a0a0a',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name={s.icon} size={15} />
                </span>
                <div className="col" style={{ gap: 0 }}>
                  <span className="eyebrow" style={{ color: s.c }}>Step {s.n}</span>
                  <span style={{ font: '600 14px var(--font-sans)' }}>{s.t}</span>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{s.d}</span>
              <div className="row gap-2" style={{ flexWrap: 'wrap', marginTop: 'auto' }}>
                {s.tags.map(tg => <span key={tg} className="chip chip-dim">{tg}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Table view ----
function TableView({ leads }: { leads: LeadItem[] }) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr',
        gap: 12, padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-2)',
      }}>
        {['Business', 'Contact', 'Stage', 'Meeting', 'Value', 'Research'].map((h, i) => (
          <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>
        ))}
      </div>
      {leads.map(l => (
        <div
          key={l.id}
          style={{
            display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr',
            gap: 12, alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 7, background: l.color, color: '#0a0a0a',
              display: 'grid', placeItems: 'center', font: '700 11px var(--font-sans)', flexShrink: 0,
            }}>
              {l.business[0]}
            </span>
            <div className="col" style={{ minWidth: 0 }}>
              <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.business}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.niche}</span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.person}</span>
          <span
            className="chip"
            style={{
              width: 'fit-content',
              background: stageColor(l.stage) + '22',
              color: stageColor(l.stage),
              borderColor: stageColor(l.stage) + '44',
            }}
          >
            {stageLabel(l.stage)}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l.meetingAt}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lime)', fontVariantNumeric: 'tabular-nums' }}>
            €{l.value.toLocaleString()}
          </span>
          <ResearchBadge status={l.research} />
        </div>
      ))}
    </div>
  )
}

// ---- Page ----
export default function LeadsPage() {
  const { setLeadOpen } = useUI()
  const [view, setView] = useState<'pipeline' | 'meetings' | 'process' | 'table'>('pipeline')

  const leads = LEADS_DATA.leads as LeadItem[]
  const liveCount = leads.filter(l => !['won', 'lost'].includes(l.stage)).length
  const meetingsCount = leads.filter(l => !['won', 'lost'].includes(l.stage) && l.meetingIn !== 'done').length
  const researchingCount = leads.filter(l => l.research === 'running' || l.research === 'queued').length

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Leads' }]} />
      <div className="page-inner col gap-4 fadeup" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60, paddingTop: 28 }}>
        {/* Header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">
              {liveCount} in pipeline · {meetingsCount} meetings booked · {researchingCount} researching
            </div>
            <h1 className="h-display" style={{ fontSize: 38, margin: 0 }}>Leads</h1>
          </div>
          <button
            onClick={() => setLeadOpen(true)}
            className="btn btn-primary"
            style={{ height: 36 }}
          >
            <Icon name="plus" size={14} />New lead
          </button>
        </div>

        {/* View toggle + live indicator */}
        <div className="row between">
          <Segmented
            options={[
              { value: 'pipeline' as const, label: 'Pipeline' },
              { value: 'meetings' as const, label: 'Meetings' },
              { value: 'process' as const, label: 'Process map' },
              { value: 'table' as const, label: 'All leads' },
            ]}
            value={view}
            onChange={(v) => setView(v as 'pipeline' | 'meetings' | 'process' | 'table')}
          />
          {view !== 'process' && (
            <span className="row gap-2" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              <span className="live-dot" />Telegram synced
            </span>
          )}
        </div>

        {/* Views */}
        {view === 'pipeline' && <PipelineView leads={leads} />}
        {view === 'meetings' && <MeetingsView leads={leads} />}
        {view === 'process' && <ProcessMapView />}
        {view === 'table' && <TableView leads={leads} />}
      </div>
    </div>
  )
}
