import { getHubSpotToken } from './_token.js';

const OBJECT_URLS = {
  contact: 'https://api.hubapi.com/crm/v3/objects/contacts',
  company: 'https://api.hubapi.com/crm/v3/objects/companies',
  deal: 'https://api.hubapi.com/crm/v3/objects/deals',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, action, object_type, record_id, properties, associations } = req.body;

  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });
  if (!action || !object_type || !properties) return res.status(400).json({ error: 'Missing required fields' });
  if (!OBJECT_URLS[object_type]) return res.status(400).json({ error: 'Invalid object_type' });

  try {
    const token = await getHubSpotToken(user_id);
    const baseUrl = OBJECT_URLS[object_type];
    let hsRes;

    if (action === 'create') {
      hsRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties, ...(associations && { associations }) }),
      });
    } else if (action === 'update') {
      if (!record_id) return res.status(400).json({ error: 'record_id required for update' });
      hsRes = await fetch(`${baseUrl}/${record_id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties }),
      });
    } else if (action === 'batch_create') {
      if (!Array.isArray(properties)) return res.status(400).json({ error: 'properties must be array for batch_create' });
      hsRes = await fetch(`${baseUrl}/batch/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: properties.map(p => ({ properties: p })) }),
      });
    } else if (action === 'batch_update') {
      if (!Array.isArray(properties)) return res.status(400).json({ error: 'properties must be array for batch_update' });
      hsRes = await fetch(`${baseUrl}/batch/update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: properties }),
      });
    } else {
      return res.status(400).json({ error: 'Invalid action. Use: create, update, batch_create, batch_update' });
    }

    const data = await hsRes.json();
    if (!hsRes.ok) throw new Error(data.message || data.errors?.[0]?.message || 'HubSpot write error');

    return res.status(200).json({ ok: true, result: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
