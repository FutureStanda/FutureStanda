'use client'

import React, { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon } from '@/components/ui/icons'
import { createPortalLogin, type CreateLoginState } from '@/app/dashboard/clients/[id]/portal-actions'

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  for (let i = 0; i < 12; i++) out += chars[arr[i] % chars.length]
  return out
}

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary" style={{ height: 38, justifyContent: 'center' }}>
      {pending ? 'Creating…' : 'Create login'}
    </button>
  )
}

export function PortalAccess({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState('')
  const [state, formAction] = useActionState<CreateLoginState, FormData>(createPortalLogin, { error: null, ok: false })

  useEffect(() => { if (open && !password) setPassword(genPassword()) }, [open, password])

  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal/${clientId}` : `/portal/${clientId}`

  function copy(text: string, tag: string) {
    navigator.clipboard?.writeText(text)
    setCopied(tag)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="btn" style={{ whiteSpace: 'nowrap' }}>
        <Icon name="shield" size={13} />Portal access
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 90, width: 340, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-modal, 0 18px 60px #000b)', padding: 16 }}>
            <div style={{ font: '600 13px var(--font-sans)', marginBottom: 2 }}>Client portal access</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>Create a login for {clientName}. They&apos;ll only see their own portal.</div>

            {/* Shareable link */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Portal link</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input readOnly value={portalUrl} style={inputStyle} onFocus={e => e.currentTarget.select()} />
                <button onClick={() => copy(portalUrl, 'link')} className="btn" style={{ height: 38, flexShrink: 0 }}>
                  {copied === 'link' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '0 0 14px' }} />

            {state.ok ? (
              <div style={{ fontSize: 13, color: 'var(--text)' }}>
                <div style={{ color: 'var(--lime)', fontWeight: 600, marginBottom: 8 }}>✓ Login created for {state.email}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>Share these details with your client. They can change the password after signing in.</div>
                <button onClick={() => copy(`${state.email} · ${password}`, 'creds')} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  {copied === 'creds' ? 'Copied' : 'Copy email + password'}
                </button>
              </div>
            ) : (
              <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="hidden" name="clientId" value={clientId} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Client email</div>
                  <input name="email" type="email" required placeholder="owner@business.ie" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Starter password</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input name="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
                    <button type="button" onClick={() => setPassword(genPassword())} className="btn" style={{ height: 38, flexShrink: 0 }} title="Generate">
                      <Icon name="refresh" size={13} />
                    </button>
                  </div>
                </div>
                {state.error && <div style={{ color: 'var(--red)', fontSize: 12 }}>{state.error}</div>}
                <CreateButton />
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, width: '100%', height: 38, background: 'var(--bg-3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '0 12px', color: 'var(--text)', font: '400 12.5px var(--font-sans)', outline: 'none', minWidth: 0,
}
