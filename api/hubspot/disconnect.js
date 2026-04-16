import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id } = req.body;
  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data } = await supabase
      .from('crm_connections')
      .select('access_token, refresh_token')
      .eq('user_id', user_id)
      .eq('provider', 'hubspot')
      .single();

    // Revoke refresh token with HubSpot
    if (data?.refresh_token) {
      await fetch(`https://api.hubapi.com/oauth/v1/refresh-tokens/${data.refresh_token}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Basic ' + btoa(`${process.env.HUBSPOT_CLIENT_ID}:${process.env.HUBSPOT_CLIENT_SECRET}`),
        },
      }).catch(() => {}); // Don't fail if revocation fails
    }

    // Mark as disconnected in Supabase
    await supabase
      .from('crm_connections')
      .update({ status: 'disconnected', access_token: null, refresh_token: null })
      .eq('user_id', user_id)
      .eq('provider', 'hubspot');

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
