export async function handler(event) {
  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;        // you will set this in Netlify
  const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL; // your Apps Script Web App URL

  // Step A: Meta verifies once using GET
  if (event.httpMethod === 'GET') {
    const q = new URLSearchParams(event.rawQuery || '');
    if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === VERIFY_TOKEN) {
      return { statusCode: 200, body: q.get('hub.challenge') };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  // Step B: WhatsApp sends real events via POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const body = JSON.parse(event.body || '{}');
  const rows = [];

  (body.entry || []).forEach(entry => {
    (entry.changes || []).forEach(change => {
      const v = change.value || {};
      const contacts = v.contacts || [];
      const nameOf = wa_id => (contacts.find(c => c.wa_id === wa_id)?.profile?.name) || '';

      // Incoming messages (text, interactive buttons/lists, flows)
      (v.messages || []).forEach(m => {
        const from = m.from;
        rows.push({
          ts: new Date().toISOString(),
          wa_id: from,
          name: nameOf(from),
          type: m.type || '',
          message_id: m.id || '',
          text: m.text?.body || '',
          button_id: m.button?.payload || m.interactive?.button_reply?.id || '',
          button_title: m.button?.text || m.interactive?.button_reply?.title || '',
          list_id: m.interactive?.list_reply?.id || '',
          list_title: m.interactive?.list_reply?.title || '',
          flow_json: m.interactive?.nfm_reply?.response_json || m.interactive?.nfm_reply?.response || ''
        });
      });

      // Delivery / read statuses
      (v.statuses || []).forEach(s => {
        rows.push({
          ts: new Date().toISOString(),
          wa_id: s.recipient_id,
          name: '',
          type: 'status',
          message_id: s.id || '',
          text: '',
          button_id: '',
          button_title: '',
          list_id: '',
          list_title: '',
          flow_json: '',
          status: s.status || '',
          error: s.errors ? JSON.stringify(s.errors) : ''
        });
      });
    });
  });

  // Forward to Google Sheet
  if (rows.length && SHEET_WEBHOOK_URL) {
    await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ rows })
    });
  }

  return { statusCode: 200, body: 'EVENT_RECEIVED' };
}