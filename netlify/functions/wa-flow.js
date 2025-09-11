// netlify/functions/wa-flow.js
// Node 18+ on Netlify has global fetch.
const crypto = require("crypto");

/** ---------- WhatsApp Flows encryption helpers ---------- */
function invertIV(ivBuf) {
  const out = Buffer.from(ivBuf);
  for (let i = 0; i < out.length; i++) out[i] = (~out[i]) & 0xff;
  return out;
}
function aesAlgoFor(keyBuf) {
  return keyBuf.length === 16 ? "aes-128-gcm" : "aes-256-gcm";
}
function b64Utf8(obj) {
  return Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj), "utf8").toString("base64");
}

/** ---------- Safe forward to Make (with diagnostics) ---------- */
async function forwardToMake(url, payload) {
  if (!url) return { ok: false, reason: "MAKE_WEBHOOK_URL not set" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { ok: res.ok, status: res.status, statusText: res.statusText };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

/** ---------- Netlify handler ---------- */
exports.handler = async (event) => {
  // Simple GET probe to verify Make wiring without WhatsApp encryption.
  // Visit: https://YOUR_DOMAIN/.netlify/functions/wa-flow?probe=make
  if (event.httpMethod === "GET" && event.queryStringParameters?.probe === "make") {
    const r = await forwardToMake(process.env.MAKE_WEBHOOK_URL, {
      test: true,
      note: "Hello from Netlify function GET probe",
      time: new Date().toISOString()
    });
    return { statusCode: 200, body: JSON.stringify(r) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const privPem = (process.env.WA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!privPem) return { statusCode: 500, body: "Missing WA_PRIVATE_KEY env var" };

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  // Plain (unencrypted) health probe fallback
  if (!body.encrypted_aes_key || !body.initial_vector) {
    return { statusCode: 200, headers: { "Content-Type": "text/plain" },
      body: b64Utf8({ data: { status: "active" } }) };
  }

  try {
    // 1) Decrypt AES session key
    const aesKey = crypto.privateDecrypt(
      { key: privPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(body.encrypted_aes_key, "base64")
    );
    const iv = Buffer.from(body.initial_vector, "base64");
    const algo = aesAlgoFor(aesKey);

    // 2) Decrypt incoming payload
    let incoming = {};
    if (body.encrypted_flow_data) {
      const raw = Buffer.from(body.encrypted_flow_data, "base64");
      const tag = raw.slice(-16);
      const data = raw.slice(0, -16);
      const dec = crypto.createDecipheriv(algo, aesKey, iv);
      dec.setAuthTag(tag);
      const clear = Buffer.concat([dec.update(data), dec.final()]);
      try { incoming = JSON.parse(clear.toString("utf8") || "{}"); } catch {}
    }

    // 3) Health check (must be EXACT)
    if (incoming && (incoming.action === "ping" || incoming.health_check === true)) {
      const payload = Buffer.from(JSON.stringify({ data: { status: "active" } }), "utf8");
      const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
      const enc = Buffer.concat([cipher.update(payload), cipher.final()]);
      const tag = cipher.getAuthTag();
      const out = Buffer.concat([enc, tag]).toString("base64");
      return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
    }

    // 4) Map the most likely field locations and forward EVERYTHING helpful
    const fields =
      incoming?.data ||           // common case
      incoming?.form_data ||      // sometimes Meta uses this
      incoming?.values ||         // just in case
      null;

    const makePayload = {
      source: "wa-flow",
      received_at: new Date().toISOString(),
      // useful for debugging in Make:
      meta: {
        action: incoming?.action || null,
        screen: incoming?.screen || null,
        name: incoming?.name || null
      },
      fields,            // the clean fields if found
      incoming_raw: incoming,   // full decrypted object for inspection
      request_headers: {        // a few headers can help later
        "x-nf-client-connection-ip": event.headers["x-nf-client-connection-ip"] || null,
        "user-agent": event.headers["user-agent"] || null
      }
    };

    const fwd = await forwardToMake(process.env.MAKE_WEBHOOK_URL, makePayload);
    console.log("Make forward:", fwd);

    // 5) Encrypt success screen for WhatsApp
    const replyObj = { version: "3.0", screen: "SERVICE_SUCCESS", data: { ok: true } };
    const buf = Buffer.from(JSON.stringify(replyObj), "utf8");
    const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
    const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
    const tag = cipher.getAuthTag();
    const out = Buffer.concat([enc, tag]).toString("base64");

    return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
  } catch (e) {
    console.error("Flow error:", e);
    // Respond with a valid base64 minimal payload so the UI doesn't break
    return { statusCode: 200, headers: { "Content-Type": "text/plain" },
      body: b64Utf8({ data: { status: "active" } }) };
  }
};
