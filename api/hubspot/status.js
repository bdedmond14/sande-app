import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id } = req.query;
  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  const { data } = await supabase
    .from('crm_connections')
    .select('portal_id, portal_domain, connected_at, status, scopes')
    .eq('user_id', user_id)
    .eq('provider', 'hubspot')
    .single();

  if (!data || data.status !== 'active') return res.status(200).json({ connected: false });

  return res.status(200).json({
    connected: true,
    portal: { id: data.portal_id, domain: data.portal_domain },
    connected_at: data.connected_at,
    scopes: data.scopes,
  });
}
