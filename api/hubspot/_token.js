import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getHubSpotToken(user_id) {
  const { data, error } = await supabase
    .from('crm_connections')
    .select('*')
    .eq('user_id', user_id)
    .eq('provider', 'hubspot')
    .single();

  if (error || !data) throw new Error('HubSpot not connected');
  if (data.status !== 'active') throw new Error('HubSpot connection inactive');

  // Refresh 5 min early if needed
  const needsRefresh = new Date(data.expires_at) <= new Date(Date.now() + 5 * 60 * 1000);
  if (!needsRefresh) return data.access_token;

  const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      refresh_token: data.refresh_token,
    }),
  });

  const tokens = await res.json();
  if (!res.ok) throw new Error('Token refresh failed: ' + tokens.message);

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from('crm_connections').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || data.refresh_token,
    expires_at: expiresAt,
  }).eq('user_id', user_id).eq('provider', 'hubspot');

  return tokens.access_token;
}
