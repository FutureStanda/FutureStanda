'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icons'

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

// ---- Sample research data ----
const RESEARCH_SAMPLE = {
  runtime: '38s',
  sources: 47,
  confidence: 'High',
  summary:
    "Murphy Plumbing has strong local reviews (4.8★, 47 total) but zero paid acquisition. The owner relies 100% on word-of-mouth. A competitor 8km away spends €2k/mo on Meta and dominates the emergency-call traffic. With GBP optimised and a €1,200/mo Meta budget, we project 28–35 qualified leads/month within 60 days.",
  gap: {
    from: "12 organic leads/month, no paid ads, no booking system, owner answering calls himself",
    to: "35+ qualified leads/month, automated booking, 4.9★ GBP, €12k/month revenue",
  },
  opportunities: [
    {
      rank: 1,
      title: "Meta emergency-call campaigns",
      detail: "Target 10km radius with 'burst pipe?' urgency creative. US comps are hitting €6–8 CPL. Local gap is wide open — closest competitor is spending but not split-testing.",
      metric: "+23 leads/mo",
      impact: "High",
      effort: "Low",
    },
    {
      rank: 2,
      title: "GBP optimisation + review sprint",
      detail: "Profile is incomplete: no booking link, 4 unanswered reviews, no posts in 3 months. Topping local pack for 'plumber Dublin 4' adds 8–12 free leads/mo.",
      metric: "+10 leads/mo",
      impact: "High",
      effort: "Low",
    },
    {
      rank: 3,
      title: "Missed-call text-back automation",
      detail: "Owner is losing 4–6 calls/week to voicemail. A 60-second SMS-back with a booking link converts 30–40% of those into booked jobs — pure revenue recovery.",
      metric: "€800/mo recovered",
      impact: "High",
      effort: "Low",
    },
    {
      rank: 4,
      title: "Seasonal boiler service campaign",
      detail: "October–November boiler-service search volume spikes 280% in this area. No local competitor is running Google Search ads on these terms. First-mover advantage available now.",
      metric: "+15 jobs/mo",
      impact: "Medium",
      effort: "Medium",
    },
  ],
  competitors: [
    { name: "Galway Plumbing Co", note: "€2k/mo Meta spend, 4.6★ GBP, running emergency-call ads since Jan. Dominates mobile search.", threat: "high" },
    { name: "FastFix Plumbers", note: "Strong GBP listing, no paid ads, 4.7★ with 98 reviews. SEO play only.", threat: "med" },
    { name: "City Drain Services", note: "Only active on Yelp, no Meta, outdated website. No immediate threat.", threat: "low" },
  ],
  adLibrary: [
    {
      market: "Manchester, UK",
      play: '"Burst pipe? We answer in 60 seconds" — emergency hook with Google Maps screenshot',
      note: "Running 4+ months, 3 variants. Top performer is the 15s vertical video showing phone pickup + dispatch in real time.",
    },
    {
      market: "Boston, US",
      play: '"Your neighbour used us last week" — hyperlocal social proof with postcode callout',
      note: "Works on cold audiences. Pairs 5★ review screenshot with a neighbourhood-specific headline. CTR 2.8× industry avg.",
    },
    {
      market: "Melbourne, AU",
      play: '"Free callout this week only" + countdown timer overlay',
      note: "Urgency + scarcity combo. Short-run offer (5 days). Strong on iPhone-heavy demographics aged 35–54.",
    },
  ],
  roadmap: [
    {
      phase: "Week 1–2",
      title: "Foundation",
      items: [
        "Complete GBP profile + add booking link",
        "Deploy missed-call text-back",
        "Set up Meta Business Manager",
        "Collect 8 fresh 5★ reviews",
      ],
    },
    {
      phase: "Month 1",
      title: "Launch",
      items: [
        "Go live: emergency-call Meta campaign",
        "A/B test 2 creatives (hook vs social proof)",
        "Optimise landing page for local search",
        "First weekly performance report",
      ],
    },
    {
      phase: "Month 2–3",
      title: "Scale",
      items: [
        "Scale winning ad set to €1,200/mo",
        "Add boiler-service Google Search campaign",
        "Build retargeting audience from website",
        "Hit 35+ leads/mo milestone",
      ],
    },
    {
      phase: "Month 3+",
      title: "Dominate",
      items: [
        "Dominate local pack for 3 target keywords",
        "Automated review-request post-job",
        "Video testimonial asset library",
        "QBR + upsell to Domination plan",
      ],
    },
  ],
}

