'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/charts'
import type { Client } from '@/types'

// ---- Onboarding data ----

interface OnboardingTask {
  id: string
  title: string
  group: string
  owner: 'Admin' | 'Owner' | 'Auto'
  auto?: boolean
  connect?: string
}

interface OnboardingGroup {
  id: string
  label: string
  window: string
  color: string
}

interface ConnectInfo {
  id: string
  method: string
}

const GROUPS: OnboardingGroup[] = [
  { id: 'setup',    label: 'Setup',    window: 'Days 1–3',  color: '#8B7CFF' },
  { id: 'accounts', label: 'Accounts', window: 'Days 3–7',  color: '#5BCEFA' },
  { id: 'launch',   label: 'Launch',   window: 'Days 7–14', color: '#CFFF3A' },
]

const CHECKLIST: OnboardingTask[] = [
  // Setup
  { id: 'ob1', title: 'Sign onboarding agreement',  group: 'setup',    owner: 'Admin' },
  { id: 'ob2', title: 'Receive business assets',    group: 'setup',    owner: 'Owner' },
  { id: 'ob3', title: 'Create BizBoost workspace',  group: 'setup',    owner: 'Auto',  auto: true },
  // Accounts
  { id: 'ob4', title: 'Connect Google Business Profile', group: 'accounts', owner: 'Admin', connect: 'gbp' },
  { id: 'ob5', title: 'Connect Meta Business',           group: 'accounts', owner: 'Admin', connect: 'meta' },
  { id: 'ob6', title: 'Connect booking calendar',        group: 'accounts', owner: 'Owner', connect: 'cal' },
  { id: 'ob7', title: 'Set up WhatsApp Business',        group: 'accounts', owner: 'Admin', connect: 'wa' },
  // Launch
  { id: 'ob8',  title: 'Review and approve first ad creative', group: 'launch', owner: 'Owner' },
  { id: 'ob9',  title: 'Launch first Meta campaign',           group: 'launch', owner: 'Admin', auto: false },
  { id: 'ob10', title: 'First review request sent',            group: 'launch', owner: 'Auto',  auto: true },
  { id: 'ob11', title: 'Go-live check',                        group: 'launch', owner: 'Admin' },
]

const CONNECT_INFO: ConnectInfo[] = [
  { id: 'gbp',  method: 'via Google OAuth' },
  { id: 'meta', method: 'via Meta Business Manager' },
  { id: 'cal',  method: 'via Cal.com / Calendly' },
  { id: 'wa',   method: 'via WhatsApp Business API' },
]

interface Props {
  c: Client
  onComplete?: () => void
}

