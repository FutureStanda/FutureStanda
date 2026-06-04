'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import AutomationCanvas, { type Automation, type CanvasNode, type CanvasEdge } from '@/components/overlays/AutomationCanvas'
import { CLIENTS } from '@/lib/data'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChainStep {
  icon: string
  name: string
  desc: string
  agent?: string
  status?: 'active' | 'idle'
  hook?: string | null
  template?: string
}

interface Chain extends Automation {
  action: string
  ok: boolean
  runs: number
  client: string | null
  accent: string
  steps: number
  created?: boolean
  detailSteps?: ChainStep[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MASTER_DATA = {
  id: 'paid-master',
  name: 'New Client Ignition',
  trigger: { label: 'Status → "Paid"', icon: 'euro', sub: 'Fires the moment a deal closes' },
  runsToday: 1,
  lastRun: 'today · 11:42',
  steps: [
    { id: 'm1', icon: 'command', name: 'Command centre spawns', desc: 'Seeded with the client BUILD SPEC captured on the call', status: 'active' as const, agent: 'Provisioner' },
    { id: 'm2', icon: 'calendar', name: 'Meeting → Onboarding Call', desc: 'Booked meeting converts, reminders scheduled (Telegram + email)', status: 'active' as const, agent: 'Scheduler' },
    { id: 'm3', icon: 'sparkle', name: 'Research agent starts', desc: 'Competitor audit · market demand · opportunity gap', status: 'active' as const, agent: 'Research' },
    { id: 'm4', icon: 'checkSquare', name: 'Build queue populates', desc: 'Tonight / 24h / day-7 tasks generated and assigned', status: 'active' as const, agent: 'Planner' },
    { id: 'm5', icon: 'pulse', name: 'Tempo sequence begins', desc: 'V1 video · dashboard login · timed client touches', status: 'active' as const, agent: 'Tempo' },
    { id: 'm6', icon: 'msg', name: 'Asset intake opens', desc: 'WhatsApp request: logos, job photos, reviews', status: 'idle' as const, agent: 'Intake' },
  ],
}

const OPTIMISER_MOCK_RECS = [
  { id: 'r1', icon: 'euro', title: 'MRR objective advanced', detail: "O'Sullivan moved to Paid (+€998/mo). Pushed 'Grow MRR to €15k' from 38% → 47% and re-baselined the KR.", impact: '+9%', tone: 'win' as const, apply: true },
  { id: 'r2', icon: 'checkSquare', title: "Re-prioritised today's queue", detail: 'Greenway at-risk: surfaced retention call to the top, deferred 2 low-impact content tasks.', impact: '3 tasks', tone: 'info' as const, apply: false },
  { id: 'r3', icon: 'trend', title: 'Budget re-paced', detail: 'Kelly Detailing ROAS climbing — flagged room to scale spend +15% to hit the leads KR faster.', impact: '+15%', tone: 'win' as const, apply: true },
  { id: 'r4', icon: 'target', title: 'Objective at risk', detail: '"Every client live in 14d" slipping — Boyne build is day 6 of 7. Nudged build queue.', impact: 'watch', tone: 'warn' as const, apply: false },
]

const SEED_CHAINS: Chain[] = [
  { id: 'lead-pipeline', name: 'Lead Capture', trigger: 'Lead created', triggerSource: 'Meta / web form', action: 'Add to pipeline + notify', icon: 'inbox', accent: '#4FE3C1', enabled: true, lastRun: '4m ago', runCount: 312, runs: 312, ok: true, client: null, steps: 4,
    detailSteps: [
      { icon: 'inbox', name: 'Lead lands', desc: 'From ad form, website, WhatsApp or missed-call' },
      { icon: 'sparkle', name: 'AI enriches & scores', desc: 'Pulls business info, scores intent 0–100' },
      { icon: 'layers', name: 'Added to pipeline', desc: 'Slotted into the right stage by score' },
      { icon: 'bell', name: "You're notified", desc: 'Telegram ping if score > 70' },
    ]
  },
  { id: 'missed-call', name: 'Never Miss a Lead', trigger: 'Missed call', triggerSource: 'Phone system', action: '30-sec text-back + qualify', icon: 'phoneMissed', accent: 'var(--amber)', enabled: true, lastRun: '1h ago', runCount: 87, runs: 87, ok: true, client: null, steps: 4,
    detailSteps: [
      { icon: 'phoneMissed', name: 'Call missed', desc: 'Detected within seconds' },
      { icon: 'msg', name: 'Instant text-back', desc: '"Sorry we missed you…" sent in 30s' },
      { icon: 'sparkle', name: 'AI qualifies', desc: 'Asks 2 quick questions, captures intent' },
      { icon: 'calendar', name: 'Books the job', desc: 'Drops a booking link, confirms slot' },
    ]
  },
  { id: 'review-engine', name: 'Reputation Engine', trigger: 'New 5★ review', triggerSource: 'Google Business', action: 'Harvest + post to socials', icon: 'star', accent: 'var(--lime)', enabled: true, lastRun: '26m ago', runCount: 204, runs: 204, ok: true, client: null, steps: 3,
    detailSteps: [
      { icon: 'star', name: 'Review posted', desc: 'New 5★ on Google detected' },
      { icon: 'sparkle', name: 'AI reshapes it', desc: 'Turns it into a branded social graphic + caption' },
      { icon: 'megaphone', name: 'Posts everywhere', desc: 'IG, FB, GBP — on brand, on schedule' },
    ]
  },
  { id: 'booking-confirm', name: 'Booking Confirmed', trigger: 'Slot booked', triggerSource: 'Calendly', action: 'Confirm + add to calendar', icon: 'calendar', accent: 'var(--blue)', enabled: true, lastRun: '12m ago', runCount: 146, runs: 146, ok: true, client: null, steps: 2 },
  { id: 'weekly-report', name: 'Weekly Client Report', trigger: 'Every Mon 08:00', triggerSource: 'Schedule', action: 'Generate + send report', icon: 'trend', accent: 'var(--violet)', enabled: true, lastRun: '2d ago', runCount: 36, runs: 36, ok: true, client: null, steps: 3 },
  { id: 'stale-lead', name: 'Stale Lead Rescue', trigger: 'No reply in 48h', triggerSource: 'CRM', action: 'Re-engage sequence', icon: 'flame', accent: 'var(--red)', enabled: false, lastRun: '—', runCount: 19, runs: 19, ok: true, client: null, steps: 3 },
  { id: 'churn-watch', name: 'Churn Early-Warning', trigger: 'Health drops < 65', triggerSource: 'Dashboard', action: 'Alert + book save call', icon: 'shield', accent: 'var(--amber)', enabled: true, lastRun: '5h ago', runCount: 8, runs: 8, ok: true, client: null, steps: 2 },
  { id: 'content-batch', name: 'Content Autopilot', trigger: 'Every Thu 10:00', triggerSource: 'Schedule', action: 'Draft + schedule 4 posts', icon: 'megaphone', accent: '#4FE3C1', enabled: true, lastRun: 'yesterday', runCount: 52, runs: 52, ok: true, client: null, steps: 2 },
]

const SUGGESTION_CHIPS = [
  'Text-back missed calls in 30s',
  'Weekly report for every client',
  'Alert me when health drops',
  'Post 5★ reviews to social',
  'Book leads automatically',
  'Re-engage stale pipeline',
]

// ─── Toggle ───────────────────────────────────────────────────────────────────

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
      <span style={{
        display: 'block', width: 19, height: 19, borderRadius: 999,
        background: on ? '#0a0a0a' : 'var(--mute, #6a6e6a)',
        transform: on ? 'translateX(17px)' : 'translateX(0)',
        transition: 'transform .2s',
      }} />
    </button>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: 'active' | 'idle' }) {
  const active = status === 'active'
  return (
    <span className="chip" style={{
      height: 18, fontSize: 9, padding: '0 7px',
      background: active ? '#cfff3a18' : 'var(--bg-3)',
      borderColor: active ? '#cfff3a44' : 'var(--border)',
      color: active ? 'var(--lime)' : 'var(--text-3)',
    }}>
      {active && <span className="live-dot" style={{ width: 5, height: 5 }} />}
      {active ? 'Active' : 'Idle'}
    </span>
  )
}

