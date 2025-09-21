// netlify/functions/wa-flow-service.js
// Drop-in, no-npm Node.js crypto helper for WhatsApp Flows v3.0
// Implements RSA-OAEP(SHA-256) unwrap + AES-256-GCM payload decrypt/encrypt

const crypto = require('crypto');

// ===== WhatsApp Flows v3.0 Crypto (no npm) with deep search for AES parts =====
function deepFindB64(obj, keys) {
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (cur && typeof cur === 'object') {
      for (const k of Object.keys(cur)) {
        const v = cur[k];
        if (v && typeof v === 'object') stack.push(v);
      }
      for (const name of keys) {
        if (Object.prototype.hasOwnProperty.call(cur, name) && cur[name] != null) {
          try { return Buffer.from(cur[name], 'base64'); } catch (_) { /* ignore */ }
        }
      }
    }
  }
  return undefined;
}

function parseRawEnvelope(body) {
  // Body might already be JSON or base64(JSON)
  let txt = body;
  try { txt = Buffer.from(body, 'base64').toString('utf8'); } catch (_) { /* not base64 */ }
  try { return JSON.parse(txt); } catch (_) { return null; }
}

function rsaUnwrap(encryptedKeyBuf, rsaPrivateKeyPem) {
  return crypto.privateDecrypt(
    { key: rsaPrivateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    encryptedKeyBuf
  );
}

function aesGcmDecrypt(keyBuf, ivBuf, ctBuf, tagBuf) {
  const dec = crypto.createDecipheriv('aes-256-gcm', keyBuf, ivBuf);
  dec.setAuthTag(tagBuf);
  return Buffer.concat([dec.update(ctBuf), dec.final()]);
}

function aesGcmEncrypt(keyBuf, jsonString) {
  const iv = crypto.randomBytes(12);
  const enc = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  const ct = Buffer.concat([enc.update(Buffer.from(jsonString, 'utf8')), enc.final()]);
  const tag = enc.getAuthTag();
  return {
    iv: iv.toString('base64'),
    ciphertext: ct.toString('base64'),
    tag: tag.toString('base64')
  };
}

// Decrypt request → { msg, keyBuf, rawEnvelope }
function decryptPayload(eventBody, rsaPrivateKeyPem) {
  const rawEnvelope = parseRawEnvelope(eventBody);
  if (!rawEnvelope) return { msg: null, keyBuf: null, rawEnvelope: null, previewLike: true };

  // Try to locate AES parts anywhere in the structure
  const ek = deepFindB64(rawEnvelope, ['encrypted_aes_key','ek','encryptedKey']);
  const iv = deepFindB64(rawEnvelope, ['iv','iv_b64','nonce']);
  const ct = deepFindB64(rawEnvelope, ['ciphertext','ct','encrypted_data','ed']);
  const tag = deepFindB64(rawEnvelope, ['tag','tag_b64','mac','auth_tag']);

  if (!ek || !iv || !ct || !tag) {
    // Likely preview/Actions (no encryption)
    return { msg: rawEnvelope, keyBuf: null, rawEnvelope, previewLike: true };
  }

  const keyBuf = rsaUnwrap(ek, rsaPrivateKeyPem);     // 32 bytes
  const plain = aesGcmDecrypt(keyBuf, iv, ct, tag);
  const msg = JSON.parse(plain.toString('utf8'));
  return { msg, keyBuf, rawEnvelope };
}

function encryptResponse(obj, rawEnvelope, rsaPrivateKeyPem, keyBuf) {
  // If keyBuf not provided, try unwrap again from the same rawEnvelope
  if (!keyBuf) {
    const ek = deepFindB64(rawEnvelope, ['encrypted_aes_key','ek','encryptedKey']);
    if (!ek) throw new Error('No AES key in request');
    keyBuf = rsaUnwrap(ek, rsaPrivateKeyPem);
  }
  const env = aesGcmEncrypt(keyBuf, JSON.stringify(obj));
  return Buffer.from(JSON.stringify(env), 'utf8').toString('base64');
}

function encrypted200(obj, rawEnvelope, rsaPrivateKeyPem, keyBuf) {
  try {
    const b64 = encryptResponse(obj, rawEnvelope, rsaPrivateKeyPem, keyBuf);
    return { statusCode: 200, isBase64Encoded: true, headers: { 'Content-Type': 'application/octet-stream' }, body: b64 };
  } catch (e) {
    // Preview/Actions without AES: return JSON so we don’t 502
    console.warn('encrypted200 fallback:', e.message);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
  }
}

/**
 * Very simple detector for health-check / preview packets.
 */
function isHealthCheckMessage(m) {
  const op = m?.payload?.op || m?.data?.op || m?.op || null;
  return (
    op === 'health_check' ||
    m?.event === 'HEALTH_CHECK' ||
    m?.type === 'HEALTH_CHECK' ||
    (!op && !m?.screen && !m?.fields && !m?.data?.fields)
  );
}
// ===== End helpers =====

const log = (...args) => console.log('[wa-flow-service]', ...args);

exports.handler = async (event) => {
  // Optional: GET ping
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, ping: 'wa-flow alive', now: new Date().toISOString() })
    };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let dec, msg, aesKey, rawEnvelope;
  try {
    dec = decryptPayload(event.body, process.env.WA_PRIVATE_KEY);
    msg = dec.msg;                 // decrypted object (or preview JSON)
    aesKey = dec.keyBuf;           // Buffer(32) if real request; null if preview/health
    rawEnvelope = dec.rawEnvelope; // original raw request envelope to reuse AES parts
  } catch (e) {
    console.error('Decrypt error:', e.message);
    return { statusCode: 400, body: 'Bad Request' };
  }

  // Health check → EXACT payload expected by WhatsApp
  if (isHealthCheckMessage(msg)) {
    return encrypted200({ data: { status: 'active' } }, rawEnvelope || msg, process.env.WA_PRIVATE_KEY, aesKey);
  }

  // Your op routing
  const op = msg?.payload?.op || msg?.data?.op || msg?.op || null;

  // Extract fields tolerantly (depends on your Form name & client)
  const fields =
    msg?.data?.fields ||
    msg?.payload?.fields ||
    msg?.fields ||
    msg?.data?.service_form ||
    msg?.service_form ||
    {};

  const required = ['full_name','mobile','address','village','issue_type','urgency','preferred_date'];
  const missing = required.filter(k => !fields?.[k]);

  if (op === 'submit_service_form' && missing.length === 0) {
    // Forward to Make (optional)
    try {
      if (process.env.MAKE_WEBHOOK_URL) {
        await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'wa-flow',
            fields,
            received_at: new Date().toISOString()
          })
        });
      }
    } catch (e) {
      console.error('Forward to Make failed:', e.message);
      // UX is independent of Make
    }

    // Reply with screen transition (must be encrypted with same session key)
  return encrypted200({ version: '3.0', screen: 'SERVICE_SUCCESS', data: { ok: true } },
            rawEnvelope || msg, process.env.WA_PRIVATE_KEY, aesKey);
  }

  // Missing fields → tell the Preview nicely; real device won’t normally hit this
  return encrypted200({ ok: false, error: 'missing_required_fields', missing },
                      rawEnvelope || msg, process.env.WA_PRIVATE_KEY, aesKey);
};

