'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { Sparkline, Ring } from '@/components/ui/charts'
import { Delta, HealthPill } from '@/components/ui/shared'
import { CLIENTS, TASKS, getClient } from '@/lib/data'
import { fmtMoney, fmtNum, healthColor } from '@/lib/utils'

export default function ClientPortalPage() {
  const { id } = useParams<{ id: string }>()
  const c = getClient(id)
  const [tab, setTab] = useState('overview')

  if (!c) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
      Client not found. <Link href="/dashboard" style={{ color: 'var(--lime)', marginLeft: 8 }}>← Back</Link>
    </div>
  )

  const tasks = TASKS.filter(t => t.client_id === c.id && t.status !== 'done')

  const tabs = ['overview', 'performance', 'tasks', 'activity']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      {/* portal header */}
      <header style={{ background: 'linear-gradient(180deg, #0d0f0d, var(--bg-1))', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: c.color, display: 'grid', placeItems: 'center', font: '700 16px var(--font-sans)', color: '#0a0a0a', flexShrink: 0 }}>{c.avatar}</span>
          <div>
            <div style={{ font: '600 16px var(--font-sans)' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Client portal · powered by BizBoost</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HealthPill score={c.health} />
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 32, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
            <Icon name="chevL" size={13} />Admin view
          </Link>
        </div>
      </header>

      {/* tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', font: `${tab === t ? 600 : 500} 13px var(--font-sans)`, color: tab === t ? 'var(--text)' : 'var(--text-2)', borderBottom: `2px solid ${tab === t ? 'var(--lime)' : 'transparent'}`, marginBottom: -1, textTransform: 'capitalize' }}>
              {t === 'activity' ? 'Activity' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 60px' }}>

        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* welcome */}
            <div style={{ background: `linear-gradient(135deg, ${c.color}18, transparent)`, border: `1px solid ${c.color}33`, borderRadius: 16, padding: 24 }}>
              <div style={{ font: '700 22px var(--font-sans)', letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome back, {c.owner?.split(' ')[0] || 'there'} 👋</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Here's everything happening with your {c.niche?.toLowerCase()} business this month. All data updates automatically from your connected accounts.</div>
            </div>

            {/* kpi grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'New leads', value: c.leads30, delta: c.leads_delta, color: 'var(--lime)' },
                { label: 'Bookings', value: c.bookings30, delta: c.bookings_delta, color: '#4FE3C1' },
                { label: 'Revenue', value: fmtMoney(c.revenue30), delta: c.revenue_delta, color: '#5BCEFA' },
                { label: 'ROAS', value: c.roas ? c.roas.toFixed(1) + 'x' : '—', color: '#FFB347' },
              ].map(k => (
                <div key={k.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>{k.label}</div>
                  <div style={{ font: '700 28px var(--font-sans)', letterSpacing: '-0.03em', color: k.color, marginBottom: 4 }}>{k.value}</div>
                  {k.delta != null && <Delta v={k.delta} />}
                </div>
              ))}
            </div>

            {/* lead sparkline */}
            {c.sparkline.length > 2 && (
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ font: '600 14px var(--font-sans)' }}>Lead trend · last 14 days</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Incoming leads from all channels</div>
                  </div>
                  <span style={{ font: '700 22px var(--font-sans)', color: c.color }}>{c.leads30}</span>
                </div>
                <Sparkline data={c.sparkline} w={700} h={60} color={c.color} fill={true} />
              </div>
            )}

            {/* health + plan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <Ring pct={c.health} size={72} stroke={7} color={healthColor(c.health)}>
                  <span style={{ font: '700 16px var(--font-sans)', color: healthColor(c.health) }}>{c.health}</span>
                </Ring>
                <div>
                  <div style={{ font: '600 14px var(--font-sans)', marginBottom: 4 }}>Account health</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{c.health >= 80 ? 'Performing well — keep it up!' : c.health >= 65 ? 'A few things to improve.' : 'Needs attention — see tasks.'}</div>
                  <HealthPill score={c.health} />
                </div>
              </div>
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                <div style={{ font: '600 14px var(--font-sans)', marginBottom: 12 }}>Your plan</div>
                <div style={{ font: '700 20px var(--font-sans)', color: 'var(--lime)', marginBottom: 6 }}>{c.plan}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12 }}>{fmtMoney(c.mrr)}/month · Client since {c.since}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.services.map(s => <span key={s} className="chip chip-dim" style={{ fontSize: 11 }}>{s}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ font: '600 20px var(--font-sans)', margin: 0 }}>Performance details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Website visits', value: fmtNum(c.website_visits30), delta: c.website_visits_delta },
                { label: 'Conversion rate', value: c.website_conv + '%' },
                { label: 'Missed calls', value: c.missed_calls, color: c.missed_calls > 3 ? 'var(--red)' : 'var(--text)' },
                { label: 'Google reviews', value: c.reviews_count, sub: `${c.reviews_rating}★ avg` },
                { label: 'New reviews · 30d', value: c.reviews_new30, color: 'var(--lime)' },
                { label: 'Ad spend · 30d', value: fmtMoney(c.ad_spend) },
              ].map(k => (
                <div key={k.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ font: '700 24px var(--font-sans)', color: (k as any).color || 'var(--text)' }}>{k.value}</div>
                  {(k as any).delta != null && <Delta v={(k as any).delta} />}
                  {(k as any).sub && <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 4 }}>{(k as any).sub}</div>}
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ font: '600 14px var(--font-sans)', marginBottom: 14 }}>Social following</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[['Instagram', c.followers_ig, '#E1306C'], ['Facebook', c.followers_fb, '#1877F2'], ['TikTok', c.followers_tt, '#FE2C55']].map(([label, count, color]) => (count as number) > 0 && (
                  <div key={label as string} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>{label as string}</div>
                    <div style={{ font: '700 20px var(--font-sans)', color: color as string }}>{fmtNum(count as number)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ font: '600 20px var(--font-sans)', margin: 0 }}>Current tasks</h2>
              <span className="chip chip-dim">{tasks.length} open</span>
            </div>
            {tasks.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14 }}>
                All caught up! No open tasks right now.
              </div>
            )}
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid var(--border-strong)', background: 'transparent', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>{t.title}</span>
                <span className={`chip chip-dim`}>{t.due_date || '—'}</span>
                <span className="chip chip-dim">{t.category}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ font: '600 20px var(--font-sans)', margin: 0 }}>Recent activity</h2>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', padding: '20px 0' }}>Activity feed coming soon — your real-time business events will appear here.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
