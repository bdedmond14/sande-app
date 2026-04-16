import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function IntegrationsPage({ user }) {
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkConnections(); }, []);

  const checkConnections = async () => {
    try {
      const res = await fetch(`/api/hubspot/status?user_id=${user.id}`);
      const data = await res.json();
      setConnections(prev => ({ ...prev, hubspot: data.connected }));
    } catch {}
    setLoading(false);
  };

  const connect = (provider) => { window.location.href = `/api/oauth/${provider}?user_id=${user.id}`; };

  const disconnect = async (provider) => {
    if (!window.confirm(`Disconnect ${provider}?`)) return;
    await fetch(`/api/${provider}/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) });
    setConnections(prev => ({ ...prev, [provider]: false }));
  };

  const connectors = [
    { id: 'hubspot', name: 'HubSpot', icon: '🟠', color: '#ff7a59', desc: 'Read and write contacts, deals, companies, and activities', capabilities: ['Read contacts & companies', 'Read & update deals', 'Create new records', 'Bulk operations'], available: true },
    { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: '#00a1e0', desc: 'Connect to your Salesforce org for full CRM read/write access', capabilities: ['Leads, contacts, accounts', 'Opportunities & pipeline', 'Reports & dashboards', 'Custom objects'], available: false, comingSoon: true },
    { id: 'snowflake', name: 'Snowflake', icon: '❄️', color: '#29b5e8', desc: 'Query your data warehouse for revenue analytics and modeling', capabilities: ['Run SQL queries', 'Build revenue models', 'Export to Excel/Sheets', 'Scheduled pulls'], available: false, comingSoon: true },
    { id: 'csv', name: 'CSV Upload', icon: '📄', color: '#6b7280', desc: 'Upload CSV files for Sand-E to analyze and act on', capabilities: ['Contact imports', 'Deal data', 'Account lists', 'Custom data sets'], available: true, noOauth: true },
  ];

  const S = {
    header: { marginBottom: 32 },
    title: { fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 6, letterSpacing: '-0.4px' },
    sub: { fontSize: 14, color: '#888' },
    grid: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { background: '#fff', border: '1px solid #e8e5de', borderRadius: 14, padding: '24px 28px' },
    cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
    cardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
    connName: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 },
    connDesc: { fontSize: 13, color: '#666', lineHeight: 1.5 },
    caps: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    cap: { fontSize: 12, color: '#555', background: '#f5f4f0', padding: '4px 10px', borderRadius: 20 },
    connectedBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 8 },
    comingSoon: { padding: '9px 16px', borderRadius: 8, border: '1px solid #e0ddd6', background: '#f9f9f9', color: '#bbb', fontSize: 12, cursor: 'default', whiteSpace: 'nowrap' },
    disconnectBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #e0ddd6', background: 'transparent', color: '#aaa', fontSize: 12, cursor: 'pointer' },
  };

  const connectBtn = (color) => ({ padding: '9px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' });
  const iconStyle = (color) => ({ width: 44, height: 44, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 });

  return (
    <div>
      <div style={S.header}>
        <div style={S.title}>Integrations</div>
        <div style={S.sub}>Connect Sand-E to your CRM and data sources to enable real execution.</div>
      </div>
      <div style={S.grid}>
        {connectors.map(conn => (
          <div key={conn.id} style={S.card}>
            <div style={S.cardTop}>
              <div style={S.cardLeft}>
                <div style={iconStyle(conn.color)}>{conn.icon}</div>
                <div>
                  <div style={S.connName}>{conn.name}</div>
                  <div style={S.connDesc}>{conn.desc}</div>
                  {connections[conn.id] && <div style={{ marginTop: 8 }}><span style={S.connectedBadge}>&#10003; Connected</span></div>}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {conn.comingSoon && <div style={S.comingSoon}>Coming Soon</div>}
                {conn.noOauth && !conn.comingSoon && <button style={connectBtn('#6b7280')} onClick={() => alert('CSV upload coming soon!')}>Upload CSV</button>}
                {!conn.noOauth && !conn.comingSoon && (
                  connections[conn.id]
                    ? <button style={S.disconnectBtn} onClick={() => disconnect(conn.id)}>Disconnect</button>
                    : <button style={connectBtn(conn.color)} onClick={() => connect(conn.id)}>Connect {conn.name} &rarr;</button>
                )}
              </div>
            </div>
            <div style={S.caps}>{conn.capabilities.map((c, i) => <span key={i} style={S.cap}>&#10003; {c}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', company: '', title: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const meta = user.user_metadata || {};
    setForm({ firstName: meta.first_name || '', lastName: meta.last_name || '', company: meta.company || '', title: meta.title || '', phone: meta.phone || '' });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { first_name: form.firstName, last_name: form.lastName, company: form.company, title: form.title, phone: form.phone } });
    setSaved(true); setTimeout(() => setSaved(false), 3000); setSaving(false);
  };

  const S = {
    title: { fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 32, letterSpacing: '-0.4px' },
    card: { background: '#fff', border: '1px solid #e8e5de', borderRadius: 14, padding: '32px 36px', maxWidth: 640 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
    field: { marginBottom: 20 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 },
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0ddd6', fontSize: 14, color: '#1a1a1a', background: '#fafaf8', boxSizing: 'border-box', outline: 'none' },
    emailField: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0ddd6', fontSize: 14, color: '#aaa', background: '#f5f5f5', boxSizing: 'border-box' },
    btn: { padding: '10px 28px', borderRadius: 8, border: 'none', background: '#c9a96e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    savedMsg: { fontSize: 13, color: '#10b981', marginLeft: 12 },
  };

  return (
    <div>
      <div style={S.title}>My Profile</div>
      <div style={S.card}>
        <div style={S.row}>
          <div><label style={S.label}>First Name</label><input style={S.input} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" /></div>
          <div><label style={S.label}>Last Name</label><input style={S.input} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" /></div>
        </div>
        <div style={S.field}><label style={S.label}>Email</label><div style={S.emailField}>{user.email}</div></div>
        <div style={S.field}><label style={S.label}>Company</label><input style={S.input} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Your company" /></div>
        <div style={S.field}><label style={S.label}>Title</label><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Head of Revenue Operations" /></div>
        <div style={S.field}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 555-5555" type="tel" /></div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={S.btn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          {saved && <span style={S.savedMsg}>&#10003; Saved</span>}
        </div>
      </div>
    </div>
  );
}

function BillingPage({ user }) {
  const PLANS = { starter: { name: 'Sand Starter', price: 99 }, pro: { name: 'Sand Pro', price: 699 }, agent: { name: 'Sand-E Agent', price: 2500 } };
  const [account, setAccount] = useState(null);
  useEffect(() => { supabase.from('accounts').select('*').eq('user_id', user.id).single().then(({ data }) => setAccount(data)); }, []);
  const plan = account?.plan ? PLANS[account.plan] : PLANS.agent;
  const contractStart = account?.contract_start ? new Date(account.contract_start) : new Date();
  const contractEnd = new Date(contractStart); contractEnd.setFullYear(contractEnd.getFullYear() + 1);
  const nextRate = (plan.price * 1.02).toFixed(2);
  const S = {
    title: { fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 32, letterSpacing: '-0.4px' },
    card: { background: '#fff', border: '1px solid #e8e5de', borderRadius: 14, padding: '32px 36px', maxWidth: 640, marginBottom: 20 },
    planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    planName: { fontSize: 20, fontWeight: 800, color: '#1a1a1a' },
    planBadge: { background: 'rgba(201,169,110,0.12)', color: '#c9a96e', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
    row: { display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f0ede6' },
    rowLabel: { fontSize: 14, color: '#666' },
    rowValue: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
    alert: { background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#8a6d3b', lineHeight: 1.6 },
    contactBtn: { marginTop: 24, padding: '10px 24px', borderRadius: 8, border: '1px solid #e0ddd6', background: 'transparent', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  };
  return (
    <div>
      <div style={S.title}>Billing</div>
      <div style={S.card}>
        <div style={S.planHeader}><div style={S.planName}>{plan.name}</div><div style={S.planBadge}>Active</div></div>
        <div style={S.row}><span style={S.rowLabel}>Current Monthly Rate</span><span style={S.rowValue}>${plan.price.toLocaleString()}/mo</span></div>
        <div style={S.row}><span style={S.rowLabel}>Contract Start</span><span style={S.rowValue}>{contractStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
        <div style={S.row}><span style={S.rowLabel}>Contract End / Next Renewal</span><span style={S.rowValue}>{contractEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
        <div style={S.row}><span style={S.rowLabel}>Minimum Commitment</span><span style={S.rowValue}>12 months</span></div>
        <div style={S.row}><span style={S.rowLabel}>Rate at Next Renewal</span><span style={S.rowValue}>${parseFloat(nextRate).toLocaleString()}/mo (+2%)</span></div>
        <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.rowLabel}>Cancellation Notice Required</span><span style={S.rowValue}>30 days prior to renewal</span></div>
      </div>
      <div style={S.alert}>&#128203; Your subscription auto-renews annually with a 2% price increase. To cancel, send written notice 30 days before renewal to <a href="mailto:support@trysandsoftware.com" style={{ color: '#c9a96e' }}>support@trysandsoftware.com</a>.</div>
      <button style={S.contactBtn} onClick={() => window.location.href = 'mailto:support@trysandsoftware.com?subject=Billing Question'}>Contact Support</button>
    </div>
  );
}

function NotificationsPage() {
  const [prefs, setPrefs] = useState({ emailReports: true, slackReports: false, renewalReminders: true, agentSummaries: true });
  const [saved, setSaved] = useState(false);
  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const items = [
    { key: 'emailReports', label: 'Email Report Delivery', desc: 'Receive scheduled reports via email' },
    { key: 'slackReports', label: 'Slack Report Delivery', desc: 'Receive scheduled reports in Slack' },
    { key: 'agentSummaries', label: 'Agent Execution Summaries', desc: 'Email summary after each Sand-E session' },
    { key: 'renewalReminders', label: 'Renewal Reminders', desc: '45-day and 30-day notice before contract renewal' },
  ];
  const S = {
    title: { fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 32, letterSpacing: '-0.4px' },
    card: { background: '#fff', border: '1px solid #e8e5de', borderRadius: 14, padding: '32px 36px', maxWidth: 640 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 },
    rowLabel: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 },
    rowDesc: { fontSize: 12, color: '#888' },
    btn: { marginTop: 24, padding: '10px 28px', borderRadius: 8, border: 'none', background: '#c9a96e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    savedMsg: { fontSize: 13, color: '#10b981', marginLeft: 12 },
  };
  const toggleStyle = (on) => ({ width: 40, height: 22, borderRadius: 11, background: on ? '#c9a96e' : '#ddd', position: 'relative', cursor: 'pointer', border: 'none', flexShrink: 0 });
  const dotStyle = (on) => ({ position: 'absolute', top: 3, left: on ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' });
  return (
    <div>
      <div style={S.title}>Notifications</div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Delivery Preferences</div>
        {items.map((item, i) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < items.length - 1 ? '1px solid #f0ede6' : 'none' }}>
            <div><div style={S.rowLabel}>{item.label}</div><div style={S.rowDesc}>{item.desc}</div></div>
            <button style={toggleStyle(prefs[item.key])} onClick={() => toggle(item.key)}><div style={dotStyle(prefs[item.key])} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={S.btn} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>Save Preferences</button>
          {saved && <span style={S.savedMsg}>&#10003; Saved</span>}
        </div>
      </div>
    </div>
  );
}

function AccountPage({ user }) {
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const handlePasswordChange = async () => {
    if (newPw.length < 8) return setMsg({ ok: false, text: 'Password must be at least 8 characters.' });
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Password updated successfully.' });
    setSaving(false); setNewPw('');
  };
  const S = {
    title: { fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 32, letterSpacing: '-0.4px' },
    card: { background: '#fff', border: '1px solid #e8e5de', borderRadius: 14, padding: '32px 36px', maxWidth: 640, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 },
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0ddd6', fontSize: 14, color: '#1a1a1a', background: '#fafaf8', boxSizing: 'border-box', outline: 'none', marginBottom: 16 },
    btn: { padding: '10px 28px', borderRadius: 8, border: 'none', background: '#c9a96e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    dangerCard: { background: '#fff', border: '1px solid #fecaca', borderRadius: 14, padding: '32px 36px', maxWidth: 640 },
    dangerTitle: { fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 },
    dangerDesc: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 },
    dangerBtn: { padding: '10px 28px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  };
  return (
    <div>
      <div style={S.title}>My Account</div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Change Password</div>
        <label style={S.label}>New Password</label>
        <input style={S.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="8+ characters" />
        <button style={S.btn} onClick={handlePasswordChange} disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
        {msg && <div style={{ fontSize: 13, color: msg.ok ? '#10b981' : '#ef4444', marginTop: 12 }}>{msg.ok ? '&#10003;' : '&#9888;'} {msg.text}</div>}
      </div>
      <div style={S.dangerCard}>
        <div style={S.dangerTitle}>Danger Zone</div>
        <div style={S.dangerDesc}>To cancel your subscription or request account deletion, contact us at <a href="mailto:support@trysandsoftware.com" style={{ color: '#c9a96e' }}>support@trysandsoftware.com</a>. Cancellations require 30 days written notice prior to renewal.</div>
        <button style={S.dangerBtn} onClick={() => window.location.href = 'mailto:support@trysandsoftware.com?subject=Cancellation Request'}>Request Cancellation</button>
      </div>
    </div>
  );
}

export default function SettingsPage({ user, onClose }) {
  const [activePage, setActivePage] = useState('integrations');
  const NAV = [
    { section: 'General Settings', items: [{ id: 'integrations', label: 'Integrations' }, { id: 'billing', label: 'Billing' }, { id: 'notifications', label: 'Notifications' }] },
    { section: 'Personal Settings', items: [{ id: 'profile', label: 'My Profile' }, { id: 'account', label: 'My Account' }] },
  ];
  const PAGES = { integrations: <IntegrationsPage user={user} />, billing: <BillingPage user={user} />, notifications: <NotificationsPage />, profile: <ProfilePage user={user} />, account: <AccountPage user={user} /> };
  const initials = ((user.user_metadata?.first_name?.[0] || '') + (user.user_metadata?.last_name?.[0] || '')) || user.email?.[0]?.toUpperCase() || 'U';
  const displayName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || user.email;
  const S = {
    overlay: { position: 'fixed', inset: 0, zIndex: 2000, display: 'flex' },
    sidebar: { width: 240, background: '#0f0f1a', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    sidebarTop: { padding: '24px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    sidebarTitle: { fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' },
    closeBtn: { background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', lineHeight: 1 },
    nav: { flex: 1, padding: '8px 0', overflowY: 'auto' },
    sectionLabel: { fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 20px 6px' },
    userCard: { margin: 12, background: '#161625', borderRadius: 10, padding: '12px 14px' },
    userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#c9a96e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 },
    userName: { fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 },
    userEmail: { fontSize: 11, color: '#555', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    signOutBtn: { width: '100%', padding: '7px', borderRadius: 7, border: '1px solid #2a2a3e', background: 'transparent', color: '#666', fontSize: 12, cursor: 'pointer', textAlign: 'center' },
    main: { flex: 1, background: '#f5f4f0', overflowY: 'auto', padding: '48px 52px' },
  };
  const navItemStyle = (active) => ({ display: 'block', width: '100%', textAlign: 'left', padding: '9px 20px', fontSize: 14, color: active ? '#fff' : '#888', background: active ? 'rgba(201,169,110,0.15)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: active ? 600 : 400, borderLeft: active ? '3px solid #c9a96e' : '3px solid transparent' });
  return (
    <div style={S.overlay}>
      <div style={S.sidebar}>
        <div style={S.sidebarTop}>
          <span style={S.sidebarTitle}>Settings</span>
          <button style={S.closeBtn} onClick={onClose}>&#10005;</button>
        </div>
        <nav style={S.nav}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={S.sectionLabel}>{group.section}</div>
              {group.items.map(item => <button key={item.id} style={navItemStyle(activePage === item.id)} onClick={() => setActivePage(item.id)}>{item.label}</button>)}
            </div>
          ))}
        </nav>
        <div style={S.userCard}>
          <div style={S.userAvatar}>{initials}</div>
          <div style={S.userName}>{displayName}</div>
          <div style={S.userEmail}>{user.email}</div>
          <button style={S.signOutBtn} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </div>
      <div style={S.main}>{PAGES[activePage]}</div>
    </div>
  );
}
