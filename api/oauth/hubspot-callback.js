import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { code, state: user_id, error } = req.query;

  if (error) return res.redirect(`/app?crm_error=${error}`);
  if (!code || !user_id) return res.status(400).json({ error: 'Missing code or state' });

  try {
    const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
        code,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.message || 'Token exchange failed');

    const portalRes = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + tokens.access_token);
    const portalInfo = await portalRes.json();

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: dbError } = await supabase.from('crm_connections').upsert({
      user_id,
      provider: 'hubspot',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      portal_id: String(portalInfo.hub_id),
      portal_domain: portalInfo.hub_domain,
      scopes: tokens.scope,
      connected_at: new Date().toISOString(),
      status: 'active',
    }, { onConflict: 'user_id,provider' });

    if (dbError) throw dbError;

    return res.redirect('/app?crm_connected=hubspot');
  } catch (e) {
    console.error('HubSpot OAuth error:', e);
    return res.redirect(`/app?crm_error=${encodeURIComponent(e.message)}`);
  }
}
