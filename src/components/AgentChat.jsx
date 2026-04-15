import React, { useState, useRef, useEffect } from 'react';

const TOOLS = [
  { id: 'read_crm', label: 'Read CRM data', icon: '🔍' },
  { id: 'write_crm', label: 'Update CRM records', icon: '✏️' },
  { id: 'create_contacts', label: 'Create contacts/accounts', icon: '➕' },
  { id: 'run_report', label: 'Run Sand report', icon: '📊' },
  { id: 'build_model', label: 'Build Excel/Sheets model', icon: '📈' },
];

const STATUS_COLORS = {
  pending: '#f59e0b', approved: '#3b82f6', running: '#8b5cf6',
  complete: '#10b981', failed: '#ef4444', skipped: '#6b7280',
};

export default function AgentChat({ user }) {
  const [goal, setGoal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [plan, setPlan] = useState(null);
  const [steps, setSteps] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [memory, setMemory] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log, steps]);
  useEffect(() => { if (user) loadMemory(); }, [user]);

  const loadMemory = async () => {
    try {
      const res = await fetch('/api/memory?user_id=' + user.id);
      const data = await res.json();
      setMemory(data.memory);
    } catch {}
  };

  const addLog = (text, type = 'info') =>
    setLog(prev => [...prev, { text, type, ts: new Date().toLocaleTimeString() }]);

  const submitGoal = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true); setSubmitted(true);
    addLog('Analyzing goal and building execution plan...', 'system');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan', goal, user_id: user.id, memory }),
      });
      const data = await res.json();
      setPlan(data.plan);
      setSteps(data.steps.map((s, i) => ({ ...s, id: i, status: 'pending' })));
      addLog('Plan ready. Review each step and approve to execute.', 'system');
    } catch (e) { addLog('Failed to build plan: ' + e.message, 'error'); }
    setLoading(false);
  };

  const approveStep = (id) => setSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  const skipStep = (id) => setSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'skipped' } : s));
  const approveAll = () => setSteps(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'approved' } : s));

  const executeAll = async () => {
    const toRun = steps.filter(s => s.status === 'approved');
    if (!toRun.length) return;
    setRunning(true);
    addLog('Executing ' + toRun.length + ' approved step(s)...', 'system');
    for (const step of toRun) {
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s));
      addLog('Running: ' + step.title, 'run');
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'execute', step, goal, user_id: user.id, memory }),
        });
        const data = await res.json();
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'complete', result: data.result } : s));
        addLog('Done: ' + step.title + ': ' + data.result, 'success');
      } catch (e) {
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'failed' } : s));
        addLog('Failed: ' + step.title + ': ' + e.message, 'error');
      }
    }
    setRunning(false); setDone(true);
    addLog('All steps complete. Updating company memory...', 'system');
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, goal, steps }),
    });
    addLog('Memory updated. Sand-E has learned from this session.', 'system');
  };

  const reset = () => {
    setGoal(''); setSubmitted(false); setPlan(null);
    setSteps([]); setLog([]); setLoading(false); setRunning(false); setDone(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.4px' }}>Sand-E</div>
            <div style={{ fontSize: 12, color: '#888' }}>Autonomous RevOps Agent</div>
          </div>
        </div>
        {memory && (
          <div style={{ fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 12px', display: 'inline-block' }}>
            Company context loaded - {memory.sessions} prior sessions
          </div>
        )}
      </div>
      {!submitted && (
        <div style={{ background: '#fff', border: '1px solid #e8e5de', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>What do you want Sand-E to do?</div>
          <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Clean up contacts missing job titles in HubSpot"
            style={{ width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0ddd6', fontSize: 14, color: '#1a1a1a', background: '#fafaf8', boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#aaa' }}>Sand-E builds a plan for your approval before taking any action.</div>
            <button onClick={submitGoal} disabled={!goal.trim() || loading}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1a1a2e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: goal.trim() ? 'pointer' : 'not-allowed', opacity: goal.trim() ? 1 : 0.5 }}>
              {loading ? 'Planning...' : 'Build Plan'}
            </button>
          </div>
        </div>
      )}
      {submitted && (
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Goal</div>
            <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{goal}</div>
          </div>
          {done && <button onClick={reset} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #444', background: 'transparent', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>New Goal</button>}
        </div>
      )}
      {plan && (
        <div style={{ background: '#f8f7f4', border: '1px solid #e8e5de', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: '#1a1a1a' }}>Plan: </span>{plan}
        </div>
      )}
      {steps.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Execution Plan</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {steps.some(s => s.status === 'pending') && <button onClick={approveAll} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve All</button>}
              {steps.some(s => s.status === 'approved') && !running && !done && <button onClick={executeAll} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#1a1a2e', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{running ? 'Running...' : 'Execute'}</button>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map(step => (
              <div key={step.id} style={{ background: '#fff', border: '1.5px solid ' + (step.status === 'complete' ? 'rgba(16,185,129,0.3)' : step.status === 'failed' ? 'rgba(239,68,68,0.3)' : step.status === 'running' ? 'rgba(139,92,246,0.3)' : '#e8e5de'), borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{TOOLS.find(t => t.id === step.tool)?.icon || '⚙️'}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{step.title}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: STATUS_COLORS[step.status] + '22', color: STATUS_COLORS[step.status], fontWeight: 600 }}>{step.status}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{step.description}</div>
                    {step.result && <div style={{ fontSize: 12, color: '#10b981', marginTop: 6, fontStyle: 'italic' }}>Result: {step.result}</div>}
                  </div>
                  {step.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => approveStep(step.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => skipStep(step.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e0ddd6', background: 'transparent', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>Skip</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {log.length > 0 && (
        <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Execution Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, fontFamily: 'monospace' }}>
                <span style={{ color: '#444', flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ color: entry.type === 'error' ? '#ef4444' : entry.type === 'success' ? '#10b981' : entry.type === 'run' ? '#8b5cf6' : '#6b7280' }}>{entry.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
      {done && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>Mission Complete</div>
          <div style={{ fontSize: 13, color: '#555' }}>Sand-E has updated its memory with learnings from this session.</div>
          <button onClick={reset} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1a1a2e', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Start New Goal</button>
        </div>
      )}
    </div>
  );
}