// ─── FlowConnector ────────────────────────────────────────────────────────────

function FlowConnector({ index }: { index: number }) {
  return (
    <div className="col" style={{ justifyContent: 'center', alignItems: 'center', flexShrink: 0, width: 30, paddingTop: 20 }}>
      <div style={{ position: 'relative', width: '100%', height: 2, background: 'linear-gradient(90deg, var(--border), var(--border-strong))', borderRadius: 2 }}>
        <span style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)',
          animation: `pulse 2s ${index * 0.4}s infinite`,
          boxShadow: '0 0 6px var(--lime)',
        }} />
      </div>
      <Icon name="chevR" size={12} color="var(--text-3)" />
    </div>
  )
}

// ─── MasterChain ─────────────────────────────────────────────────────────────

function MasterChain() {
  const master = MASTER_DATA
  return (
    <div className="panel fadeup" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-strong)', background: 'linear-gradient(135deg, #11140e 0%, var(--bg-1) 55%)' }}>
      {/* header strip */}
      <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
        <div className="row gap-3">
          <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: 'var(--lime-glow)', flexShrink: 0 }}>
            <Icon name="bolt" size={18} />
          </span>
          <div className="col" style={{ gap: 2 }}>
            <div className="row gap-2">
              <span style={{ font: '600 16px var(--font-sans)' }}>{master.name}</span>
              <span className="chip chip-lime" style={{ height: 20 }}>
                <span className="live-dot" />Active
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              The core chain — fires end-to-end the moment a client pays. {master.runsToday} run today · {master.lastRun}
            </span>
          </div>
        </div>
        <span className="chip chip-dim" style={{ flexShrink: 0 }}>Master</span>
      </div>

      {/* flow */}
      <div style={{ padding: '26px 22px', overflowX: 'auto' }}>
        <div className="row" style={{ gap: 0, alignItems: 'stretch', minWidth: 'min-content' }}>
          {/* trigger node */}
          <div className="col" style={{ alignItems: 'center', gap: 8, flexShrink: 0, width: 150 }}>
            <span className="eyebrow" style={{ margin: 0, color: 'var(--lime)' }}>Trigger</span>
            <div className="col" style={{ alignItems: 'center', gap: 9, padding: '16px 12px', borderRadius: 14, background: '#cfff3a14', border: '1px solid #cfff3a44', width: '100%' }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>
                <Icon name={master.trigger.icon} size={18} />
              </span>
              <span style={{ font: '600 13px var(--font-sans)', textAlign: 'center', color: '#fff' }}>{master.trigger.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.35 }}>{master.trigger.sub}</span>
            </div>
          </div>

          {/* steps */}
          {master.steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <FlowConnector index={i} />
              <div className="col" style={{ alignItems: 'center', gap: 8, flexShrink: 0, width: 158 }}>
                <span className="eyebrow" style={{ margin: 0, color: 'var(--text-3)' }}>Step {i + 1}</span>
                <div className="col" style={{ gap: 9, padding: '16px 13px', borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', width: '100%', flex: 1 }}>
                  <div className="row between" style={{ width: '100%' }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-3)', color: 'var(--lime)', display: 'grid', placeItems: 'center', border: '1px solid var(--border-strong)' }}>
                      <Icon name={s.icon} size={15} />
                    </span>
                    <StatusPill status={s.status} />
                  </div>
                  <span style={{ font: '600 12.5px var(--font-sans)', lineHeight: 1.25, color: '#fff' }}>{s.name}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.4, flex: 1 }}>{s.desc}</span>
                  <span className="chip chip-dim" style={{ height: 18, fontSize: 9.5, alignSelf: 'flex-start' }}>
                    <Icon name="sparkle" size={9} />{s.agent}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── OptStat ─────────────────────────────────────────────────────────────────

function OptStat({ label, value, sub, accent, last }: { label: string; value: string | number; sub: string; accent: string; last?: boolean }) {
  return (
    <div className="col gap-1" style={{ padding: '14px 22px', flex: 1, minWidth: 140, borderRight: last ? 'none' : '1px solid var(--border)' }}>
      <span className="eyebrow" style={{ margin: 0 }}>{label}</span>
      <span className="num" style={{ font: '700 24px var(--font-sans)', color: accent, letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{sub}</span>
    </div>
  )
}

// ─── Optimiser ───────────────────────────────────────────────────────────────

function Optimiser({ cadence, setCadence }: { cadence: string; setCadence: (v: string) => void }) {
  const cadences: Array<[string, string]> = [['realtime', 'Real-time'], ['hourly', 'Hourly'], ['daily', 'Daily']]
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'ready'>('idle')
  const [recs, setRecs] = useState<typeof OPTIMISER_MOCK_RECS>([])
  const [applied, setApplied] = useState<Record<string, boolean>>({})
  const [lastRun, setLastRun] = useState<boolean>(false)

  const toneMap: Record<string, [string, string, string]> = {
    win:  ['var(--lime)',   '#cfff3a14', '#cfff3a3a'],
    info: ['var(--blue)',   '#5bcefa12', '#5bcefa33'],
    warn: ['var(--amber)',  '#ffb54712', '#ffb54733'],
  }

  function run() {
    setPhase('scanning')
    setTimeout(() => {
      setRecs(OPTIMISER_MOCK_RECS)
      setPhase('ready')
      setLastRun(true)
    }, 1100)
  }

  function applyRec(id: string) {
    setApplied(a => ({ ...a, [id]: true }))
  }

  function applyAll() {
    const n: Record<string, boolean> = {}
    recs.forEach(r => { if (r.apply) n[r.id] = true })
    setApplied(a => ({ ...a, ...n }))
  }

  const actionable = recs.filter(r => r.apply && !applied[r.id])

  return (
    <div className="panel fadeup" style={{ padding: 0, overflow: 'hidden', borderColor: '#8b7cff3a', background: 'linear-gradient(135deg, #13111d 0%, var(--bg-1) 55%)' }}>
      {/* header */}
      <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 14 }}>
        <div className="row gap-3">
          <span style={{ width: 42, height: 42, borderRadius: 13, background: '#8B7CFF', color: '#0a0a0a', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 0 22px #8b7cff55' }}>
            <Icon name="sparkle" size={18} />
          </span>
          <div className="col" style={{ gap: 3 }}>
            <div className="row gap-2">
              <span style={{ font: '600 17px var(--font-sans)' }}>Performance Optimiser</span>
              <span className="chip chip-violet" style={{ height: 20 }}>
                <span className="live-dot" style={{ background: '#8B7CFF' }} />Live
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', maxWidth: 440, lineHeight: 1.45 }}>
              Reads your live objectives, tasks and accounts — then re-prioritises to drive every goal forward.
            </span>
          </div>
        </div>
        <button
          onClick={run}
          disabled={phase === 'scanning'}
          className="btn"
          style={{ height: 38, background: '#8B7CFF', color: '#0a0a0a', border: 'none', fontWeight: 600, opacity: phase === 'scanning' ? 0.7 : 1 }}
        >
          {phase === 'scanning'
            ? <><span className="live-dot" style={{ background: '#0a0a0a' }} />Scanning…</>
            : <><Icon name="refresh" size={14} />Run optimiser</>}
        </button>
      </div>

      {/* snapshot stats */}
      <div className="row" style={{ borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <OptStat label="Avg objective" value="72%" sub="3 tracked" accent="#8B7CFF" />
        <OptStat label="Done today" value={4} sub="tasks shipped" accent="var(--lime)" />
        <OptStat label="Urgent open" value={2} sub="P0 in queue" accent="var(--amber)" />
        <OptStat label="Last sweep" value={lastRun ? 'just now' : '—'} sub={cadence === 'realtime' ? '+ on every change' : cadence === 'hourly' ? '+ hourly' : '+ daily 09:00'} accent="var(--blue)" last />
      </div>

      {/* body */}
      <div className="col gap-3" style={{ padding: '18px 22px' }}>
        <div className="row between">
          <span className="eyebrow" style={{ margin: 0 }}>
            {phase === 'ready' ? `${recs.length} recommendations` : 'Recommendations'}
          </span>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            {actionable.length > 1 && (
              <button onClick={applyAll} style={{ border: 'none', cursor: 'pointer', color: '#8B7CFF', font: '600 11.5px var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5, background: 'none' }}>
                <Icon name="bolt" size={13} />Apply all ({actionable.length})
              </button>
            )}
            {/* cadence switcher */}
            <div className="row" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 999, padding: 3, gap: 2 }}>
              {cadences.map(([v, l]) => (
                <button key={v} onClick={() => setCadence(v)} style={{
                  height: 24, padding: '0 11px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: cadence === v ? '#8B7CFF' : 'transparent',
                  color: cadence === v ? '#0a0a0a' : 'var(--text-3)',
                  font: `${cadence === v ? 600 : 500} 11px var(--font-sans)`,
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {phase === 'idle' && (
          <div className="col gap-2" style={{ alignItems: 'center', textAlign: 'center', padding: '26px 0' }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', color: '#8B7CFF', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={18} />
            </span>
            <span style={{ font: '600 14px var(--font-sans)' }}>Ready to optimise</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', maxWidth: 320, lineHeight: 1.5 }}>
              Run a sweep and I'll scan every objective, key result and task — then hand you the highest-leverage moves.
            </span>
            <button onClick={run} className="btn" style={{ height: 34, marginTop: 4, background: '#8B7CFF', color: '#0a0a0a', border: 'none', fontWeight: 600 }}>
              <Icon name="refresh" size={14} />Run optimiser
            </button>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="col gap-2" style={{ padding: '8px 0' }}>
            {['Reading objectives & key results', 'Cross-checking today\'s tasks', 'Scoring account health & ROAS', 'Ranking the highest-leverage moves'].map((t, i) => (
              <div key={i} className="row gap-3" style={{ padding: '9px 0', fontSize: 12.5, color: 'var(--text-2)', animation: `fadeup 0.4s ${i * 0.18}s both` }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--border)', color: '#8B7CFF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="sparkle" size={11} />
                </span>
                {t}
                <span className="live-dot" style={{ background: '#8B7CFF', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        )}

        {phase === 'ready' && recs.length === 0 && (
          <div className="col gap-2" style={{ alignItems: 'center', textAlign: 'center', padding: '24px 0' }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: '#cfff3a14', border: '1px solid #cfff3a3a', color: 'var(--lime)', display: 'grid', placeItems: 'center' }}>
              <Icon name="check" size={18} />
            </span>
            <span style={{ font: '600 14px var(--font-sans)' }}>Everything&apos;s on track</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>No high-leverage moves right now — your goals are pacing well.</span>
          </div>
        )}

        {phase === 'ready' && recs.map(r => {
          const [col, bg, bd] = toneMap[r.tone] || toneMap.info
          const isApplied = applied[r.id]
          return (
            <div key={r.id} className="row gap-3" style={{ padding: '12px 14px', borderRadius: 12, background: bg, border: '1px solid ' + bd }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg-1)', border: '1px solid ' + bd, color: col, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={r.icon} size={14} />
              </span>
              <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ gap: 10 }}>
                  <span style={{ font: '600 13px var(--font-sans)', color: '#fff' }}>{r.title}</span>
                  <span className="chip" style={{ height: 18, fontSize: 9.5, background: 'transparent', borderColor: col + '66', color: col, flexShrink: 0 }}>{r.impact}</span>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{r.detail}</span>
                {r.apply && (
                  <div className="row" style={{ marginTop: 5 }}>
                    {isApplied
                      ? <span className="chip chip-lime" style={{ height: 22 }}><Icon name="check" size={12} />Applied</span>
                      : <button onClick={() => applyRec(r.id)} className="btn" style={{ height: 26, background: col, color: '#0a0a0a', border: 'none', fontWeight: 600, fontSize: 11.5 }}>
                          <Icon name="bolt" size={12} />Apply
                        </button>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ChainCard ───────────────────────────────────────────────────────────────

function ChainCard({ c, onToggle, onOpen }: { c: Chain; onToggle: () => void; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="panel"
      style={{ padding: 16, cursor: 'pointer', opacity: c.enabled ? 1 : 0.62, transition: 'opacity .2s, border-color .2s, transform .15s' }}
    >
      <div className="row between" style={{ marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: c.accent + '1f', color: c.accent, border: `1px solid ${c.accent}44`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={c.icon} size={15} />
        </span>
        <Toggle on={c.enabled} onClick={e => { e.stopPropagation(); onToggle() }} />
      </div>

      <span style={{ font: '600 14px var(--font-sans)', color: '#fff' }}>{c.name}</span>

      <div className="row gap-2" style={{ margin: '10px 0 12px', flexWrap: 'wrap' }}>
        <span className="chip" style={{ height: 22, background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          <Icon name="bolt" size={11} />{c.trigger}
        </span>
        <Icon name="arrowR" size={12} color="var(--text-3)" />
        <span className="chip" style={{ height: 22, background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          {c.action}
        </span>
      </div>

      <div className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <span className="row gap-2" style={{ fontSize: 11, color: c.enabled ? 'var(--text-3)' : 'var(--text-3)' }}>
          {c.enabled
            ? <><span className="live-dot" style={{ background: c.ok ? 'var(--lime)' : 'var(--red)' }} />Last run {c.lastRun}</>
            : <><Icon name="pause" size={11} />Paused</>}
        </span>
        <span className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.runs.toLocaleString()} runs</span>
      </div>
    </div>
  )
}

// ─── ChainDetail Drawer ───────────────────────────────────────────────────────

const HOOKS = [
  { id: 'meta',   name: 'Meta / Facebook', icon: 'megaphone',  color: '#4A90E2' },
  { id: 'google', name: 'Google',          icon: 'trend',      color: '#34A853' },
  { id: 'gbp',    name: 'Google Business', icon: 'star',       color: '#FFB547' },
  { id: 'wa',     name: 'WhatsApp',        icon: 'msg',        color: '#25D366' },
  { id: 'stripe', name: 'Stripe',          icon: 'euro',       color: '#8B7CFF' },
  { id: 'cal',    name: 'Calendar',        icon: 'calendar',   color: '#5BCEFA' },
  { id: 'ai',     name: 'AI Agent',        icon: 'sparkle',    color: '#CFFF3A' },
  { id: 'sms',    name: 'SMS / Phone',     icon: 'phoneMissed', color: '#FF7A8A' },
]

function ChainDetail({
  c,
  onClose,
  onToggle,
  onDelete,
  onBuild,
}: {
  c: Chain
  onClose: () => void
  onToggle: () => void
  onDelete: () => void
  onBuild: () => void
}) {
  const seedSteps: ChainStep[] = c.detailSteps ?? [
    { icon: 'bolt',    name: c.trigger, desc: 'Trigger condition met' },
    { icon: 'sparkle', name: 'AI processes', desc: 'Agent evaluates and acts' },
    { icon: c.icon,    name: c.action,  desc: 'Action fires automatically' },
  ]

  const [steps, setSteps] = useState<ChainStep[]>(seedSteps)
  const [cfgStep, setCfgStep] = useState<number | null>(null)

  function hookStep(i: number, hook: string | null) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, hook } : s))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: '#04050577', backdropFilter: 'blur(3px)' }} />
      <div
        className="col"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 480, maxWidth: '94vw',
          background: 'var(--bg-1)', borderLeft: '1px solid var(--border-strong)',
          boxShadow: '-20px 0 60px #0009',
          animation: 'adr-slide-in 0.25s ease both',
        }}
      >
        {/* header */}
        <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: c.accent + '1f', color: c.accent, border: `1px solid ${c.accent}44`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={c.icon} size={15} />
            </span>
            <div className="col" style={{ gap: 1, minWidth: 0 }}>
              <div className="row gap-2">
                <span style={{ font: '600 15px var(--font-sans)' }}>{c.name}</span>
                {c.created && <span className="chip chip-lime" style={{ height: 18, fontSize: 9 }}>Created by you</span>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{(c.runs || 0).toLocaleString()} total runs · last {c.lastRun}</span>
            </div>
          </div>
          <div className="row gap-2" style={{ flexShrink: 0 }}>
            <button onClick={onBuild} className="btn" style={{ height: 30 }}>
              <Icon name="layers" size={12} />Open in builder →
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        {/* scrollable body */}
        <div className="col gap-4" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* on/off toggle */}
          <div className="row between panel" style={{ padding: '12px 14px' }}>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ font: '600 13px var(--font-sans)' }}>{c.enabled ? 'Automation is on' : 'Automation is paused'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.enabled ? 'Running automatically' : 'No actions will fire'}</span>
            </div>
            <Toggle on={c.enabled} onClick={onToggle} />
          </div>

          {/* trigger chip */}
          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>Trigger</span>
            <div className="row gap-3" style={{ padding: '12px 13px', borderRadius: 12, background: '#cfff3a0e', border: '1px solid #cfff3a3a' }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="bolt" size={14} />
              </span>
              <div className="col" style={{ gap: 2 }}>
                <span className="eyebrow" style={{ margin: 0, color: 'var(--lime)' }}>When</span>
                <span style={{ font: '600 13px var(--font-sans)' }}>{c.trigger}</span>
              </div>
            </div>
          </div>

          {/* step list */}
          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>The chain</span>
            <div className="col" style={{ position: 'relative' }}>
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div
                    className="row gap-3"
                    style={{ padding: '12px 13px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', alignItems: 'center' }}
                  >
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg-3)', color: c.accent, border: '1px solid var(--border-strong)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={s.icon} size={14} />
                    </span>
                    <div onClick={() => setCfgStep(cfgStep === i ? null : i)} className="col" style={{ gap: 2, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                      <span style={{ font: '600 13px var(--font-sans)', color: '#fff' }}>{s.name}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{s.desc}</span>
                      {s.hook && (
                        <span className="chip" style={{ height: 18, fontSize: 9.5, marginTop: 3, width: 'fit-content', background: (HOOKS.find(h => h.id === s.hook)?.color ?? '#fff') + '1f', borderColor: (HOOKS.find(h => h.id === s.hook)?.color ?? '#fff') + '55', color: HOOKS.find(h => h.id === s.hook)?.color ?? '#fff' }}>
                          <Icon name="link" size={9} />Hooked to {HOOKS.find(h => h.id === s.hook)?.name}
                        </span>
                      )}
                    </div>
                    <span style={{ flexShrink: 0, color: s.hook ? 'var(--lime)' : 'var(--text-3)', display: 'grid', placeItems: 'center', width: 26 }}>
                      <Icon name={s.hook ? 'check' : 'chevR'} size={13} />
                    </span>
                  </div>
                  {/* hook config expand */}
                  {cfgStep === i && (
                    <div className="panel" style={{ margin: '6px 0 6px 28px', padding: 14, background: 'var(--bg)', borderColor: 'var(--border-strong)' }}>
                      <span className="eyebrow" style={{ margin: '0 0 9px', display: 'block' }}>Hook this step up</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 9 }}>Pick the account or agent that powers it.</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7, marginBottom: 11 }}>
                        {HOOKS.map(h => {
                          const on = s.hook === h.id
                          return (
                            <button key={h.id} onClick={() => hookStep(i, on ? null : h.id)} className="row gap-2" style={{ padding: '8px 10px', borderRadius: 9, cursor: 'pointer', textAlign: 'left', background: on ? h.color + '1f' : 'var(--bg-2)', border: '1px solid ' + (on ? h.color : 'var(--border)') }}>
                              <span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', background: on ? h.color : 'var(--bg-3)', color: on ? '#0a0a0a' : h.color, flexShrink: 0 }}>
                                <Icon name={h.icon} size={11} />
                              </span>
                              <span style={{ font: '600 11.5px var(--font-sans)', color: on ? '#fff' : 'var(--text-2)' }}>{h.name}</span>
                              {on && <span style={{ marginLeft: 'auto', color: h.color }}><Icon name="check" size={11} /></span>}
                            </button>
                          )
                        })}
                      </div>
                      <div className="row between" style={{ marginTop: 10 }}>
                        <span className="row gap-2" style={{ fontSize: 10.5, color: s.hook ? 'var(--lime)' : 'var(--text-3)' }}>
                          <Icon name={s.hook ? 'check' : 'link'} size={11} />
                          {s.hook ? 'Connected & live' : 'Not hooked up yet'}
                        </span>
                        <button onClick={() => setCfgStep(null)} className="btn" style={{ height: 28, fontSize: 11.5 }}>Done</button>
                      </div>
                    </div>
                  )}
                  {i < steps.length - 1 && <div style={{ width: 2, height: 16, background: 'var(--border-strong)', marginLeft: 28 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="row between" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <button onClick={onDelete} className="btn-ghost" style={{ border: 'none', cursor: 'pointer', color: 'var(--red)', font: '500 12.5px var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="trash" size={13} />Delete
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ height: 32 }}>Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── BuildWithClaude modal ────────────────────────────────────────────────────

function BuildWithClaude({
  scope,
  scopeClientName,
  onClose,
  onBuilt,
  onManual,
}: {
  scope: string
  scopeClientName: string | null
  onClose: () => void
  onBuilt: (c: Chain) => void
  onManual: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  function submit() {
    if (!prompt.trim()) return
    setGenerating(true)
    setTimeout(() => {
      const newChain: Chain = {
        id: 'gen-' + Date.now().toString(36),
        name: prompt.trim().slice(0, 40),
        trigger: 'New lead',
        triggerSource: 'AI generated',
        action: 'Run AI agent',
        icon: 'sparkle',
        accent: 'var(--lime)',
        enabled: true,
        lastRun: 'Never',
        runCount: 0,
        runs: 0,
        ok: true,
        client: scope === 'agency' ? null : scope,
        steps: 3,
        created: true,
      }
      setGenerating(false)
      onBuilt(newChain)
    }, 1200)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: '#04050588', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 580, maxHeight: '88vh', background: 'var(--bg-1)', border: '1px solid var(--border-strong)', borderRadius: 18, boxShadow: '0 30px 90px #000c', overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-3">
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={15} />
            </span>
            <span style={{ font: '600 15px var(--font-sans)' }}>Build with Claude</span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="col gap-4" style={{ padding: 22 }}>
          {scopeClientName && (
            <div className="panel" style={{ padding: '10px 14px', background: 'var(--bg-2)', borderColor: 'var(--border-strong)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                <Icon name="layers" size={11} /> Building for <strong style={{ color: '#fff' }}>{scopeClientName}</strong> only
              </span>
            </div>
          )}

          <div className="col gap-2">
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Describe what you want to automate</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. When a new review comes in on Google, reshare it to Instagram and notify me on Telegram..."
              rows={4}
              autoFocus
              style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 14px var(--font-sans)', padding: '11px 13px', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div className="col gap-2">
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Suggestions</span>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {SUGGESTION_CHIPS.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="chip"
                  style={{ height: 26, cursor: 'pointer', background: prompt === s ? '#cfff3a14' : 'var(--bg-2)', borderColor: prompt === s ? 'var(--lime)' : 'var(--border)', color: prompt === s ? 'var(--lime)' : 'var(--text-2)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="row between" style={{ padding: '13px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <button onClick={onManual} className="btn" style={{ height: 34 }}>
            <Icon name="edit" size={13} />Manual
          </button>
          <button
            onClick={submit}
            disabled={!prompt.trim() || generating}
            className="btn btn-primary"
            style={{ height: 34, opacity: (!prompt.trim() || generating) ? 0.5 : 1, cursor: (!prompt.trim() || generating) ? 'not-allowed' : 'pointer' }}
          >
            {generating
              ? <><span className="live-dot" style={{ background: '#0a0a0a' }} />Generating…</>
              : <><Icon name="bolt" size={13} />Build automation</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── NewAutomation modal (manual) ─────────────────────────────────────────────

const TRIGGER_OPTS = [
  { id: 'status',   label: 'Status changes',   icon: 'euro',        ex: '→ Paid, Onboarding, Live' },
  { id: 'lead',     label: 'Lead created',      icon: 'inbox',       ex: 'from any source' },
  { id: 'missed',   label: 'Missed call',       icon: 'phoneMissed', ex: 'on a client line' },
  { id: 'review',   label: 'New review',        icon: 'star',        ex: 'Google / Facebook' },
  { id: 'schedule', label: 'On a schedule',     icon: 'clock',       ex: 'hourly / daily / weekly' },
  { id: 'metric',   label: 'Metric threshold',  icon: 'trend',       ex: 'health, ROAS, MRR…' },
]

const ACTION_OPTS = [
  { id: 'agent',    label: 'Run an AI agent',       icon: 'sparkle',     short: 'Run AI agent' },
  { id: 'task',     label: 'Create tasks',           icon: 'checkSquare', short: 'Create tasks' },
  { id: 'msg',      label: 'Send a message',         icon: 'msg',         short: 'Send message' },
  { id: 'notify',   label: 'Notify me',              icon: 'bell',        short: 'Notify you' },
  { id: 'post',     label: 'Post content',           icon: 'megaphone',   short: 'Post content' },
  { id: 'optimise', label: 'Optimise objectives',    icon: 'target',      short: 'Optimise objectives' },
]

function NewAutomation({ scope, onClose, onCreated }: { scope: string; onClose: () => void; onCreated: (c: Chain) => void }) {
  const [trig, setTrig] = useState<string | null>(null)
  const [acts, setActs] = useState<string[]>([])
  const [name, setName] = useState('')
  const ready = trig && acts.length && name.trim()

  function build() {
    if (!ready) return
    const t = TRIGGER_OPTS.find(x => x.id === trig)!
    const first = ACTION_OPTS.find(a => a.id === acts[0])!
    const created: Chain = {
      id: 'manual-' + Date.now().toString(36),
      name: name.trim(),
      trigger: t.label,
      triggerSource: 'Manual',
      action: acts.length > 1 ? first.short + ' +' + (acts.length - 1) : first.short,
      icon: t.icon,
      accent: 'var(--lime)',
      enabled: true,
      lastRun: 'Never',
      runCount: 0,
      runs: 0,
      ok: true,
      client: scope === 'agency' ? null : scope,
      steps: acts.length,
      created: true,
    }
    onCreated(created)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: '#04050588', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 620, maxHeight: '88vh', background: 'var(--bg-1)', border: '1px solid var(--border-strong)', borderRadius: 18, boxShadow: '0 30px 90px #000c', overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-3">
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>
              <Icon name="bolt" size={14} />
            </span>
            <span style={{ font: '600 15px var(--font-sans)' }}>New automation</span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="col gap-4" style={{ padding: 22, overflowY: 'auto' }}>
          <div className="col gap-2">
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. VIP lead fast-track"
              autoFocus
              style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 14px var(--font-sans)', padding: '11px 13px', outline: 'none' }}
            />
          </div>

          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0, color: 'var(--lime)' }}>When this happens</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TRIGGER_OPTS.map(t => (
                <button key={t.id} onClick={() => setTrig(t.id)} className="row gap-3" style={{ padding: '11px 12px', borderRadius: 11, cursor: 'pointer', textAlign: 'left', background: trig === t.id ? '#cfff3a12' : 'var(--bg-2)', border: '1px solid ' + (trig === t.id ? 'var(--lime)' : 'var(--border)') }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: trig === t.id ? 'var(--lime)' : 'var(--bg-3)', color: trig === t.id ? '#0a0a0a' : 'var(--lime)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={t.icon} size={14} />
                  </span>
                  <div className="col" style={{ gap: 1, minWidth: 0 }}>
                    <span style={{ font: '600 12.5px var(--font-sans)', color: '#fff' }}>{t.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.ex}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>Do this <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· pick one or more, in order</span></span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ACTION_OPTS.map(a => {
                const i = acts.indexOf(a.id)
                const on = i > -1
                return (
                  <button key={a.id} onClick={() => setActs(s => on ? s.filter(x => x !== a.id) : [...s, a.id])} className="row gap-3" style={{ padding: '11px 12px', borderRadius: 11, cursor: 'pointer', textAlign: 'left', background: on ? '#8b7cff14' : 'var(--bg-2)', border: '1px solid ' + (on ? 'var(--violet)' : 'var(--border)') }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: on ? 'var(--violet)' : 'var(--bg-3)', color: on ? '#0a0a0a' : 'var(--violet)', display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative' }}>
                      <Icon name={a.icon} size={14} />
                      {on && <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: 99, background: 'var(--violet)', color: '#0a0a0a', font: '700 9px var(--font-sans)', display: 'grid', placeItems: 'center', border: '2px solid var(--bg-1)' }}>{i + 1}</span>}
                    </span>
                    <span style={{ font: '600 12.5px var(--font-sans)', color: '#fff' }}>{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="row between" style={{ padding: '13px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {trig && acts.length ? `Trigger + ${acts.length} action${acts.length > 1 ? 's' : ''}` : 'Pick a trigger and an action'}
          </span>
          <button onClick={build} disabled={!ready} className="btn btn-primary" style={{ height: 34, opacity: ready ? 1 : 0.5, cursor: ready ? 'pointer' : 'not-allowed' }}>
            <Icon name="bolt" size={13} />Create automation
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [chains, setChains] = useState<Chain[]>(SEED_CHAINS)
  const [scope, setScope] = useState<string>('agency')
  const [cadence, setCadence] = useState<string>('daily')

  // drawer
  const [detailId, setDetailId] = useState<string | null>(null)

  // canvas (opened from drawer)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [canvasChain, setCanvasChain] = useState<Chain | null>(null)

  // new automation flow
  const [creating, setCreating] = useState(false)
  const [manualNew, setManualNew] = useState(false)

  const liveCount = chains.filter(c => c.enabled).length + 2 // + master + optimiser
  const detailChain = detailId ? chains.find(c => c.id === detailId) ?? null : null

  const scopeClient = scope !== 'agency' ? CLIENTS.find(c => c.id === scope) ?? null : null
  const scopeChains = scope === 'agency' ? chains.filter(c => !c.client) : chains.filter(c => c.client === scope)

  function toggleChain(id: string) {
    setChains(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
  }

  function deleteChain(id: string) {
    setChains(prev => prev.filter(c => c.id !== id))
    setDetailId(null)
  }

  function openBuilder(chain: Chain) {
    setDetailId(null)
    setCanvasChain(chain)
    setCanvasOpen(true)
  }

  function handleSave(nodes: CanvasNode[], edges: CanvasEdge[]) {
    if (canvasChain) {
      setChains(prev => prev.map(c => c.id === canvasChain.id ? { ...c, steps: nodes.filter(n => n.kind !== 'trigger').length } : c))
    }
    setCanvasOpen(false)
    setCanvasChain(null)
  }

  function onBuilt(newChain: Chain) {
    setChains(prev => [newChain, ...prev])
    setCreating(false)
    setDetailId(newChain.id)
  }

  function onManualCreated(newChain: Chain) {
    setChains(prev => [newChain, ...prev])
    setManualNew(false)
    setDetailId(newChain.id)
  }

  return (
    <>
      <div className="page-root">
        <TopBar crumbs={[{ label: 'Automations' }]} />
        <div className="page-inner" style={{ maxWidth: 1180 }}>
          <div className="col gap-5" style={{ paddingBottom: 80 }}>

            {/* header */}
            <div className="row between" style={{ alignItems: 'flex-end' }}>
              <div className="col gap-2">
                <div className="row gap-2 eyebrow" style={{ margin: 0 }}>
                  <span className="live-dot" />{liveCount} live · mission control
                </div>
                <div className="h-display" style={{ fontSize: 40 }}>Automations</div>
                <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Every trigger, every agent, one view.</span>
              </div>
              <button onClick={() => setCreating(true)} className="btn btn-primary" style={{ height: 40 }}>
                <Icon name="plus" size={14} />New automation
              </button>
            </div>

            {/* HERO — master chain */}
            <MasterChain />

            {/* AI optimiser */}
            <Optimiser cadence={cadence} setCadence={setCadence} />

            {/* grid section */}
            <div className="col gap-3">
              <div className="row between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
                <span className="eyebrow" style={{ margin: 0 }}>
                  {scope === 'agency' ? 'Agency templates' : (scopeClient ? scopeClient.name + ' · automations' : 'Automations')}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{scopeChains.filter(c => c.enabled).length} of {scopeChains.length} on</span>
              </div>

              {/* Business scope selector */}
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  onClick={() => setScope('agency')}
                  className="chip"
                  style={{ height: 30, cursor: 'pointer', background: scope === 'agency' ? 'var(--lime)' : 'var(--bg-2)', color: scope === 'agency' ? '#0a0a0a' : 'var(--text-2)', borderColor: scope === 'agency' ? 'var(--lime)' : 'var(--border)', fontWeight: scope === 'agency' ? 600 : 500 }}
                >
                  <Icon name="layers" size={12} />Agency
                </button>
                {CLIENTS.map(cl => {
                  const on = scope === cl.id
                  const n = chains.filter(c => c.client === cl.id).length
                  return (
                    <button
                      key={cl.id}
                      onClick={() => setScope(cl.id)}
                      className="chip"
                      style={{ height: 30, cursor: 'pointer', background: on ? cl.color : 'var(--bg-2)', color: on ? '#0a0a0a' : 'var(--text-2)', borderColor: on ? cl.color : 'var(--border)', fontWeight: on ? 600 : 500 }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: on ? '#0a0a0a' : cl.color }} />
                      {cl.name.split(' ')[0]}
                      {n > 0 && <span style={{ opacity: 0.7 }}>· {n}</span>}
                    </button>
                  )
                })}
              </div>

              {/* client context banner */}
              {scope !== 'agency' && scopeClient && (
                <div className="panel" style={{ padding: '11px 14px', background: scopeClient.color + '10', borderColor: scopeClient.color + '33' }}>
                  <span className="row gap-2" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    <Icon name="sparkle" size={12} />
                    Automations built here run only for <strong style={{ color: '#fff' }}>{scopeClient.name}</strong>. Use <strong>New automation</strong> to build one specific to them.
                  </span>
                </div>
              )}

              {/* chain cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
                {scopeChains.map(c => (
                  <ChainCard
                    key={c.id}
                    c={c}
                    onToggle={() => toggleChain(c.id)}
                    onOpen={() => setDetailId(c.id)}
                  />
                ))}
                {scopeChains.length === 0 && (
                  <div className="panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
                    No automations for {scopeClient ? scopeClient.name : 'this'} yet.{' '}
                    <button
                      onClick={() => setCreating(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
                    >
                      Build one with Claude →
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Chain detail drawer */}
      {detailChain && (
        <ChainDetail
          c={detailChain}
          onClose={() => setDetailId(null)}
          onToggle={() => toggleChain(detailChain.id)}
          onDelete={() => deleteChain(detailChain.id)}
          onBuild={() => openBuilder(detailChain)}
        />
      )}

      {/* AutomationCanvas — opened from inside the drawer */}
      <AutomationCanvas
        open={canvasOpen}
        automation={canvasChain}
        onClose={() => { setCanvasOpen(false); setCanvasChain(null) }}
        onSave={handleSave}
      />

      {/* Build with Claude modal */}
      {creating && (
        <BuildWithClaude
          scope={scope}
          scopeClientName={scopeClient?.name ?? null}
          onClose={() => setCreating(false)}
          onBuilt={onBuilt}
          onManual={() => { setCreating(false); setManualNew(true) }}
        />
      )}

      {/* Manual new automation modal */}
      {manualNew && (
        <NewAutomation
          scope={scope}
          onClose={() => setManualNew(false)}
          onCreated={onManualCreated}
        />
      )}
    </>
  )
}
