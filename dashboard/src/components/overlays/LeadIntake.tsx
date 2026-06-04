'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Icon } from '@/components/ui/icons'

// ── Types ────────────────────────────────────────────────────────────────────
interface FormData { [key: string]: string | number }

// ── Meeting picker ────────────────────────────────────────────────────────────
const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

function fmtMeeting(dateStr: string, time: string) {
  if (!dateStr || !time) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
  return `${wd} ${d.getDate()} ${mo} · ${time}`
}

function MeetingPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const base = { background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 13px var(--font-sans)', padding: '10px 12px', outline: 'none', colorScheme: 'dark' as const }

  function update(d: string, t: string) {
    setDate(d); setTime(t)
    onChange(fmtMeeting(d, t))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={date} onChange={e => update(e.target.value, time)}
          style={{ ...base, flex: 1 }}
          onFocus={e => (e.target.style.borderColor = '#cfff3a66')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        <select value={time} onChange={e => update(date, e.target.value)}
          style={{ ...base, width: 130, cursor: 'pointer' }}
          onFocus={e => (e.target.style.borderColor = '#cfff3a66')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
          <option value="">Time…</option>
          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {value && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--lime)' }}>
          <Icon name="calendar" size={12} />Discovery call · {value}
        </span>
      )}
    </div>
  )
}

// ── Scale field ───────────────────────────────────────────────────────────────
function ScaleField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const v = value || 5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <input type="range" min="1" max="10" value={v} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--lime)', cursor: 'pointer' }} />
      <span style={{ fontVariantNumeric: 'tabular-nums', width: 56, textAlign: 'center', fontWeight: 700, fontSize: 14, color: v >= 8 ? 'var(--lime)' : v >= 5 ? 'var(--amber)' : 'var(--text-3)' }}>
        {v}/10
      </span>
    </div>
  )
}

// ── Intake field ──────────────────────────────────────────────────────────────
interface FieldDef { key: string; label: string; type: string; placeholder?: string; required?: boolean; note?: string; options?: string[] }

