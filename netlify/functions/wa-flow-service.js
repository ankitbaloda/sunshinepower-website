// netlify/functions/wa-flow-service.js
const crypto = require('node:crypto');
const fetch = require('node-fetch'); // Netlify has it; if not, add to package.json

// --------------- helpers ---------------
const b64 = (s) => Buffer.from(s, 'base64');
const toB64 = (buf) => Buffer.from(buf).toString('base64');
const invertIv = (ivBuf) => Buffer.from(ivBuf.map(b => b ^ 0xff));

function getPrivateKey() {
  const key = process.env.WA_PRIVATE_KEY;
  if (!key) throw new Error('WA_PRIVATE_KEY missing');
  const passphrase = process.env.WA_PRIVATE_KEY_PASSPHRASE || undefined;
  return crypto.createPrivateKey({ key, passphrase });
}

function decryptRequest(body) {
  const { encrypted_flow_data, encrypted_aes_key, initial_vector } = body;
  const priv = getPrivateKey();

  // 1) RSA-OAEP-SHA256 to get AES key
  const aesKey = crypto.privateDecrypt(
    { key: priv, oaepHash: 'sha256' },
    b64(encrypted_aes_key)
  );

  // 2) AES-256-GCM to get JSON payload
  const enc = b64(encrypted_flow_data);
  const iv = b64(initial_vector);
  const tag = enc.slice(enc.length - 16);
  const ciphertext = enc.slice(0, -16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);

  const clear = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const json = JSON.parse(clear.toString('utf8'));
  return { json, aesKey, iv };
}

function encryptResponse(obj, aesKey, ivIn) {
  const ivOut = invertIv(ivIn); // per spec for response
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, ivOut);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([enc, tag]);
  return { encrypted_response: toB64(payload) };
}

// --------------- Google Sheet via Make.com (easy path) ---------------
async function forwardToMake(payload) {
  const url = process.env.MAKE_WEBHOOK_URL; // create this in Part 5
  if (!url) return { ok: true, skipped: true };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

// --------------- Netlify handler ---------------
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'access-control-allow-origin': '*' } };
  }

  // Health check from Flow Builder sometimes sends a simple POST without encryption.
  // We'll accept both cases.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'OK' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad JSON' }; }

  // If this looks like a plain health probe, just OK
  if (!body.encrypted_flow_data) {
    // Minimal success response that Flow Builder accepts:
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version: '3.0', screen: 'SERVICE_SUCCESS', data: { ok: true } }),
    };
  }

  try {
  const { json, aesKey, iv } = decryptRequest(body);
  console.log("DECRYPTED CLEAR:", JSON.stringify(json, null, 2));
    // json looks like:
    // { version:'3.0', action:'data_exchange'|'init'|'back', screen:'BOOK_SERVICE', flow_token:'...', data:{...form fields...}}

    // 1) INIT → tell Flow which screen to show
    if (json.action === 'init') {
      const reply = { version: json.version || '3.0', screen: 'BOOK_SERVICE', data: {} };
      return { statusCode: 200, body: JSON.stringify(encryptResponse(reply, aesKey, iv)) };
    }

    // 2) DATA_EXCHANGE from Submit → save to sheet
    if (json.action === 'data_exchange') {
      const d = json.data || {};
      const row = {
        timestamp: new Date().toISOString(),
        full_name: d.full_name || '',
        mobile: d.mobile || '',
        address: d.address || '',
        village: d.village || '',
        issue_type: d.issue_type || '',
        urgency: d.urgency || '',
        preferred_date: d.preferred_date || '',
        wa_msisdn: json.user?.phone || '',
        flow_token: json.flow_token || '',
      };

      await forwardToMake(row);

      const reply = { version: json.version || '3.0', screen: 'SERVICE_SUCCESS', data: { ok: true } };
      return { statusCode: 200, body: JSON.stringify(encryptResponse(reply, aesKey, iv)) };
    }

    // 3) BACK or anything else → just re-show main form
    const reply = { version: json.version || '3.0', screen: 'BOOK_SERVICE', data: {} };
    return { statusCode: 200, body: JSON.stringify(encryptResponse(reply, aesKey, iv)) };
  } catch (e) {
    console.error('FLOW ERROR', e);
    // Show a friendly error screen if something goes wrong
    const fallback = { version: '3.0', screen: 'BOOK_SERVICE', data: { ok: false, error: 'server_error' } };

    try {
      // If we still have aesKey/iv in scope, we would encrypt. If not, send plain JSON so Builder at least shows *something* during tests.
      return { statusCode: 200, body: JSON.stringify(fallback) };
    } catch {
      return { statusCode: 500, body: 'Server error' };
    }
  }
};