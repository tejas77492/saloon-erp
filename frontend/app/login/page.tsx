'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        if (!name) { setError('Name is required.'); setLoading(false); return; }
        user = await register(name, email, password);
      } else {
        user = await login(email, password);
      }
      // Redirect based on role
      if (user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || (mode === 'login' ? 'Login failed.' : 'Registration failed.'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* ── Left branding panel (desktop only) ── */}
      <div className="login-branding" style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '4rem', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(201,168,124,0.08) 0%, rgba(15,15,19,1) 100%)',
        borderRight: '1px solid var(--card-border)',
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-15%', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(201,168,124,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(201,168,124,0.06)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✂️</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Salon<span className="gradient-text">ERP</span></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Premium Grooming Platform</div>
            </div>
          </div>

          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Book your<br /><span className="gradient-text">perfect look.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
            {[
              { icon: '📅', title: 'Easy Booking', desc: 'Choose services, pick a slot, done!' },
              { icon: '🔔', title: 'Real-time Notifications', desc: 'Get alerts on booking updates' },
              { icon: '📋', title: 'Booking History', desc: 'Track all your appointments' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.15rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,124,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="glass fade-in" style={{ width: '100%', maxWidth: 440, padding: '2.5rem', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1rem' }}>✂️</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              {mode === 'login' ? 'Sign in to book appointments' : 'Join to start booking'}
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                  background: mode === m ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent',
                  color: mode === m ? '#1a1208' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Your name" value={name}
                  onChange={e => setName(e.target.value)} required style={{ padding: '0.75rem 1rem' }} />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus style={{ padding: '0.75rem 1rem' }} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6} style={{ padding: '0.75rem 1rem' }} />
            </div>

            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</> : (mode === 'login' ? '→ Sign In' : '→ Create Account')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to Home</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-branding { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
