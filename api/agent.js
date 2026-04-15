import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PLAN = `You are Sand-E, an autonomous Revenue Operations agent. You are expert in CRM management, sales operations, pipeline analysis, and revenue modeling.

When given a goal, produce a structured execution plan. Respond ONLY with valid JSON in this exact format:
{
  "plan": "One sentence describing the overall approach",
  "steps": [
    {
      "title": "Short step title",
      "description": "What this step will do and why",
      "tool": "read_crm|write_crm|create_contacts|run_report|build_model",
      "params": {}
    }
  ]
}

Rules:
- Maximum 6 steps per plan
- Each step must use exactly one tool
- Steps must be in logical execution order
- Be specific about what data will be read or written
- params should include relevant details like entity type, filters, fields`;

const SYSTEM_EXECUTE = `You are Sand-E, an autonomous Revenue Operations agent executing a specific step.

Simulate the execution of the given step realistically. Respond with a brief, specific result message (1-2 sentences) describing what was done. Be concrete — mention record counts, field names, values updated, etc.

Note: CRM writes are currently in simulation mode until OAuth connectors are fully wired. Clearly indicate simulated actions.`;

async function callClaude(system, messages, max_tokens = 1024) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens, system, messages }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, goal, step, user_id, memory } = req.body;

  if (action === 'plan') {
    const memoryContext = memory
      ? 'Company context from previous sessions: ' + memory.context
      : '';

    const raw = await callClaude(
      SYSTEM_PLAN + (memoryContext ? '\n\n' + memoryContext : ''),
      [{ role: 'user', content: 'Goal: ' + goal }],
      1024
    );

    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({ error: 'Failed to parse plan', raw });
    }
  }

  if (action === 'execute') {
    const prompt = 'Goal: ' + goal + '\n\nStep: ' + step.title + '\nDescription: ' + step.description + '\nTool: ' + step.tool;
    const result = await callClaude(SYSTEM_EXECUTE, [{ role: 'user', content: prompt }], 256);

    await supabase.from('agent_runs').insert({
      user_id, goal, step_title: step.title, tool: step.tool, result, status: 'complete',
    });

    return res.status(200).json({ result });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
