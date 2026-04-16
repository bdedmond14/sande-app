import { getHubSpotToken } from './_token.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, stage, owner_id, limit = 100, after } = req.query;
  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const token = await getHubSpotToken(user_id);
    const props = 'dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id,createdate,hs_lastmodifieddate,hs_deal_stage_probability,num_associated_contacts';

    if (stage || owner_id) {
      const filters = [];
      if (stage) filters.push({ propertyName: 'dealstage', operator: 'EQ', value: stage });
      if (owner_id) filters.push({ propertyName: 'hubspot_owner_id', operator: 'EQ', value: owner_id });
      const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterGroups: [{ filters }], properties: props.split(','), limit: parseInt(limit), sorts: [{ propertyName: 'closedate', direction: 'ASCENDING' }] }),
      });
      const data = await hsRes.json();
      if (!hsRes.ok) throw new Error(data.message || 'HubSpot API error');
      return res.status(200).json({ deals: data.results, total: data.total });
    }

    const params = new URLSearchParams({ limit, properties: props, ...(after && { after }) });
    const hsRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await hsRes.json();
    if (!hsRes.ok) throw new Error(data.message || 'HubSpot API error');

    const pipelineRes = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pipelineData = await pipelineRes.json();

    return res.status(200).json({ deals: data.results, total: data.total, paging: data.paging, pipelines: pipelineData.results || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
