import Link from 'next/link'
import { Icon } from '@/components/ui/icons'

// Public sign-up is intentionally disabled.
// The command centre is admin-only, and client logins are created by the admin
// from inside the app. The first admin account is created via the Supabase
// dashboard (Authentication → Users → Add user).
export default function SignupPage() {
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

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Sign-up is closed</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          This is a private workspace. Accounts are created by the BizBoost team — you can&apos;t register yourself.
          If you were given login details, sign in below.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ height: 44, fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
          Go to sign in
        </Link>
      </div>
    </div>
  )
}