// ---- PanelHead ----
function PanelHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="col" style={{ gap: 2, marginBottom: 14 }}>
      <span style={{ font: '600 13.5px var(--font-sans)', color: 'var(--text)' }}>{title}</span>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</span>}
    </div>
  )
}

// ---- ResearchRunning ----
export function ResearchRunning({ lead, onComplete }: { lead: LeadItem; onComplete?: () => void }) {
  const steps = [
    "Scraping Google profile & reviews",
    "Auditing website speed & booking flow",
    `Pulling competitors in ${lead.area || 'the area'}`,
    "Scanning Meta Ad Library — local + US niche",
    "Mapping gap from current → goal",
    "Drafting the speed-to-results plan",
  ]

  const [n, setN] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setN(x => {
        if (x < steps.length) return x + 1
        clearInterval(t)
        return x
      })
    }, 700)
    return () => clearInterval(t)
  }, [steps.length])

  useEffect(() => {
    if (n >= steps.length && onComplete) {
      const timer = setTimeout(onComplete, 400)
      return () => clearTimeout(timer)
    }
  }, [n, steps.length, onComplete])

  return (
    <div
      className="panel"
      style={{
        padding: 24,
        borderColor: '#8b7cff44',
        background: 'linear-gradient(135deg, #14111f, transparent 60%)',
      }}
    >
      <div className="row gap-3" style={{ marginBottom: 18 }}>
        <span
          style={{
            width: 38, height: 38, borderRadius: 11,
            background: '#8B7CFF', color: '#0a0a0a',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}
        >
          <Icon name="sparkle" size={18} />
        </span>
        <div className="col" style={{ gap: 2 }}>
          <span className="row gap-2" style={{ font: '600 15px var(--font-sans)' }}>
            Research agent working
            <span
              className="live-dot"
              style={{ background: '#8B7CFF', animation: 'pulse 1.4s infinite' }}
            />
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Deep mode · scanning every angle to scale {lead.business}
          </span>
        </div>
      </div>

      <div className="col gap-2">
        {steps.map((s, i) => {
          const done = i < n
          const active = i === n
          return (
            <div
              key={i}
              className="row gap-3"
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                background: done || active ? 'var(--bg-2)' : 'transparent',
                opacity: done || active ? 1 : 0.4,
                transition: 'all .3s',
              }}
            >
              <span
                style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: done ? '#8B7CFF' : 'var(--bg-3)',
                  color: '#0a0a0a',
                }}
              >
                {done ? (
                  <Icon name="check" size={11} />
                ) : active ? (
                  <span
                    className="live-dot"
                    style={{ background: '#8B7CFF', width: 6, height: 6 }}
                  />
                ) : null}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: done ? 'var(--text-2)' : active ? 'var(--text)' : 'var(--text-3)',
                }}
              >
                {s}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Dossier ----
