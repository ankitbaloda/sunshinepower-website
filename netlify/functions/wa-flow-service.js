// netlify/functions/wa-flow-service.js
export async function handler(event) {
  // WhatsApp sends POST; reject others
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}

  // Health check from WhatsApp
  if (body && body.action === 'ping') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { status: 'active' } })
    };
  }

  // Placeholder for real submissions (for now just OK)
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: '3.0',
      screen: 'SERVICE_SUCCESS',
      data: { ticket_id: `SV-${Date.now()}` }
    })
  };
}
