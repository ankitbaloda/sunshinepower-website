// netlify/functions/wa-flow-service.js
const { decryptFlowRequestBody, encryptFlowResponseBody } = require("../lib/waCrypto");

// ---- base64 helpers with proper WA Flows crypto when present ----
function makeCrypto(eventBody) {
  let lastAesKey = null;
  let lastIv = null;

  function tryMetaDecrypt(bodyStr) {
    try {
      const body = JSON.parse(bodyStr || '{}');
      if (body && body.encrypted_aes_key && body.encrypted_flow_data && body.initial_vector) {
        const { clear, aesKey, ivBuf } = decryptFlowRequestBody(bodyStr, process.env.WA_PRIVATE_KEY);
        lastAesKey = aesKey;
        lastIv = ivBuf;
        return clear;
      }
    } catch (_) {}
    return null;
  }

  function decryptIncoming(bodyStr) {
    const meta = tryMetaDecrypt(bodyStr);
    if (meta) return meta; // proper Meta decrypted JSON
    // Fallback for diagnostic: base64(JSON)
    try {
      const utf8 = Buffer.from(bodyStr || '', 'base64').toString('utf8');
      return JSON.parse(utf8);
    } catch (_) {
      // Last resort: raw string body
      return { _raw: (bodyStr || '').slice(0, 2000) };
    }
  }

  function encryptOutgoing(obj) {
    // If we have session key+iv from request, encrypt per Meta rules
    if (lastAesKey && lastIv) {
      return encryptFlowResponseBody(obj, lastAesKey, lastIv);
    }
    // Diagnostic fallback: base64(JSON)
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return Buffer.from(json, 'utf8').toString('base64');
  }

  return { decryptIncoming, encryptOutgoing };
}

const log = (...args) => console.log('[wa-flow-service]', ...args);

// Heuristic health-check detector
const isHealthCheck = (msg) => {
  const op = msg?.payload?.op || msg?.data?.op || msg?.op || null;
  return (
    op === 'health_check' ||
    msg?.event === 'HEALTH_CHECK' ||
    msg?.type === 'HEALTH_CHECK' ||
    (!op && !msg?.screen && !msg?.fields && !msg?.data?.fields)
  );
};

exports.handler = async (event) => {
  // Always log something for ANY hit so you see it in Netlify
  log('REQ', { method: event.httpMethod, path: event.path, isBase64: !!event.isBase64Encoded });
  if (event.body) log('BODY(len)', event.body.length);

  // GET ping for sanity
  if (event.httpMethod === 'GET') {
    log('GET ping ok');
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, ping: 'wa-flow alive', now: new Date().toISOString() }) };
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { decryptIncoming, encryptOutgoing } = makeCrypto(event.body);
  const msg = decryptIncoming(event.body);
  log('DECRYPTED_KEYS', Object.keys(msg || {}));

  // Health check → MUST return { data: { status: 'active' } }
  if (isHealthCheck(msg)) {
    log('Health check detected → responding active');
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: encryptOutgoing({ data: { status: 'active' } }) };
  }

  // Normal submit path
  const op = msg?.payload?.op || msg?.data?.op || msg?.op || null;
  const fields =
    msg?.data?.fields ||
    msg?.payload?.fields ||
    msg?.fields ||
    msg?.data?.service_form ||
    msg?.service_form ||
    {};

  log('OP', op);
  log('FIELDS_KEYS', Object.keys(fields || {}));

  const required = ['full_name','mobile','address','village','issue_type','urgency','preferred_date'];
  const hasUserFields = required.every(k => typeof fields[k] === 'string' && fields[k].trim());

  if (op === 'submit_service_form' && hasUserFields) {
    try {
      if (process.env.MAKE_WEBHOOK_URL) {
        await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'wa-flow', meta: { action: 'data_exchange', screen: 'BOOK_SERVICE', version: '3.0' }, fields, received_at: new Date().toISOString() })
        });
        log('Forwarded to Make OK');
      } else {
        log('MAKE_WEBHOOK_URL not set; skipping forward');
      }
    } catch (e) {
      log('Forward to Make FAILED', e?.message || e);
    }
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: encryptOutgoing({ version: '3.0', screen: 'SERVICE_SUCCESS', data: { ok: true } }) };
  }

  const missing = required.filter(k => !fields?.[k]);
  log('Missing fields', missing);
  return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: encryptOutgoing({ ok: false, error: 'missing_required_fields', missing }) };
};