function IntakeField({ f, value, onChange }: { f: FieldDef; value: string | number; onChange: (k: string, v: string | number) => void }) {
  const base: React.CSSProperties = { width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 13px var(--font-sans)', padding: '10px 12px', outline: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>
          {f.label}{f.required && <span style={{ color: 'var(--lime)' }}> *</span>}
        </label>
        {f.note && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{f.note}</span>}
      </div>
      {f.type === 'area' ? (
        <textarea value={String(value || '')} onChange={e => onChange(f.key, e.target.value)}
          placeholder={f.placeholder} rows={2}
          onFocus={e => (e.target.style.borderColor = '#cfff3a66')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          style={{ ...base, resize: 'vertical', minHeight: 52, lineHeight: 1.45 }} />
      ) : f.type === 'select' ? (
        <select value={String(value || '')} onChange={e => onChange(f.key, e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#cfff3a66')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          style={{ ...base, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === 'scale' ? (
        <ScaleField value={Number(value) || 5} onChange={v => onChange(f.key, v)} />
      ) : f.type === 'meeting' ? (
        <MeetingPicker value={String(value || '')} onChange={v => onChange(f.key, v)} />
      ) : (
        <input
          type={f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text'}
          value={String(value || '')} onChange={e => onChange(f.key, e.target.value)}
          placeholder={f.placeholder}
          onFocus={e => (e.target.style.borderColor = '#cfff3a66')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          style={base} />
      )}
    </div>
  )
}

// ── Booking link generator ────────────────────────────────────────────────────
function bookingLink(form: FormData) {
  const slug = String(form.business || 'lead').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24)
  const token = String(form.business || '' + (form.phone || '')).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36).slice(0, 5)
  return `bizboost.ie/meet/${slug}-${token}`
}

// ── Intro message button ──────────────────────────────────────────────────────
function IntroMessageButton({ form }: { form: FormData }) {
  const need: [string, string][] = [['business','business name'],['person','contact name'],['email','email'],['phone','phone'],['meetingAt','meeting time']]
  const missing = need.filter(([k]) => !form[k]).map(([,l]) => l)
  const ready = missing.length === 0
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function fire() {
    if (!ready || sent) return
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 900)
  }

  const firstName = String(form.person || '').split(' ')[0] || 'there'
  const link = ready ? bookingLink(form) : ''

  return (
    <div style={{ padding: 14, background: sent ? '#25d3661a' : 'var(--bg-2)', border: `1px solid ${sent ? '#25d36644' : 'var(--border)'}`, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ready ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: '#25D366', color: '#0a0a0a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="msg" size={14} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text)' }}>Intro message + booking link</span>
            <span style={{ fontSize: 10.5, color: ready ? 'var(--text-3)' : 'var(--amber)' }}>
              {ready ? 'Custom link generated — fire it now' : 'Add ' + missing.join(', ') + ' to unlock'}
            </span>
          </div>
        </div>
        {sent ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#25d36622', color: '#25D366', fontSize: 12, fontWeight: 600 }}>
            <Icon name="check" size={12} />Sent
          </span>
        ) : (
          <button onClick={fire} disabled={!ready || sending} className={ready ? 'btn btn-primary' : 'btn'}
            style={{ height: 30, opacity: ready ? 1 : 0.5, cursor: ready ? 'pointer' : 'not-allowed' }}>
            {sending ? 'Sending…' : <><Icon name="msg" size={13} />Send now</>}
          </button>
        )}
      </div>
      {ready && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 11px' }}>
            Hi {firstName}, great chatting just now — looking forward to our call <span style={{ color: 'var(--text)', fontWeight: 600 }}>{String(form.meetingAt)}</span>. I'll have your competition pulled apart and a custom plan ready. Confirm + see what to expect here: <span style={{ color: '#cfff3a', fontWeight: 600 }}>{link}</span> — talk soon, Bartek @ BizBoost ⚡
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, border: '1px solid #cfff3a44', color: '#cfff3a', fontSize: 11 }}>
              <Icon name="link" size={11} />{link}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>auto-built from their details</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Submit automation sequence ────────────────────────────────────────────────
const AUTOMATIONS = [
  { id: 'save',     icon: 'inbox',   title: 'Saved to Leads database',      detail: 'Added to pipeline + all views',                color: '#5BCEFA', ms: 500  },
  { id: 'telegram', icon: 'msg',     title: 'Telegram reminder scheduled',  detail: 'Pings you 1h + 10m before the call',           color: '#229ED9', ms: 1100 },
  { id: 'intro',    icon: 'phone',   title: 'Intro + booking link sent',    detail: 'WhatsApp with their custom meeting link',       color: '#25D366', ms: 1700 },
  { id: 'research', icon: 'sparkle', title: 'Research agent dispatched',    detail: 'Deep-mode business + competitor scan',          color: '#8B7CFF', ms: 2400 },
  { id: 'prep',     icon: 'doc',     title: 'Meeting brief generating',     detail: 'Custom plan built from their answers',          color: '#CFFF3A', ms: 3100 },
]

function SubmitSequence({ form, onDone }: { form: FormData; onDone: () => void }) {
  const [done, setDone] = useState<string[]>([])
  const firstName = String(form.person || 'the lead').split(' ')[0]

  useEffect(() => {
    const timers = AUTOMATIONS.map(a => setTimeout(() => setDone(d => [...d, a.id]), a.ms))
    const end = setTimeout(onDone, AUTOMATIONS[AUTOMATIONS.length - 1].ms + 1400)
    return () => { timers.forEach(clearTimeout); clearTimeout(end) }
  }, [onDone])

  const allDone = done.length === AUTOMATIONS.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '8px 4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: '0 0 30px #cfff3a55', marginBottom: 14 }}>
          <Icon name="bolt" size={22} color="#0a0a0a" />
        </span>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>
          {allDone ? <>{form.business} is in <em>motion</em>.</> : <>Firing the <em>machine</em>…</>}
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
          {allDone ? 'Every system kicked off automatically.' : '5 automations running from one submit.'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AUTOMATIONS.map((a, i) => {
          const isDone = done.includes(a.id)
          const isActive = !isDone && done.length === i
          return (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
              background: isDone ? 'var(--bg-2)' : isActive ? '#cfff3a0f' : 'var(--bg-1)',
              border: `1px solid ${isDone ? 'var(--border)' : isActive ? '#cfff3a44' : 'var(--border)'}`,
              opacity: isDone || isActive ? 1 : 0.4, transition: 'all .3s ease',
            }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: isDone ? a.color : 'var(--bg-3)', color: isDone ? '#0a0a0a' : a.color, transition: 'all .3s ease' }}>
                <Icon name={isDone ? 'check' : a.icon} size={14} color={isDone ? '#0a0a0a' : a.color} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{a.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.detail}</span>
              </div>
              {isActive && <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--lime)', animation: 'pulse 1.5s infinite' }} />}
              {isDone && <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 99, background: 'var(--bg-3)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>done</span>}
            </div>
          )
        })}
      </div>

      {allDone && (
        <div style={{ marginTop: 18, animation: 'fadeup .3s ease both' }}>
          <button onClick={onDone} className="btn btn-primary" style={{ width: '100%', height: 42, justifyContent: 'center', fontSize: 14 }}>
            <Icon name="sparkle" size={14} color="#0a0a0a" />See {firstName}&apos;s research dossier
          </button>
        </div>
      )}
    </div>
  )
}

