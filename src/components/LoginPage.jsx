import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState(null);

  const handleSubmit = async () => {
    setError(null); setMsg(null);
    if (!email || (!password && mode !== 'forgot')) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Check your email to confirm your account.');
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setMsg('Password reset email sent.');
        setMode('login');
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const S = {
    page: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' },
    nav: { padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e2e' },
    logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
    logoMark: { width: 32, height: 32, background: 'linear-gradient(135deg, #c9a96e, #a07840)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 },
    logoText: { fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' },
    logoBadge: { background: 'rgba(201,169,110,0.15)', color: '#c9a96e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px', textTransform: 'uppercase' },
    navRight: { fontSize: 13, color: '#555' },
    navLink: { color: '#c9a96e', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontSize: 13 },
    center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
    card: { background: '#16161f', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.4)', padding: '40px 44px', width: '100%', maxWidth: 420, border: '1px solid #1e1e2e' },
    heading: { fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.4px' },
    sub: { fontSize: 13, color: '#555', marginBottom: 28 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #2a2a3e', fontSize: 14, color: '#fff', background: '#0f0f1a', boxSizing: 'border-box', outline: 'none' },
    pwWrap: { position: 'relative' },
    pwToggle: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#555' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px' },
    checkRow: { display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' },
    checkLabel: { fontSize: 13, color: '#555' },
    forgotLink: { fontSize: 13, color: '#c9a96e', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 },
    btn: { width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: '#333', fontSize: 12 },
    divLine: { flex: 1, height: 1, background: '#1e1e2e' },
    googleBtn: { width: '100%', padding: '11px', borderRadius: 8, border: '1.5px solid #2a2a3e', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#aaa', cursor: 'pointer' },
    switchRow: { textAlign: 'center', marginTop: 24, fontSize: 13, color: '#555' },
    error: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', marginBottom: 18 },
    success: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#10b981', marginBottom: 18 },
    footer: { padding: '20px 32px', textAlign: 'center', fontSize: 12, color: '#333', borderTop: '1px solid #1e1e2e' },
    footerLink: { color: '#444', textDecoration: 'none', margin: '0 10px' },
  };

  const titles = { login: 'Sign In', signup: 'Create Account', forgot: 'Reset Password' };
  const subs = { login: 'Welcome to Sand-E Agent', signup: 'Get started with Sand-E', forgot: 'Enter your email for a reset link' };
  const btnLabels = { login: 'Sign In', signup: 'Create Account', forgot: 'Send Reset Link' };

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <a href="https://trysandsoftware.com" style={S.logo}>
          <div style={S.logoMark}>S</div>
          <span style={S.logoText}>Sand-E</span>
          <span style={S.logoBadge}>Agent</span>
        </a>
        <div style={S.navRight}>
          {mode === 'login'
            ? <span>No account? <button style={S.navLink} onClick={() => { setMode('signup'); setError(null); setMsg(null); }}>Sign Up</button></span>
            : <span>Have an account? <button style={S.navLink} onClick={() => { setMode('login'); setError(null); setMsg(null); }}>Sign In</button></span>}
        </div>
      </nav>
      <div style={S.center}>
        <div style={S.card}>
          <div style={S.heading}>{titles[mode]}</div>
          <div style={S.sub}>{subs[mode]}</div>
          {error && <div style={S.error}>⚠️ {error}</div>}
          {msg && <div style={S.success}>✅ {msg}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {mode !== 'forgot' && (
            <div style={{ marginBottom: 4 }}>
              <label style={S.label}>Password</label>
              <div style={S.pwWrap}>
                <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button style={S.pwToggle} onClick={() => setShowPw(p => !p)}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          )}
          {mode === 'login' && (
            <div style={S.row}>
              <div style={S.checkRow} onClick={() => setRemember(r => !r)}>
                <input type="checkbox" checked={remember} onChange={() => {}} style={{ accentColor: '#c9a96e' }} />
                <span style={S.checkLabel}>Remember me</span>
              </div>
              <button style={S.forgotLink} onClick={() => { setMode('forgot'); setError(null); }}>Forgot password?</button>
            </div>
          )}
          {mode !== 'login' && <div style={{ height: 20 }} />}
          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : btnLabels[mode]}
          </button>
          {mode !== 'forgot' && (
            <>
              <div style={S.divider}><div style={S.divLine} /><span>or</span><div style={S.divLine} /></div>
              <button style={S.googleBtn} onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                Continue with Google
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <div style={S.switchRow}>
              <button style={{ ...S.forgotLink, fontWeight: 400, color: '#555' }} onClick={() => setMode('login')}>← Back to Sign In</button>
            </div>
          )}
        </div>
      </div>
      <footer style={S.footer}>
        <span>© {new Date().getFullYear()} Sand Revenue Intelligence</span>
        <a href="https://trysandsoftware.com/terms" style={S.footerLink}>Terms</a>
        <a href="https://trysandsoftware.com/privacy" style={S.footerLink}>Privacy</a>
        <a href="mailto:support@trysandsoftware.com" style={S.footerLink}>Support</a>
      </footer>
    </div>
  );
}
