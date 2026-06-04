'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/ui/icons'
import type { Client } from '@/types'

interface Props { open: boolean; onClose: () => void; onCreated?: (c: Partial<Client>) => void }

const PLANS = [
  { id: 'starter', label: 'Starter', price: 'Free', desc: 'Up to 3 integrations, basic dashboard', color: 'var(--text-3)' },
  { id: 'growth', label: 'Growth', price: '€698/mo', desc: 'Full suite, priority support, content', color: '#4FE3C1' },
  { id: 'domination', label: 'Domination', price: '€998/mo', desc: 'Everything + dedicated team', color: 'var(--lime)' },
]

const STEPS = ['Business info', 'Services & niche', 'Choose plan', 'Confirm']

export function ClientOnboarding({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('')
  const [city, setCity] = useState('')
  const [niche, setNiche] = useState('')
  const [handle, setHandle] = useState('')
  const [services, setServices] = useState('')
  const [plan, setPlan] = useState('growth')
  const [color, setColor] = useState('#4FE3C1')

  if (!open) return null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }
    const client: Partial<Client> = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name, owner, city, niche, handle,
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      color,
      services: services.split(',').map(s => s.trim()).filter(Boolean),
      health: 70, mrr: plan === 'domination' ? 998 : plan === 'growth' ? 698 : 0,
    }
    onCreated?.(client)
    onClose()
    setStep(0)
  }

  const inputStyle = { width: '100%', height: 40, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', color: 'var(--text)', font: '400 13.5px var(--font-sans)', outline: 'none' }
  const labelStyle = { display: 'block', font: '500 11.5px var(--font-sans)', color: 'var(--text-2)', marginBottom: 5 } as const

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 540, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', borderRadius: 18, boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, #0e1a0e, transparent)' }}>
          <div>
            <div style={{ font: '600 15px var(--font-sans)' }}>Add new client</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* progress bar */}
        <div style={{ height: 3, background: 'var(--bg-3)' }}>
          <div style={{ height: '100%', background: 'var(--lime)', width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width .3s ease', borderRadius: '0 3px 3px 0' }} />
        </div>

        <form onSubmit={onSubmit} style={{ padding: 22 }}>
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Business name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Murphy Plumbing" required style={inputStyle} autoFocus /></div>
                <div><label style={labelStyle}>Owner name</label><input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Liam Murphy" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>City</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="Galway" style={inputStyle} /></div>
                <div><label style={labelStyle}>Website</label><input value={handle} onChange={e => setHandle(e.target.value)} placeholder="murphyplumbing.ie" style={inputStyle} /></div>
              </div>
              <div>
                <label style={labelStyle}>Accent colour</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {['#3FE0A8', '#CFFF3A', '#FFB347', '#5BCEFA', '#8B7CFF', '#FF7A8A', '#4FE3C1', '#FF6B5C', '#FFD66B'].map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Niche</label><input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Plumbing, Dental, Auto Detailing..." style={inputStyle} autoFocus /></div>
              <div>
                <label style={labelStyle}>Services (comma separated)</label>
                <textarea value={services} onChange={e => setServices(e.target.value)} placeholder="Emergency callouts, Boiler install, Bathroom fitouts" rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none' }} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PLANS.map(p => (
                <button key={p.id} type="button" onClick={() => setPlan(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, border: `2px solid ${plan === p.id ? p.color : 'var(--border)'}`, background: plan === p.id ? p.color + '12' : 'var(--bg-3)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${p.color}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {plan === p.id && <div style={{ width: 8, height: 8, borderRadius: 99, background: p.color }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 14px var(--font-sans)', color: p.color }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{p.desc}</div>
                  </div>
                  <div style={{ font: '600 14px var(--font-sans)', color: 'var(--text)', flexShrink: 0 }}>{p.price}</div>
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 16px', background: 'var(--lime-soft)', border: '1px solid #cfff3a40', borderRadius: 12 }}>
                <div style={{ font: '600 14px var(--font-sans)', color: 'var(--lime)', marginBottom: 8 }}>Ready to onboard</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[['Business', name], ['Owner', owner || '—'], ['City', city || '—'], ['Plan', plan.charAt(0).toUpperCase() + plan.slice(1)], ['Niche', niche || '—']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', width: 70 }}>{k}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Confirming will create the client record and trigger the onboarding automation — they'll receive a welcome email and you'll get a Telegram notification.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)} className="btn" style={{ justifyContent: 'center' }}>← Back</button>}
            <button type="button" onClick={onClose} className="btn" style={{ justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: 42 }}>
              {step < STEPS.length - 1 ? 'Continue →' : 'Create client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
