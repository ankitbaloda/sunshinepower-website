// netlify/functions/wa-flow-service.js
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  // Health check: respond with Base64, not JSON
  if (body && body.action === 'ping') {
    const payload = JSON.stringify({ data: { status: 'active' } });
    const b64 = Buffer.from(payload).toString('base64'); // eyJkYXRhIjogeyJzdGF0dXMiOiAiYWN0aXZlIn19
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: b64
    };
  }

  // (Temporary) also Base64-encode normal replies so the endpoint never errors
  const resp = { version: '3.0', screen: 'SERVICE_SUCCESS', data: { ticket_id: `SV-${Date.now()}` } };
  const b64resp = Buffer.from(JSON.stringify(resp)).toString('base64');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: b64resp
  };
}
