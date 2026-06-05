'use client'

import React, { useActionState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { Icon } from '@/components/ui/icons'
import { signIn, type AuthState } from './actions'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, background: 'var(--bg-3)', border: '1px solid var(--border)',
  borderRadius: 9, padding: '0 14px', color: 'var(--text)', font: '400 14px var(--font-sans)', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  display: 'block', font: '500 12px var(--font-sans)', color: 'var(--text-2)', marginBottom: 6,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary"
      style={{ height: 44, fontSize: 14, fontWeight: 600, marginTop: 4, width: '100%', justifyContent: 'center' }}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, { error: null })

  return (
    <div style={{ width: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--lime)', display: 'grid', placeItems: 'center', boxShadow: '0 0 30px #CFFF3A40' }}>
          <Icon name="bolt" size={18} color="#0a0a0a" />
        </div>
        <div>
          <div style={{ font: '700 18px var(--font-sans)', color: 'var(--lime)', letterSpacing: '-0.02em' }}>BizBoost</div>
          <div style={{ font: '500 11px var(--font-sans)', color: 'var(--text-2)' }}>Command Centre</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>Sign in to your command centre</p>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" placeholder="you@bizboost.ie" required autoComplete="email" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input name="password" type="password" placeholder="••••••••" required autoComplete="current-password" style={inputStyle} />
          </div>

          {state.error && (
            <div style={{ background: '#ff6b5c18', border: '1px solid #ff6b5c44', color: 'var(--red)', borderRadius: 9, padding: '10px 12px', fontSize: 13 }}>
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
          Need an admin account?{' '}
          <Link href="/signup" style={{ color: 'var(--lime)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
    </div>
  )
}
