import React from 'react';
import { supabase } from './lib/supabase';
import AgentChat from './components/AgentChat';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#1a1a2e', color: '#ff6b6b', minHeight: '100vh' }}>
          <div style={{ fontSize: 20, marginBottom: 16 }}>Sand-E Error</div>
          <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <pre style={{ fontSize: 11, color: '#888', whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
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

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
        <nav style={{ background: '#0f0f1a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e2e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>S</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Sand-E</span>
            <span style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Agent</span>
          </div>
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