export function Dossier({ lead }: { lead: LeadItem }) {
  const r = RESEARCH_SAMPLE

  const impactChip = (impact: string) => {
    if (impact === 'High') return 'chip-lime'
    if (impact === 'Medium') return 'chip-amber'
    return 'chip-dim'
  }

  const threatColor = (threat: string) => {
    if (threat === 'high') return 'var(--red)'
    if (threat === 'med') return 'var(--amber)'
    return 'var(--text-3)'
  }

  return (
    <div className="col gap-4">
      {/* Summary banner */}
      <div
        className="panel"
        style={{
          padding: 20,
          borderColor: '#8b7cff3a',
          background: 'linear-gradient(135deg, #14111f, transparent 55%)',
        }}
      >
        <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div className="row gap-2">
            <span
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#8B7CFF', color: '#0a0a0a',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}
            >
              <Icon name="sparkle" size={13} />
            </span>
            <span style={{ font: '600 14px var(--font-sans)' }}>Research dossier</span>
            <span className="chip chip-lime">
              <Icon name="check" size={11} />Complete
            </span>
          </div>
          <div className="row gap-3" style={{ fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap' }}>
            <span className="row gap-2">
              <Icon name="clock" size={11} />{r.runtime}
            </span>
            <span className="row gap-2">
              <Icon name="layers" size={11} />{r.sources} sources
            </span>
            <span className="chip chip-violet">{r.confidence} confidence</span>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          {r.summary}
        </p>
      </div>

      {/* Gap analysis */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Where they are → where they want to go" />
        <div className="row gap-3" style={{ alignItems: 'stretch' }}>
          <div
            className="col gap-2 flex-1"
            style={{
              padding: 14, borderRadius: 12,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="eyebrow" style={{ color: 'var(--red)' }}>Now</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.gap.from}</span>
          </div>
          <div className="col" style={{ justifyContent: 'center', color: 'var(--lime)', flexShrink: 0 }}>
            <Icon name="arrowR" size={20} />
          </div>
          <div
            className="col gap-2 flex-1"
            style={{
              padding: 14, borderRadius: 12,
              background: '#cfff3a12',
              border: '1px solid #cfff3a3a',
            }}
          >
            <span className="eyebrow" style={{ color: 'var(--lime)' }}>Goal</span>
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{r.gap.to}</span>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Opportunities to scale" sub="Ranked by impact ÷ effort" />
        <div className="col gap-2">
          {r.opportunities.map(o => (
            <div
              key={o.rank}
              className="row gap-3"
              style={{
                padding: 14, borderRadius: 12,
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: 'var(--lime)', color: '#0a0a0a',
                  fontWeight: 700, fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {o.rank}
              </span>
              <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ font: '600 13.5px var(--font-sans)', color: 'var(--text)' }}>
                    {o.title}
                  </span>
                  <span className="chip chip-lime" style={{ flexShrink: 0 }}>{o.metric}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{o.detail}</span>
                <div className="row gap-2">
                  <span className={`chip ${impactChip(o.impact)}`}>Impact: {o.impact}</span>
                  <span className="chip chip-dim">Effort: {o.effort}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitors + Ad Library */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div className="panel" style={{ padding: 18 }}>
          <PanelHead title="Competitor scan" sub="Who they're up against" />
          <div className="col gap-2">
            {r.competitors.map((c, i) => (
              <div
                key={i}
                className="row gap-3"
                style={{
                  padding: '11px 12px', borderRadius: 10,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 3,
                    background: threatColor(c.threat),
                    flexShrink: 0, marginTop: 5,
                  }}
                />
                <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ font: '600 12.5px var(--font-sans)', color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{c.note}</span>
                </div>
                <span
                  className="chip chip-dim"
                  style={{ flexShrink: 0, color: threatColor(c.threat) }}
                >
                  {c.threat} threat
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: 18 }}>
          <PanelHead title="Meta Ad Library plays" sub="What's winning in bigger markets" />
          <div className="col gap-2">
            {r.adLibrary.map((a, i) => (
              <div
                key={i}
                className="col gap-2"
                style={{
                  padding: '11px 12px', borderRadius: 10,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="row between">
                  <span className="chip chip-violet">{a.market}</span>
                  <Icon name="arrowUpR" size={13} />
                </div>
                <span style={{ font: '600 12.5px var(--font-sans)', color: 'var(--text)', lineHeight: 1.4 }}>
                  {a.play}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.45 }}>{a.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Speed-to-results roadmap" sub="From signed to scaling" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {r.roadmap.map((p, i) => (
            <div
              key={i}
              className="col gap-3"
              style={{
                padding: 14, borderRadius: 12,
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderTop: '2px solid var(--lime)',
              }}
            >
              <div className="col gap-1">
                <span className="eyebrow" style={{ color: 'var(--lime)' }}>{p.phase}</span>
                <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)' }}>{p.title}</span>
              </div>
              <div className="col gap-2">
                {p.items.map((it, j) => (
                  <div key={j} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 4, height: 4, borderRadius: 2,
                        background: 'var(--lime)',
                        marginTop: 6, flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary">
          <Icon name="doc" size={13} />Build proposal from this
        </button>
        <button className="btn">
          <Icon name="download" size={13} />Export dossier
        </button>
        <button className="btn">
          <Icon name="refresh" size={13} />Re-run research
        </button>
      </div>
    </div>
  )
}
