import React from 'react';
import { supabase } from './lib/supabase';
import AgentChat from './components/AgentChat';
import LoginPage from './components/LoginPage';

export default function App() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
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

  if (!user) return <LoginPage />;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
      <nav style={{ background: '#0f0f1a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>S</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Sand-E</span>
          <span style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Agent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#555', fontSize: 13 }}>{user.email}</span>
          <button onClick={() => supabase.auth.signOut()}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #2a2a3e', background: 'transparent', color: '#888', fontSize: 12, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </nav>
      <AgentChat user={user} />
    </div>
  );
}