export function OnboardingTracker({ c, onComplete }: Props) {
  // Bootstrap done list from client data (use our new ob-prefixed IDs if fresh,
  // or fall back to an empty list)
  const [done, setDone] = useState<string[]>(() => {
    // Map legacy k-ids to ob-ids if needed (for existing seed data)
    const legacy: Record<string, string> = { k1: 'ob1', k2: 'ob2' }
    return (c.onboarding_done || []).map(id => legacy[id] || id)
  })

  const order = CHECKLIST.map(k => k.id)
  const firstOpen = order.find(id => !done.includes(id))

  type TaskStatus = 'done' | 'active' | 'locked'
  function statusOf(id: string): TaskStatus {
    if (done.includes(id)) return 'done'
    if (id === firstOpen) return 'active'
    return 'locked'
  }

  const pct = Math.round((done.length / CHECKLIST.length) * 100)
  const complete = done.length === CHECKLIST.length

  function finishTask(id: string) {
    if (statusOf(id) !== 'active') return
    setDone(prev => [...prev, id])
  }

  if (complete) {
    return (
      <div
        className="panel fadeup"
        style={{
          padding: 36,
          textAlign: 'center',
          borderColor: '#cfff3a3a',
          background: 'linear-gradient(135deg,#14180d,transparent 60%)',
        }}
      >
        <span style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--lime)', color: '#0a0a0a',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 16px',
          boxShadow: 'var(--shadow-lime)',
        }}>
          <Icon name="check" size={22} />
        </span>
        <div style={{ font: '600 24px var(--font-sans)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Onboarding <em style={{ fontStyle: 'italic' }}>complete.</em>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 auto 20px', maxWidth: 360, lineHeight: 1.6 }}>
          {c.name} is fully live — everything connected, built and launched.
          This tracker now drops off their dashboard.
        </p>
        {onComplete && (
          <button onClick={onComplete} className="btn btn-primary" style={{ height: 36, margin: '0 auto' }}>
            <Icon name="arrowR" size={14} />Go to live dashboard
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="col gap-4 fadeup">
      {/* Progress header */}
      <div className="panel" style={{ padding: 18 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row gap-3">
            <Ring pct={pct} size={48} stroke={5} color="var(--lime)">
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--lime)', fontVariantNumeric: 'tabular-nums' }}>
                {pct}%
              </span>
            </Ring>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ font: '600 15px var(--font-sans)' }}>Onboarding in progress</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {done.length} of {CHECKLIST.length} done · complete tasks in order to unlock the next
              </span>
            </div>
          </div>
          <span className="chip chip-amber">
            <Icon name="clock" size={12} />Day {c.onboarded || 0}
          </span>
        </div>

        {/* Group progress bars */}
        <div className="row gap-2">
          {GROUPS.map(g => {
            const items = CHECKLIST.filter(k => k.group === g.id)
            const gDone = items.filter(k => done.includes(k.id)).length
            const gpct = gDone / items.length * 100
            return (
              <div key={g.id} className="col gap-2" style={{ flex: 1 }}>
                <div className="prog">
                  <i style={{ width: gpct + '%', background: g.color }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{g.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grouped task lists */}
      {GROUPS.map(g => {
        const items = CHECKLIST.filter(k => k.group === g.id)
        return (
          <div key={g.id} className="panel" style={{ padding: 18 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <span className="row gap-2" style={{ font: '600 13px var(--font-sans)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                {g.label}
              </span>
              <span className="chip chip-dim">{g.window}</span>
            </div>
            <div className="col gap-2">
              {items.map(k => {
                const st = statusOf(k.id)
                const connInfo = k.connect ? CONNECT_INFO.find(x => x.id === k.connect) : null
                return (
                  <div
                    key={k.id}
                    className="row gap-3"
                    style={{
                      padding: '11px 13px',
                      borderRadius: 11,
                      background: st === 'active' ? '#cfff3a0c' : 'var(--bg-2)',
                      border: '1px solid ' + (st === 'active' ? '#cfff3a3a' : 'var(--border)'),
                      opacity: st === 'locked' ? 0.45 : 1,
                      transition: 'all .2s',
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => finishTask(k.id)}
                      disabled={st !== 'active'}
                      style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        cursor: st === 'active' ? 'pointer' : 'default',
                        border: '1.5px solid ' + (st === 'done' ? 'var(--lime)' : st === 'active' ? 'var(--lime)' : 'var(--border-strong)'),
                        background: st === 'done' ? 'var(--lime)' : 'transparent',
                        display: 'grid', placeItems: 'center',
                        color: '#0a0a0a',
                      }}
                    >
                      {st === 'done' && <Icon name="check" size={11} />}
                      {st === 'locked' && <Icon name="shield" size={10} color="var(--text-3)" />}
                    </button>

                    {/* Label + sub */}
                    <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 13,
                        color: st === 'done' ? 'var(--text-2)' : 'var(--text)',
                        textDecoration: st === 'done' ? 'line-through' : 'none',
                      }}>
                        {k.title}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                        {k.owner === 'Auto' ? 'Automated' : k.owner}
                        {connInfo ? ' · ' + connInfo.method : ''}
                      </span>
                    </div>

                    {/* Auto chip */}
                    {k.auto && (
                      <span className="chip chip-dim" style={{ fontSize: 9.5 }}>auto</span>
                    )}

                    {/* Active CTA */}
                    {st === 'active' && (
                      <button onClick={() => finishTask(k.id)} className="btn btn-primary" style={{ height: 28, fontSize: 12 }}>
                        {connInfo
                          ? <><Icon name="link" size={12} />Connect</>
                          : <><Icon name="check" size={12} />Mark done</>
                        }
                      </button>
                    )}

                    {/* Done chip */}
                    {st === 'done' && (
                      <span className="chip chip-lime" style={{ fontSize: 9.5 }}>done</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OnboardingTracker
