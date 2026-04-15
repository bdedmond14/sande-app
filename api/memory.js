import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function summarizeSession(goal, steps) {
  const completedSteps = steps.filter(s => s.status === 'complete');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'You extract concise factual learnings about a company RevOps setup from agent session data. Respond with 2-4 bullet points about what was learned. Be specific and factual. These will be used as context for future agent sessions.',
      messages: [{ role: 'user', content: 'Goal: ' + goal + '\nCompleted steps: ' + completedSteps.map(s => s.title + ': ' + s.result).join('\n') }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export default async function handler(req, res) {
  const { user_id } = req.method === 'GET' ? req.query : req.body;
  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('agent_memory')
      .select('context, sessions, updated_at')
      .eq('user_id', user_id)
      .single();
    return res.status(200).json({ memory: data });
  }

  if (req.method === 'POST') {
    const { goal, steps } = req.body;
    const sessionSummary = await summarizeSession(goal, steps);
    const { data: existing } = await supabase
      .from('agent_memory')
      .select('context, sessions')
      .eq('user_id', user_id)
      .single();

    const newContext = existing
      ? existing.context + '\n\nSession ' + ((existing.sessions || 0) + 1) + ' (' + new Date().toLocaleDateString() + '):\n' + sessionSummary
      : 'Session 1 (' + new Date().toLocaleDateString() + '):\n' + sessionSummary;

    await supabase.from('agent_memory').upsert({
      user_id,
      context: newContext,
      sessions: (existing?.sessions || 0) + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
