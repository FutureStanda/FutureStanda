'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/ui/icons'

interface Props { open: boolean; onClose: () => void; onCreated?: () => void }

export function LeadIntake({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({ business: '', person: '', phone: '', email: '', niche: '', area: '', priority: '7' })

  if (!open) return null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < 2) { setStep(2); return }
    onCreated?.()
    onClose()
    setStep(1)
    setData({ business: '', person: '', phone: '', email: '', niche: '', area: '', priority: '7' })
  }

  const inputStyle = { width: '100%', height: 40, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', color: 'var(--text)', font: '400 13.5px var(--font-sans)', outline: 'none' }
  const labelStyle = { display: 'block', font: '500 11.5px var(--font-sans)', color: 'var(--text-2)', marginBottom: 5 } as const

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 520, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', borderRadius: 18, boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, #0e1a10, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#5BCEFA22', border: '1px solid #5BCEFA44', color: '#5BCEFA', display: 'grid', placeItems: 'center' }}>
              <Icon name="inbox" size={16} />
            </span>
            <div>
              <div style={{ font: '600 14px var(--font-sans)' }}>New lead intake</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>Step {step} of 2</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Business name *</label>
                  <input value={data.business} onChange={e => setData(d => ({ ...d, business: e.target.value }))} placeholder="Acme Plumbing" required style={inputStyle} autoFocus />
                </div>
                <div>
                  <label style={labelStyle}>Contact name</label>
                  <input value={data.person} onChange={e => setData(d => ({ ...d, person: e.target.value }))} placeholder="John Smith" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={data.phone} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} placeholder="+353 87..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={data.email} onChange={e => setData(d => ({ ...d, email: e.target.value }))} placeholder="john@acme.ie" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Niche</label>
                  <input value={data.niche} onChange={e => setData(d => ({ ...d, niche: e.target.value }))} placeholder="Plumbing, Dental..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Area</label>
                  <input value={data.area} onChange={e => setData(d => ({ ...d, area: e.target.value }))} placeholder="Dublin, Cork..." style={inputStyle} />
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ padding: '14px 16px', background: 'var(--lime-soft)', border: '1px solid #cfff3a40', borderRadius: 12 }}>
                <div style={{ font: '600 13px var(--font-sans)', color: 'var(--lime)', marginBottom: 4 }}>Lead added: {data.business}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Contact: {data.person || '—'} · {data.niche || '—'} · {data.area || '—'}</div>
              </div>
              <div style={{ padding: '14px 16px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Automations triggered</div>
                {['Saved to CRM', 'Telegram notification sent', 'Research agent queued', 'Intro message sent'].map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--lime-soft)', color: 'var(--lime)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="check" size={11} />
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{a}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {step > 1 && <button type="button" onClick={() => setStep(1)} className="btn" style={{ justifyContent: 'center' }}>Back</button>}
            <button type="button" onClick={onClose} className="btn" style={{ justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: 40 }}>
              {step < 2 ? 'Continue →' : 'Done'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