// ── Intake schema ─────────────────────────────────────────────────────────────
const INTAKE_SCHEMA: Array<{ section: string; fields: FieldDef[] }> = [
  { section: 'Contact', fields: [
    { key: 'business', label: 'Business name',    type: 'text',    placeholder: 'e.g. Dunne Roofing',          required: true },
    { key: 'person',   label: 'Contact name',     type: 'text',    placeholder: 'Who you spoke to',            required: true },
    { key: 'email',    label: 'Email',             type: 'email',   placeholder: 'name@business.ie',           required: true },
    { key: 'phone',    label: 'Phone',             type: 'tel',     placeholder: '+353 …',                     required: true, note: 'Needed for the link' },
    { key: 'meetingAt',label: 'Discovery call',   type: 'meeting', required: true },
  ]},
  { section: 'Their world', fields: [
    { key: 'niche',    label: 'Niche',                             type: 'text', placeholder: 'e.g. Roofing' },
    { key: 'area',     label: 'Area covered',                      type: 'text', placeholder: 'e.g. Cork + 30km' },
    { key: 'google',   label: 'Google Business profile',           type: 'url',  placeholder: 'Paste link' },
    { key: 'socials',  label: 'Socials',                           type: 'url',  placeholder: 'IG / FB / TikTok links' },
    { key: 'services', label: 'Services offered',                  type: 'area', placeholder: 'What they sell — most profitable first' },
    { key: 'process',  label: 'Current way they get clients',      type: 'area', placeholder: 'Word of mouth? Ads? Referrals?' },
  ]},
  { section: 'Qualification — the gold', fields: [
    { key: 'dream',    label: 'Their dream client',                type: 'area', placeholder: 'The job they\'d take 10 more of' },
    { key: 'blockers', label: 'What\'s slowing growth',           type: 'area', placeholder: 'Their biggest constraint' },
    { key: 'priority', label: 'How serious on scaling',            type: 'scale' },
    { key: 'change',   label: 'What hitting the goal changes',    type: 'area', placeholder: 'For the business AND their life' },
    { key: 'whynow',   label: 'Why now, not someday',             type: 'area', placeholder: 'The deep why' },
  ]},
]

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; onCreated?: (form: FormData) => void }

export function LeadIntake({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormData>({})
  const [phase, setPhase] = useState<'form' | 'firing'>('form')
  const set = useCallback((k: string, v: string | number) => setForm(f => ({ ...f, [k]: v })), [])

  useEffect(() => { if (open) { setForm({}); setPhase('form') } }, [open])

  if (!open) return null

  const valid = !!(form.business && form.person)

  function submit() {
    if (!valid) return
    setPhase('firing')
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,5,5,0.7)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', paddingTop: '6vh', paddingBottom: '6vh' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: phase === 'firing' ? 520 : 640, maxHeight: '88vh', background: 'var(--bg-1)', border: '1px solid var(--border-strong)', borderRadius: 20, boxShadow: '0 30px 90px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeup .2s ease both' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>
              <Icon name="plus" size={16} color="#0a0a0a" />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>New lead</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Capture → research → meeting → close</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-3)', background: 'transparent' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {phase === 'form' ? (
          <>
            <div style={{ overflowY: 'auto', padding: 22, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {INTAKE_SCHEMA.map((sec, si) => (
                  <div key={sec.section} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: si === 2 ? 'var(--lime)' : 'var(--text-3)' }}>{sec.section}</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    {/* Fields grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: sec.section === 'Contact' ? '1fr 1fr' : '1fr', gap: 12 }}>
                      {sec.fields.map(f => (
                        <div key={f.key} style={{ gridColumn: (f.type === 'area' || f.type === 'scale' || f.type === 'meeting') ? '1 / -1' : 'auto' }}>
                          <IntakeField f={f} value={form[f.key] ?? ''} onChange={set} />
                        </div>
                      ))}
                    </div>
                    {/* Intro message button after Contact section */}
                    {sec.section === 'Contact' && <IntroMessageButton form={form} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-1)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                <span style={{ color: 'var(--lime)', fontWeight: 600 }}>5 automations</span> fire on submit
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} className="btn">Cancel</button>
                <button onClick={submit} disabled={!valid} className="btn btn-primary"
                  style={{ opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>
                  <Icon name="bolt" size={13} color="#0a0a0a" />Submit &amp; dispatch
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ overflowY: 'auto', padding: 22, flex: 1 }}>
            <SubmitSequence form={form} onDone={() => { onClose(); onCreated?.(form) }} />
          </div>
        )}
      </div>
    </div>
  )
}
