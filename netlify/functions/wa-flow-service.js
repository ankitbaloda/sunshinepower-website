// netlify/functions/wa-flow-service.js
// Drop-in, no-npm Node.js crypto helper for WhatsApp Flows v3.0
// Implements RSA-OAEP(SHA-256) unwrap + AES-256-GCM payload decrypt/encrypt

const crypto = require('crypto');

// ===== WhatsApp Flows v3.0 Crypto (no npm) =====
/**
 * Pick first present key (with optional base64 decoding).
 */
function pick(obj, keys, { b64 = false } = {}) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) {
      return b64 ? Buffer.from(obj[k], 'base64') : obj[k];
    }
  }
  return undefined;
}

/**
 * Parse the incoming base64 body to an "envelope".
 * The envelope is a JSON object that carries the RSA-encrypted AES key and AES-GCM parts.
 */
function parseEnvelopeFromBase64(rawBase64) {
  // Some SDKs send plain JSON (not base64); be tolerant
  let buf;
  try { buf = Buffer.from(rawBase64, 'base64'); } catch (_) { buf = null; }
  const asText = buf ? buf.toString('utf8') : String(rawBase64 || '');
  let env;
  try { env = JSON.parse(asText); }
  catch (e) {
    // If even this fails, surface a minimal object to help with debugging
    return { _raw: rawBase64 };
  }
  return env;
}

/**
 * RSA-OAEP(SHA-256) unwrap for AES key.
 */
function rsaUnwrapAESKey(encryptedKeyBuf, rsaPrivateKeyPem) {
  return crypto.privateDecrypt(
    {
      key: rsaPrivateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    encryptedKeyBuf
  );
}

/**
 * AES-256-GCM decrypt.
 */
function aesGcmDecrypt(keyBuf, ivBuf, ctBuf, tagBuf) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, ivBuf);
  decipher.setAuthTag(tagBuf);
  const plain = Buffer.concat([decipher.update(ctBuf), decipher.final()]);
  return plain;
}

/**
 * AES-256-GCM encrypt (returns { ivB64, ctB64, tagB64 }).
 */
function aesGcmEncrypt(keyBuf, jsonString) {
  const iv = crypto.randomBytes(12); // 96-bit IV is standard for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(jsonString, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ivB64: iv.toString('base64'),
    ctB64: ct.toString('base64'),
    tagB64: tag.toString('base64')
  };
}

/**
 * Decrypt WhatsApp Flow request body (Base64 string) to a JS object.
 * Returns {msg, keyBuf, envelope} on success.
 */
function decryptPayload(rawBase64, rsaPrivateKeyPem) {
  const envelope = parseEnvelopeFromBase64(rawBase64);

  // Common field names (Meta examples & variants)
  const ekBuf = pick(envelope, ['encrypted_aes_key', 'ek', 'aes_key_b64'], { b64: true });
  const ivBuf = pick(envelope, ['iv', 'iv_b64'], { b64: true });
  const ctBuf = pick(envelope, ['ciphertext', 'ct'], { b64: true });
  const tagBuf = pick(envelope, ['tag', 'tag_b64'], { b64: true });

  if (!ekBuf || !ivBuf || !ctBuf || !tagBuf) {
    // Might be a preview/health check sending plain JSON (un-encrypted)
    // Try to parse as already-plain body:
    if (typeof envelope === 'object' && !Buffer.isBuffer(envelope)) {
      return { msg: envelope, keyBuf: null, envelope: null, previewLike: true };
    }
    throw new Error('Malformed envelope: missing ek/iv/ct/tag');
  }

  const aesKey = rsaUnwrapAESKey(ekBuf, rsaPrivateKeyPem);
  if (aesKey.length !== 32) {
    throw new Error('Unexpected AES key length (expected 32 bytes for AES-256)');
  }

  const plaintext = aesGcmDecrypt(aesKey, ivBuf, ctBuf, tagBuf);
  const msg = JSON.parse(plaintext.toString('utf8'));
  return { msg, keyBuf: aesKey, envelope };
}

/**
 * Encrypt a JS object as a WhatsApp Flow response using the SAME AES session key.
 * Returns Base64(JSON{ iv, ciphertext, tag }) string.
 */
function encryptResponse(obj, requestEnvelope, rsaPrivateKeyPem, reusedKeyBuf) {
  // Prefer reusing the already unwrapped AES key (reusedKeyBuf).
  // If not provided, try to unwrap from requestEnvelope again (costly but safe).
  let keyBuf = reusedKeyBuf;
  if (!keyBuf) {
    const ekBuf = pick(requestEnvelope, ['encrypted_aes_key', 'ek', 'aes_key_b64'], { b64: true });
    if (!ekBuf) throw new Error('Cannot re-unwrap AES key: no encrypted key in request envelope');
    keyBuf = rsaUnwrapAESKey(ekBuf, rsaPrivateKeyPem);
  }

  const { ivB64, ctB64, tagB64 } = aesGcmEncrypt(keyBuf, JSON.stringify(obj));

  const responseEnvelope = {
    iv: ivB64,
    ciphertext: ctB64,
    tag: tagB64
  };

  // Return Base64(JSON(envelope)) as required by Flows Data API
  return Buffer.from(JSON.stringify(responseEnvelope), 'utf8').toString('base64');
}

/**
 * Convenience: build a proper Netlify 200 with base64 body.
 */
function encrypted200(obj, requestEnvelope, rsaPrivateKeyPem, keyBuf) {
  const bodyB64 = encryptResponse(obj, requestEnvelope, rsaPrivateKeyPem, keyBuf);
  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bodyB64
  };
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

  let decrypted, msg, aesKey, env;
  try {
    decrypted = decryptPayload(event.body, process.env.WA_PRIVATE_KEY);
    msg = decrypted.msg;           // decrypted object (or preview JSON)
    aesKey = decrypted.keyBuf;     // Buffer(32) if real request; null if preview/health
    env = decrypted.envelope;      // original request envelope used to re-use AES key
  } catch (e) {
    console.error('Decrypt error:', e.message);
    return { statusCode: 400, body: 'Bad Request' };
  }

  // Health check → EXACT payload expected by WhatsApp
  if (isHealthCheckMessage(msg)) {
    return encrypted200({ data: { status: 'active' } }, env || msg, process.env.WA_PRIVATE_KEY, aesKey);
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
                        env || msg, process.env.WA_PRIVATE_KEY, aesKey);
  }

  // Missing fields → tell the Preview nicely; real device won’t normally hit this
  return encrypted200({ ok: false, error: 'missing_required_fields', missing },
                      env || msg, process.env.WA_PRIVATE_KEY, aesKey);
};

