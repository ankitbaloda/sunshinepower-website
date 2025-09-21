// netlify/functions/wa-flow-service.js
// Drop-in, no-npm Node.js crypto helper for WhatsApp Flows v3.0
// Implements RSA-OAEP(SHA-256) unwrap + AES-256-GCM payload decrypt/encrypt

const crypto = require('crypto');

// Pretty log head helper
const head = (s, n = 200) => (s || '').slice(0, n);

// Try to parse Base64(JSON) else plain JSON → object | null
function parsePossiblyBase64JSON(body) {
  let txt = body;
  try { txt = Buffer.from(body, 'base64').toString('utf8'); } catch (_) {}
  try { return JSON.parse(txt); } catch (_) { return null; }
}

// Walk recursively all sub-objects
function* walk(o) {
  if (o && typeof o === 'object') {
    yield o;
    for (const k of Object.keys(o)) yield* walk(o[k]);
  }
}

// Find crypto envelope by shape: 4 base64 strings matching ek/iv/tag/ct sizes
function findCryptoEnvelope(obj) {
  for (const sub of walk(obj)) {
    const b64Strings = Object.entries(sub).filter(([, v]) => typeof v === 'string' && /^[A-Za-z0-9+/=]+$/.test(v) && v.length >= 8);
    for (let i = 0; i < b64Strings.length; i++) {
      for (let j = 0; j < b64Strings.length; j++) {
        if (j === i) continue;
        for (let k = 0; k < b64Strings.length; k++) {
          if (k === i || k === j) continue;
          for (let m = 0; m < b64Strings.length; m++) {
            if (m === i || m === j || m === k) continue;
            const ekRaw = b64Strings[i][1], ivRaw = b64Strings[j][1], tagRaw = b64Strings[k][1], ctRaw = b64Strings[m][1];
            try {
              const ek = Buffer.from(ekRaw, 'base64');
              const iv = Buffer.from(ivRaw, 'base64');
              const tag = Buffer.from(tagRaw, 'base64');
              const ct = Buffer.from(ctRaw, 'base64');
              const looksEK = ek.length >= 128;
              const looksIV = iv.length === 12;
              const looksTAG = tag.length === 16;
              const looksCT = ct.length >= 16;
              if (looksEK && looksIV && looksTAG && looksCT) {
                return { ekKey: b64Strings[i][0], ekB64: ekRaw, ivKey: b64Strings[j][0], ivB64: ivRaw, tagKey: b64Strings[k][0], tagB64: tagRaw, ctKey: b64Strings[m][0], ctB64: ctRaw, node: sub };
              }
            } catch (_) {}
          }
        }
      }
    }
  }
  return null;
}

function rsaUnwrap(encryptedKeyB64, rsaPrivateKeyPem) {
  const encKey = Buffer.from(encryptedKeyB64, 'base64');
  return crypto.privateDecrypt(
    { key: rsaPrivateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    encKey
  );
}

function aesGcmDecrypt(keyBuf, ivB64, ctB64, tagB64) {
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const dec = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(ct), dec.final()]);
}

function aesGcmEncrypt(keyBuf, jsonString) {
  const iv = crypto.randomBytes(12);
  const enc = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  const ct = Buffer.concat([enc.update(Buffer.from(jsonString, 'utf8')), enc.final()]);
  const tag = enc.getAuthTag();
  return { iv: iv.toString('base64'), ciphertext: ct.toString('base64'), tag: tag.toString('base64') };
}

// Decrypt incoming event.body → { msg, keyBuf, rawObj, cryptoNode }
function decryptPayload(eventBody, rsaPrivateKeyPem) {
  console.log('[flows] body(head)=', head(eventBody));
  const rawObj = parsePossiblyBase64JSON(eventBody);
  if (!rawObj) {
    console.warn('[flows] body not JSON / not base64(JSON). Preview-like.');
    return { msg: null, keyBuf: null, rawObj: null, cryptoNode: null, previewLike: true };
  }
  const env = findCryptoEnvelope(rawObj);
  if (!env) {
    console.log('[flows] no crypto envelope found. Keys at root=', Object.keys(rawObj));
    return { msg: rawObj, keyBuf: null, rawObj, cryptoNode: null, previewLike: true };
  }
  console.log('[flows] crypto keys found:', env.ekKey, env.ivKey, env.tagKey, env.ctKey);
  const aesKey = rsaUnwrap(env.ekB64, rsaPrivateKeyPem);
  const plain = aesGcmDecrypt(aesKey, env.ivB64, env.ctB64, env.tagB64);
  const msg = JSON.parse(plain.toString('utf8'));
  return { msg, keyBuf: aesKey, rawObj, cryptoNode: env };
}

// Encrypt response using SAME AES key
function encryptResponse(obj, rawObj, keyBuf) {
  if (!keyBuf) throw new Error('No AES key available to encrypt response');
  const env = aesGcmEncrypt(keyBuf, JSON.stringify(obj));
  return Buffer.from(JSON.stringify(env), 'utf8').toString('base64');
}

// Try encryption; fallback to JSON on preview
function encrypted200(obj, rawObj, keyBuf) {
  try {
    const b64 = encryptResponse(obj, rawObj, keyBuf);
    return { statusCode: 200, isBase64Encoded: true, headers: { 'Content-Type': 'application/octet-stream' }, body: b64 };
  } catch (e) {
    console.warn('[flows] encrypted200 fallback:', e.message);
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
      body: JSON.stringify({ ok: true, now: new Date().toISOString() })
    };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let dec, msg, aesKey, rawObj;
  try {
    dec = decryptPayload(event.body, process.env.WA_PRIVATE_KEY);
    msg = dec.msg;                 // decrypted object (or preview JSON)
    aesKey = dec.keyBuf;           // Buffer(32) if real request; null if preview/health
    rawObj = dec.rawObj;           // original raw object (for context/logs)
  } catch (e) {
    console.error('[flows] decrypt error:', e);
    return { statusCode: 400, body: 'Bad Request' };
  }

  // Health check → EXACT payload expected by WhatsApp
  if (isHealthCheckMessage(msg)) {
    return encrypted200({ data: { status: 'active' } }, rawObj, aesKey);
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
    return encrypted200({ version: '3.0', screen: 'SERVICE_SUCCESS', data: { ok: true } }, rawObj, aesKey);
  }

  // Missing fields → tell the Preview nicely; real device won’t normally hit this
  return encrypted200({ ok: false, error: 'missing_required_fields', missing }, rawObj, aesKey);
};

