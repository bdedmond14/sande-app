import { getHubSpotToken } from './_token.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, search, limit = 50, after } = req.query;
  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const token = await getHubSpotToken(user_id);
    const props = 'firstname,lastname,email,jobtitle,company,phone,hs_lead_status,createdate,lastmodifieddate';

    let url, options;

    if (search) {
      url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
      options = {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [
            { filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: search }] },
            { filters: [{ propertyName: 'firstname', operator: 'CONTAINS_TOKEN', value: search }] },
          ],
          properties: props.split(','),
          limit: parseInt(limit),
        }),
      };
    } else {
      const params = new URLSearchParams({ limit, properties: props, ...(after && { after }) });
      url = `https://api.hubapi.com/crm/v3/objects/contacts?${params}`;
      options = { headers: { Authorization: `Bearer ${token}` } };
    }

    const hsRes = await fetch(url, options);
    const data = await hsRes.json();
    if (!hsRes.ok) throw new Error(data.message || 'HubSpot API error');

    return res.status(200).json({ contacts: data.results, total: data.total, paging: data.paging });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
