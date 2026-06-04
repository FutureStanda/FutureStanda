'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Segmented } from '@/components/ui/shared'
import { Icon } from '@/components/ui/icons'
import { useUI } from '@/store/use-store'
import { LEADS_DATA } from '@/lib/data'
import { ResearchRunning, Dossier } from '@/components/leads/ResearchDossier'

// ---- Extended Lead type (supplements LEADS_DATA with intake fields) ----
interface LeadItem {
  id: string
  business: string
  person: string
  email: string
  phone: string
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
  package: string
  google?: string
  socials?: string
  services?: string
  process?: string
  dream?: string
  blockers?: string
  change?: string
  whynow?: string
}

// Mock intake fields supplemented onto base LEADS_DATA.leads
const MOCK_INTAKE: Record<string, Partial<LeadItem>> = {
  l1: {
    email: 'padraig@premierplumbing.ie',
    phone: '+353 87 341 9921',
    package: 'Domination €998/mo',
    google: 'g.page/premier-plumbing-dublin',
    socials: '@premierplumbing',
    services: 'Emergency callouts, boiler service & install, bathroom fit-outs',
    process: 'Google Business Profile + word of mouth. Some referral work from builders.',
    dream: 'Full bathroom fit-outs and boiler installs, €2k–€10k jobs in D4 and D6.',
    blockers: 'Missing calls on the job — calls go to voicemail and the jobs go elsewhere.',
    change: 'Steady €30k months, a second van on the road, stop doing emergency callouts himself.',
    whynow: 'Just lost a big bathroom job to a competitor who answered on the first ring.',
  },
  l2: {
    email: 'claire@shinewindows.ie',
    phone: '+353 86 229 0044',
    package: 'Growth €698/mo',
    google: 'g.page/shine-window-cleaning-cork',
    socials: '@shinewindows',
    services: 'Commercial window cleaning, domestic window cleaning, gutter clearing',
    process: 'Leaflet drops + Facebook posts. No ads, no booking system.',
    dream: 'Commercial contracts with offices and apartment blocks — recurring revenue not one-off jobs.',
    blockers: 'No online presence, all quotes done manually over the phone.',
    change: 'Lock in 5 recurring commercial contracts, take one-off domestic jobs off the board.',
    whynow: 'A competitor just picked up the contract she wanted — needs to move fast.',
  },
  l3: {
    email: 'martin@egansecurity.ie',
    phone: '+353 85 774 2231',
    package: 'Domination €998/mo',
    google: 'g.page/egan-security-systems',
    socials: '@egansecurity',
    services: 'CCTV installation, alarm systems, access control, commercial security',
    process: 'Referrals only. No ads, no website worth mentioning.',
    dream: 'Commercial contracts — office parks, retail, construction sites. Not domestic.',
    blockers: 'No way for people to find them online. Losing commercial jobs to bigger firms.',
    change: 'Become the go-to commercial security provider in the mid-west.',
    whynow: 'A large commercial estate just enquired — wants to look credible before the pitch.',
  },
  l4: {
    email: 'sinead@galwayremovals.ie',
    phone: '+353 91 556 8840',
    package: 'Growth €698/mo',
    google: 'g.page/galway-bay-removals',
    socials: '@galwayremovals',
    services: 'House moves, office relocations, packing service, storage',
    process: 'Facebook marketplace + Google My Business. No paid ads.',
    dream: 'Corporate relocation contracts and end-of-tenancy moves in the city centre.',
    blockers: 'Feast or famine — busy weekends, dead midweeks. No system for repeat business.',
    change: 'Fill the weekday diary, stop competing on price alone.',
    whynow: 'A corporate client just asked for a quote — needs a professional web presence.',
  },
  l5: {
    email: 'brendan@munsterskiphire.ie',
    phone: '+353 52 612 7745',
    package: 'Domination €998/mo',
    google: 'g.page/munster-skip-hire',
    socials: '@munsterskiphire',
    services: 'Skip hire, grab hire, aggregate delivery, site clearance',
    process: 'Old website + word of mouth. Google Ads run by a nephew, no tracking.',
    dream: 'Commercial site clearance contracts with construction firms — big jobs, recurring.',
    blockers: 'Unknown ROI on ad spend. Quoting jobs manually, no online booking.',
    change: 'Know exactly what every euro in ads returns. Automate the quote process.',
    whynow: 'Construction projects ramping up in Tipperary — wants to capture the wave.',
  },
}

