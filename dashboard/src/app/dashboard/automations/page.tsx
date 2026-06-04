'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/shared'

// ---- Seed automations data ----
interface AutomationSeed {
  id: string
  name: string
  trigger: string
  triggerSource: string
  steps: number
  client: string | null
  enabled: boolean
  runCount: number
  lastRun: string
  icon: string
  accent: string
}

const SEED_AUTOMATIONS: AutomationSeed[] = [
  { id: 'a1', name: 'Review Request — Post-job SMS', trigger: 'Status changes', triggerSource: 'Job completed', steps: 3, client: null, enabled: true, runCount: 204, lastRun: '26m ago', icon: 'star', accent: 'var(--lime)' },
  { id: 'a2', name: 'Missed Call Text-Back', trigger: 'Missed call', triggerSource: 'Phone system', steps: 4, client: null, enabled: true, runCount: 87, lastRun: '1h ago', icon: 'phoneMissed', accent: 'var(--amber)' },
  { id: 'a3', name: 'New Lead Telegram Alert', trigger: 'Lead created', triggerSource: 'Meta / web form', steps: 2, client: null, enabled: true, runCount: 312, lastRun: '4m ago', icon: 'inbox', accent: 'var(--teal)' },
  { id: 'a4', name: 'Weekly Report Email', trigger: 'Every Mon 08:00', triggerSource: 'Schedule', steps: 3, client: null, enabled: true, runCount: 36, lastRun: '2d ago', icon: 'trend', accent: 'var(--violet)' },
  { id: 'a5', name: 'GBP Review Responder', trigger: 'New review', triggerSource: 'Google Business', steps: 2, client: null, enabled: true, runCount: 1240, lastRun: '9m ago', icon: 'globe', accent: '#4285F4' },
  { id: 'a6', name: 'Booking Confirmation SMS', trigger: 'Slot booked', triggerSource: 'Calendly', steps: 2, client: null, enabled: true, runCount: 146, lastRun: '12m ago', icon: 'calendar', accent: 'var(--blue)' },
  { id: 'a7', name: 'Stale Lead Rescue', trigger: 'No reply in 48h', triggerSource: 'CRM', steps: 3, client: null, enabled: false, runCount: 19, lastRun: '—', icon: 'flame', accent: 'var(--red)' },
  { id: 'a8', name: 'Churn Early-Warning', trigger: 'Health drops < 65', triggerSource: 'Dashboard', steps: 2, client: null, enabled: true, runCount: 8, lastRun: '5h ago', icon: 'shield', accent: 'var(--amber)' },
]

// ---- Toggle switch ----
function Toggle({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40, height: 23, borderRadius: 999, border: 'none', cursor: 'pointer',
        padding: 2, flexShrink: 0,
        background: on ? 'var(--lime)' : 'var(--bg-3)',
        transition: 'background .2s', position: 'relative',
      }}
    >
      <span
        style={{
          display: 'block', width: 19, height: 19, borderRadius: 999,
          background: on ? '#0a0a0a' : 'var(--text-3)',
          transform: on ? 'translateX(17px)' : 'translateX(0)',
          transition: 'transform .2s',
        }}
      />
    </button>
  )
}

