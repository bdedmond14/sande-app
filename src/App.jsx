import React from 'react';
import { supabase } from './lib/supabase';
import AgentChat from './components/AgentChat';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';

// APPROVED USERS — add paying customers here
const APPROVED_EMAILS = [
  'bdedmond14@icloud.com',
];

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#1a1a2e', color: '#ff6b6b', minHeight: '100vh' }}>
          <div style={{ fontSize: 20, marginBottom: 16 }}>Sand-E Error</div>
          <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AccessDenied({ user }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ background: '#16161f', border: '1px solid #1e1e2e', borderRadius: 16, padding: '48px 52px', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #c9a96e, #a07840)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 auto 24px' }}>S</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.3px' }}>Access Restricted</div>
        <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 28 }}>
          Sand-E is currently in private beta.<br />
          Contact us to get access.
        </div>
        <a href="mailto:sales@trysandsoftware.com?subject=Sand-E Access Request" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 16 }}>
          Request Access →
        </a>
        <div style={{ fontSize: 12, color: '#333', marginTop: 8 }}>
          Signed in as {user?.email} · <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Sign out</button>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 12, color: '#333' }}>© {new Date().getFullYear()} Sand Revenue Intelligence</div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('crm_connected')) setShowSettings(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', fontSize: 14, color: '#555' }}>
      Loading Sand-E...
    </div>
  );

  if (!user) return <ErrorBoundary><LoginPage /></ErrorBoundary>;

  // Billing gate — only approved emails get in
  if (!APPROVED_EMAILS.includes(user.email)) {
    return <AccessDenied user={user} />;
  }

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
        <nav style={{ background: '#0f0f1a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e2e' }}>
          <a href="https://trysandsoftware.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>S</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Sand-E</span>
            <span style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Agent</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#555', fontSize: 13 }}>{user.email}</span>
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: '1px solid #2a2a3e', borderRadius: 8, padding: '6px 14px', color: '#888', fontSize: 13, cursor: 'pointer' }}>
              ⚙️ Settings
            </button>
            <button onClick={() => supabase.auth.signOut()} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #2a2a3e', background: 'transparent', color: '#888', fontSize: 12, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </nav>
        <AgentChat user={user} />
        {showSettings && <SettingsPage user={user} onClose={() => setShowSettings(false)} />}
      </div>
    </ErrorBoundary>
  );
}