// Build enriched leads array
const ENRICHED_LEADS: LeadItem[] = LEADS_DATA.leads.map(l => ({
  ...l,
  email: '',
  phone: '',
  package: `€${l.value}/mo`,
  ...(MOCK_INTAKE[l.id] || {}),
}))

// ---- Stage helpers ----
function stageColor(id: string) {
  return (LEADS_DATA.stages.find(s => s.id === id) || { color: 'var(--text-3)' }).color
}
function stageLabel(id: string) {
  return (LEADS_DATA.stages.find(s => s.id === id) || { label: id }).label
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

// ---- InfoBit ----
function InfoBit({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className="col gap-1" style={{ flex: wide ? '1 1 100%' : '1', minWidth: 0 }}>
      <span className="eyebrow">{label}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{value || '—'}</span>
    </div>
  )
}

// ---- Lead Detail (full-page replace) ----
function LeadDetail({
  lead: initialLead,
  back,
  allLeads,
  setAllLeads,
}: {
  lead: LeadItem
  back: () => void
  allLeads: LeadItem[]
  setAllLeads: (leads: LeadItem[]) => void
}) {
  const [tab, setTab] = useState<'research' | 'intake'>('research')
  const [stageOpen, setStageOpen] = useState(false)

  // derive current lead from allLeads so stage changes reflect
  const lead = allLeads.find(l => l.id === initialLead.id) || initialLead

  function setStage(id: string) {
    setAllLeads(allLeads.map(l => l.id === lead.id ? { ...l, stage: id } : l))
    setStageOpen(false)
  }

  function mockToast(msg: string) {
    // lightweight non-blocking toast — injects a temp div
    const el = document.createElement('div')
    el.textContent = msg
    el.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:#1f201f; border:1px solid var(--border); border-radius:10px;
      padding:10px 18px; font:500 13px var(--font-sans); color:var(--text-2);
      z-index:9999; white-space:nowrap; box-shadow:0 8px 32px #000a;
      animation:fadeup .2s ease both;
    `
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2200)
  }

  const sc = stageColor(lead.stage)

  const qual: [string, string | undefined, boolean][] = [
    ['Current client process', lead.process, false],
    ['Dream client', lead.dream, true],
    ['What\'s slowing growth', lead.blockers, false],
    ['What hitting the goal changes', lead.change, false],
    ['Why now', lead.whynow, true],
  ]

  return (
    <div className="col gap-4" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 60 }}>
      {/* Back */}
      <button
        onClick={back}
        className="btn btn-ghost"
        style={{ width: 'fit-content', height: 28, paddingLeft: 6 }}
      >
        <Icon name="chevL" size={14} />Back to leads
      </button>

      {/* Header panel */}
      <div
        className="panel"
        style={{
          padding: 20,
          background: `linear-gradient(120deg, ${lead.color}14, transparent 55%)`,
          borderColor: lead.color + '33',
        }}
      >
        <div className="row between" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          {/* Left: avatar + name + contacts */}
          <div className="row gap-4" style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                width: 50, height: 50, borderRadius: 14,
                background: lead.color, color: '#0a0a0a',
                display: 'grid', placeItems: 'center',
                font: '700 22px var(--font-sans)', flexShrink: 0,
              }}
            >
              {lead.business[0]}
            </span>
            <div className="col" style={{ gap: 6, minWidth: 0 }}>
              <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    font: '600 21px var(--font-sans)',
                    letterSpacing: '-0.02em',
                    color: 'var(--text)',
                    margin: 0,
                  }}
                >
                  {lead.business}
                </h1>
                <span className="chip chip-dim">{lead.niche}</span>
                <ResearchBadge status={lead.research} />
              </div>
              <div
                className="row gap-3"
                style={{ color: 'var(--text-3)', fontSize: 12.5, flexWrap: 'wrap' }}
              >
                <span className="row gap-2"><Icon name="users" size={13} />{lead.person}</span>
                {lead.email && <span className="row gap-2"><Icon name="mail" size={13} />{lead.email}</span>}
                {lead.phone && <span className="row gap-2"><Icon name="phone" size={13} />{lead.phone}</span>}
                <span className="row gap-2"><Icon name="pin" size={13} />{lead.area}</span>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="row gap-2" style={{ flexWrap: 'wrap', flexShrink: 0 }}>
            {/* Stage dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setStageOpen(o => !o)}
                className="btn"
                style={{ borderColor: sc + '66', color: sc }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, background: sc }} />
                {stageLabel(lead.stage)}
                <Icon name="chevD" size={13} />
              </button>
              {stageOpen && (
                <>
                  <div
                    onClick={() => setStageOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  />
                  <div
                    className="panel"
                    style={{
                      position: 'absolute', top: 38, left: 0, zIndex: 41,
                      width: 200, padding: 6,
                      background: 'var(--bg-1)',
                      border: '1px solid var(--border-strong)',
                      boxShadow: '0 16px 50px #000a',
                    }}
                  >
                    <span
                      className="eyebrow"
                      style={{ display: 'block', padding: '4px 8px', marginBottom: 2 }}
                    >
                      Set status
                    </span>
                    {LEADS_DATA.stages.map(s => {
                      const active = lead.stage === s.id
                      return (
                        <button
                          key={s.id}
                          onClick={() => setStage(s.id)}
                          className="row gap-2"
                          style={{
                            width: '100%', padding: '8px 9px', borderRadius: 8,
                            border: 'none',
                            background: active ? 'var(--bg-active)' : 'transparent',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'background .12s',
                          }}
                          onMouseEnter={e => {
                            if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2)'
                          }}
                          onMouseLeave={e => {
                            if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                          }}
                        >
                          <span
                            style={{
                              width: 8, height: 8, borderRadius: 99,
                              background: s.color, flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              font: '500 12.5px var(--font-sans)',
                              color: active ? 'var(--text)' : 'var(--text-2)',
                              flex: 1,
                            }}
                          >
                            {s.label}
                          </span>
                          {active && <Icon name="check" size={13} />}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              className="btn"
              onClick={() => mockToast('WhatsApp message opened')}
            >
              <Icon name="msg" size={13} />Message
            </button>
            <button
              className="btn btn-primary"
              onClick={() => mockToast('Building proposal…')}
            >
              <Icon name="doc" size={13} />Build proposal
            </button>
          </div>
        </div>

        {/* Automation status strip */}
        <div
          className="row gap-2"
          style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <span className="chip">
            <Icon name="calendar" size={11} />{lead.meetingAt}
          </span>
          <span className="chip" style={{ color: '#229ED9', borderColor: '#229ED944' }}>
            <Icon name="msg" size={11} />Telegram reminder set
          </span>
          {lead.introSent
            ? <span className="chip chip-lime"><Icon name="check" size={11} />Intro sent</span>
            : <span className="chip chip-amber"><Icon name="clock" size={11} />Intro pending</span>
          }
          <span className="chip chip-lime" style={{ marginLeft: 'auto' }}>
            €{lead.value.toLocaleString()} · {lead.package}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="row gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {(['research', 'intake'] as const).map(v => {
          const label = v === 'research' ? 'Research dossier' : 'Intake answers'
          const active = tab === v
          return (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 4px', marginRight: 14,
                font: `${active ? 600 : 500} 13px var(--font-sans)`,
                color: active ? 'var(--text)' : 'var(--text-3)',
                borderBottom: `2px solid ${active ? 'var(--lime)' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'research' ? (
        lead.research === 'complete'
          ? <Dossier lead={lead} />
          : <ResearchRunning lead={lead} />
      ) : (
        <div className="panel" style={{ padding: 20 }}>
          <div className="col" style={{ gap: 2, marginBottom: 14 }}>
            <span style={{ font: '600 13.5px var(--font-sans)', color: 'var(--text)' }}>
              What they told you
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Captured at intake</span>
          </div>
          <div className="col gap-3">
            <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
              <InfoBit label="Google" value={lead.google} />
              <InfoBit label="Socials" value={lead.socials} />
              <InfoBit label="Services" value={lead.services} wide />
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            {qual.map(([q, a, highlight], i) => (
              <div
                key={i}
                className="col gap-2"
                style={{
                  padding: '12px 14px', borderRadius: 11,
                  background: highlight ? '#cfff3a0a' : 'var(--bg-2)',
                  border: `1px solid ${highlight ? '#cfff3a2a' : 'var(--border)'}`,
                }}
              >
                <span
                  className="eyebrow"
                  style={{ color: highlight ? 'var(--lime)' : 'var(--text-3)' }}
                >
                  {q}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                  {a || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Pipeline view ----
function PipelineView({
  leads,
  onSelectLead,
}: {
  leads: LeadItem[]
  onSelectLead: (l: LeadItem) => void
}) {
  const stages = LEADS_DATA.stages.filter(s => s.id !== 'lost')
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stages.length}, minmax(180px, 1fr))`,
        gap: 12,
        alignItems: 'flex-start',
        overflowX: 'auto',
      }}
    >
      {stages.map(st => {
        const items = leads.filter(l => l.stage === st.id)
        return (
          <div key={st.id} className="panel" style={{ padding: 12, background: 'var(--bg-1)' }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="row gap-2" style={{ font: '600 12px var(--font-sans)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: st.color }} />
                {st.label}
              </span>
              <span className="chip chip-dim">{items.length}</span>
            </div>
            <div className="col gap-2">
              {items.map(l => (
                <button
                  key={l.id}
                  onClick={() => onSelectLead(l)}
                  className="col gap-2"
                  style={{
                    padding: 12, borderRadius: 11,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'border-color .12s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = l.color
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                  }}
                >
                  <div className="row between">
                    <span className="row gap-2" style={{ minWidth: 0 }}>
                      <span
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: l.color, color: '#0a0a0a',
                          display: 'grid', placeItems: 'center',
                          font: '700 10px var(--font-sans)', flexShrink: 0,
                        }}
                      >
                        {l.business[0]}
                      </span>
                      <span
                        style={{
                          font: '600 12.5px var(--font-sans)', color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {l.business}
                      </span>
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {l.person} · {l.niche}
                  </span>
                  <div className="row between" style={{ marginTop: 2 }}>
                    <span className="row gap-2" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                      <Icon name="calendar" size={11} />{l.meetingIn}
                    </span>
                    <span
                      className="num"
                      style={{ fontSize: 11, fontWeight: 600, color: 'var(--lime)' }}
                    >
                      €{l.value.toLocaleString()}
                    </span>
                  </div>
                  {l.stage === 'researching' && <ResearchBadge status={l.research} />}
                </button>
              ))}
              {!items.length && (
                <div
                  style={{
                    fontSize: 11, color: 'var(--text-3)',
                    textAlign: 'center', padding: '14px 0',
                  }}
                >
                  —
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Meetings view ----
function MeetingsView({
  leads,
  onSelectLead,
}: {
  leads: LeadItem[]
  onSelectLead: (l: LeadItem) => void
}) {
  const upcoming = leads
    .filter(l => !['won', 'lost'].includes(l.stage) && l.meetingIn !== 'done')
    .sort((a, b) => a.priority - b.priority)

  return (
    <div className="col gap-4">
      <div
        className="panel"
        style={{
          padding: 16,
          background: 'linear-gradient(120deg, #0e1a1f, transparent 60%)',
          borderColor: '#229ED944',
        }}
      >
        <div className="row gap-3">
          <span
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#229ED9', color: '#fff',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}
          >
            <Icon name="msg" size={18} />
          </span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '600 13.5px var(--font-sans)' }}>Telegram reminders are on</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              You&apos;ll get pinged 1 hour and 10 minutes before every call below — no meeting slips.
            </span>
          </div>
          <span className="chip chip-lime" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <span className="dot" />Connected
          </span>
        </div>
      </div>

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
            <button
              key={l.id}
              onClick={() => onSelectLead(l)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', padding: '14px 18px',
                border: 'none',
                borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <div className="col" style={{ alignItems: 'center', width: 64, flexShrink: 0, gap: 2 }}>
                <span style={{ font: '600 17px var(--font-sans)', color: l.color }}>{time}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{date}</span>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ font: '600 13.5px var(--font-sans)', color: 'var(--text)' }}>
                  {l.business}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                  {l.person} · {l.niche} · {l.area}
                </span>
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
            </button>
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
        <div className="col" style={{ gap: 2, marginBottom: 18 }}>
          <span style={{ font: '600 15px var(--font-sans)', color: 'var(--text)' }}>
            Lead capture → delivery
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>The full machine, end to end</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              className="col gap-3"
              style={{
                padding: 16, borderRadius: 14,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute', top: -10, right: -6,
                  font: '700 56px var(--font-sans)', color: s.c,
                  opacity: 0.08, letterSpacing: '-0.04em', pointerEvents: 'none',
                }}
              >
                {s.n}
              </div>
              <div className="row gap-2">
                <span
                  style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: s.c, color: '#0a0a0a',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}
                >
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
function TableView({
  leads,
  onSelectLead,
}: {
  leads: LeadItem[]
  onSelectLead: (l: LeadItem) => void
}) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr',
          gap: 12, padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-2)',
        }}
      >
        {['Business', 'Contact', 'Stage', 'Meeting', 'Value', 'Research'].map((h, i) => (
          <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>
        ))}
      </div>
      {leads.map(l => (
        <button
          key={l.id}
          onClick={() => onSelectLead(l)}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr',
            gap: 12, alignItems: 'center',
            width: '100%', padding: '12px 16px',
            border: 'none', borderBottom: '1px solid var(--border)',
            background: 'transparent', cursor: 'pointer', textAlign: 'left',
            transition: 'background .12s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span
              style={{
                width: 26, height: 26, borderRadius: 7,
                background: l.color, color: '#0a0a0a',
                display: 'grid', placeItems: 'center',
                font: '700 11px var(--font-sans)', flexShrink: 0,
              }}
            >
              {l.business[0]}
            </span>
            <div className="col" style={{ minWidth: 0 }}>
              <span
                style={{
                  font: '600 13px var(--font-sans)', color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
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
          <span
            className="num"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--lime)' }}
          >
            €{l.value.toLocaleString()}
          </span>
          <ResearchBadge status={l.research} />
        </button>
      ))}
    </div>
  )
}

// ---- Page ----
export default function LeadsPage() {
  const { setLeadOpen } = useUI()
  const [view, setView] = useState<'pipeline' | 'meetings' | 'process' | 'table'>('pipeline')
  const [leads, setLeads] = useState<LeadItem[]>(ENRICHED_LEADS)
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null)

  const liveCount = leads.filter(l => !['won', 'lost'].includes(l.stage)).length
  const meetingsCount = leads.filter(l => !['won', 'lost'].includes(l.stage) && l.meetingIn !== 'done').length
  const researchingCount = leads.filter(l => l.research === 'running' || l.research === 'queued').length

  // Full-page lead detail
  if (selectedLead) {
    return (
      <div className="page-root">
        <TopBar crumbs={[{ label: 'Leads', href: '/dashboard/leads' }, { label: selectedLead.business }]} />
        <div className="page-inner fadeup" style={{ paddingTop: 28 }}>
          <LeadDetail
            lead={selectedLead}
            back={() => setSelectedLead(null)}
            allLeads={leads}
            setAllLeads={setLeads}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Leads' }]} />
      <div className="page-inner col gap-4 fadeup" style={{ paddingTop: 28 }}>
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
        {view === 'pipeline' && (
          <PipelineView leads={leads} onSelectLead={setSelectedLead} />
        )}
        {view === 'meetings' && (
          <MeetingsView leads={leads} onSelectLead={setSelectedLead} />
        )}
        {view === 'process' && <ProcessMapView />}
        {view === 'table' && (
          <TableView leads={leads} onSelectLead={setSelectedLead} />
        )}
      </div>
    </div>
  )
}