// ---- Automation card ----
function AutoCard({ a, onToggle }: { a: AutomationSeed; onToggle: () => void }) {
  return (
    <div
      className="panel"
      style={{
        padding: 16, opacity: a.enabled ? 1 : 0.62,
        transition: 'opacity .2s, border-color .2s',
        borderColor: a.enabled ? 'var(--border)' : 'var(--border)',
      }}
    >
      <div className="row between" style={{ marginBottom: 12 }}>
        <span
          style={{
            width: 38, height: 38, borderRadius: 11,
            background: a.accent + '22', color: a.accent,
            border: `1px solid ${a.accent}44`,
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}
        >
          <Icon name={a.icon} size={16} />
        </span>
        <Toggle on={a.enabled} onClick={e => { e.stopPropagation(); onToggle() }} />
      </div>

      <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>{a.name}</span>

      <div className="row gap-2" style={{ margin: '10px 0 12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="chip" style={{ height: 22, background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          <Icon name="bolt" size={11} />
          {a.trigger}
        </span>
        <Icon name="arrowR" size={12} color="var(--text-3)" />
        <span className="chip" style={{ height: 22, background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          {a.steps} steps
        </span>
        {a.client && (
          <span className="chip chip-dim" style={{ height: 22 }}>
            {a.client}
          </span>
        )}
      </div>

      <div className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <span className="row gap-2" style={{ fontSize: 11, color: a.enabled ? 'var(--text-3)' : 'var(--text-3)' }}>
          {a.enabled ? (
            <>
              <span className="live-dot" />
              Last run {a.lastRun}
            </>
          ) : (
            <>
              <Icon name="pause" size={11} />
              Paused
            </>
          )}
        </span>
        <span className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {a.runCount.toLocaleString()} runs
        </span>
      </div>
    </div>
  )
}

type FilterType = 'All' | 'Active' | 'Client' | 'Internal'

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(SEED_AUTOMATIONS)
  const [filter, setFilter] = useState<FilterType>('All')
  const [showNewModal, setShowNewModal] = useState(false)

  const liveCount = automations.filter(a => a.enabled).length

  function toggleAuto(id: string) {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  const filtered = automations.filter(a => {
    if (filter === 'Active') return a.enabled
    if (filter === 'Client') return !!a.client
    if (filter === 'Internal') return !a.client
    return true
  })

  const filterOpts: FilterType[] = ['All', 'Active', 'Client', 'Internal']

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Automations' }]} />
      <div className="page-inner" style={{ maxWidth: 1080 }}>
        {/* header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="row gap-2 eyebrow" style={{ margin: 0 }}>
              <span className="live-dot" />
              {liveCount} live · mission control
            </div>
            <div className="h-display" style={{ fontSize: 38 }}>Automations</div>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Every trigger, every agent, one view.</span>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary" style={{ height: 40 }}>
            <Icon name="plus" size={14} />
            New automation
          </button>
        </div>

        {/* info banner */}
        <div
          className="panel"
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(120deg, #11140e, var(--bg-1) 60%)',
            borderColor: '#cfff3a2e',
            display: 'flex', gap: 12, alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--lime)', color: '#0a0a0a',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 18px #cfff3a44', flexShrink: 0,
            }}
          >
            <Icon name="bolt" size={16} />
          </span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '600 14px var(--font-sans)' }}>Automations run 24/7 across your portfolio</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              Each automation fires independently per client. Toggle any off at any time.
            </span>
          </div>
        </div>

        {/* filter */}
        <div className="row gap-2">
          {filterOpts.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="chip"
              style={{
                height: 30, cursor: 'pointer',
                background: filter === f ? 'var(--lime)' : 'var(--bg-2)',
                color: filter === f ? '#0a0a0a' : 'var(--text-2)',
                borderColor: filter === f ? 'var(--lime)' : 'var(--border)',
                fontWeight: filter === f ? 600 : 500,
              }}
            >
              {f}
              {f === 'Active' && (
                <span
                  style={{
                    marginLeft: 4,
                    background: filter === f ? '#0a0a0a22' : 'var(--bg-3)',
                    color: filter === f ? '#0a0a0a' : 'var(--text-3)',
                    borderRadius: 99, padding: '0 5px', fontSize: 10,
                  }}
                >
                  {automations.filter(a => a.enabled).length}
                </span>
              )}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
            {filtered.filter(a => a.enabled).length} of {filtered.length} on
          </span>
        </div>

        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(a => (
            <AutoCard key={a.id} a={a} onToggle={() => toggleAuto(a.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
              No automations match this filter.{' '}
              <button
                onClick={() => setShowNewModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
              >
                Build one →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New automation modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Automation builder" width={420}>
        <div
          style={{
            padding: 32, textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          }}
        >
          <span
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--lime)', color: '#0a0a0a',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 22px #cfff3a55',
            }}
          >
            <Icon name="bolt" size={24} />
          </span>
          <div>
            <div style={{ font: '600 16px var(--font-sans)', marginBottom: 6 }}>Automation builder</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>
              Coming soon — describe what you want to automate and Claude will build it for you.
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewModal(false)} style={{ height: 38, marginTop: 4 }}>
            <Icon name="sparkle" size={14} />
            Coming soon
          </button>
        </div>
      </Modal>
    </div>
  )
}
