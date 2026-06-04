'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icons'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    router.push('/dashboard/briefing')
  }

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
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Create account</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>Set up your command centre</p>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', font: '500 12px var(--font-sans)', color: 'var(--text-2)', marginBottom: 6 }}>Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Bartek Standa" required style={{ width: '100%', height: 42, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 14px', color: 'var(--text)', font: '400 14px var(--font-sans)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', font: '500 12px var(--font-sans)', color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@bizboost.ie" required style={{ width: '100%', height: 42, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 14px', color: 'var(--text)', font: '400 14px var(--font-sans)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', font: '500 12px var(--font-sans)', color: 'var(--text-2)', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={{ width: '100%', height: 42, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 14px', color: 'var(--text)', font: '400 14px var(--font-sans)', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: 44, fontSize: 14, fontWeight: 600, marginTop: 4, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--lime)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
