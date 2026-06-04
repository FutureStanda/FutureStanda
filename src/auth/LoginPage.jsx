import { useState } from 'react';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await signIn(email, password);
    if (err) {
      setError(err.message || 'Sign in failed. Check your credentials.');
    }
    setLoading(false);
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M54 26 36 56h16l-3 18 22-30H53l4-18Z" fill="#0A0B0A"/>
          </svg>
        </div>
        <h1 className="login-title">BizBoost</h1>
        <p className="login-sub">Command Centre · Sign in to continue</p>

        {error && <div className="login-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              className="login-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <div className="login-foot">
          New to BizBoost? <a href="mailto:hello@bizboost.ie">Contact us</a>
        </div>
      </div>
    </div>
  );
}
