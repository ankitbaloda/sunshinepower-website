// netlify/functions/wa-flow.js
// Node 18+ on Netlify has global fetch; no extra dependencies required.
const crypto = require("crypto");

/* ---------------- WhatsApp Flows encryption helpers ---------------- */
function invertIV(ivBuf) {
  // Response IV must be bitwise NOT of request IV
  const out = Buffer.from(ivBuf);
  for (let i = 0; i < out.length; i++) out[i] = (~out[i]) & 0xff;
  return out;
}
function aesAlgoFor(keyBuf) {
  // Meta may send 16 or 32 byte AES keys (GCM)
  return keyBuf.length === 16 ? "aes-128-gcm" : "aes-256-gcm";
}
function b64Utf8(objOrString) {
  const s = typeof objOrString === "string" ? objOrString : JSON.stringify(objOrString);
  return Buffer.from(s, "utf8").toString("base64");
}

/* ---------------- Safe forwarder to Make (with diagnostics) ---------------- */
async function forwardToMake(url, payload) {
  if (!url) return { ok: false, reason: "MAKE_WEBHOOK_URL not set" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, statusText: res.statusText };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

/* ---------------- Netlify Function handler ---------------- */
exports.handler = async (event) => {
  // Simple GET probe to test Make wiring (no WhatsApp involved):
  // Open in browser: https://YOUR_DOMAIN/.netlify/functions/wa-flow?probe=make
  if (event.httpMethod === "GET" && event.queryStringParameters?.probe === "make") {
    const r = await forwardToMake(process.env.MAKE_WEBHOOK_URL, {
      test: true,
      note: "Hello from Netlify GET probe",
      time: new Date().toISOString(),
    });
    return { statusCode: 200, body: JSON.stringify(r) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const privPem = (process.env.WA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!privPem) return { statusCode: 500, body: "Missing WA_PRIVATE_KEY env var" };

  // Parse body from WhatsApp
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  // Plain (unencrypted) health probe fallback (rare but safe):
  if (!body.encrypted_aes_key || !body.initial_vector) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      // Health check expects base64 of {"data":{"status":"active"}}
      body: b64Utf8({ data: { status: "active" } }),
    };
  }

  try {
    /* 1) Decrypt AES session key */
    const aesKey = crypto.privateDecrypt(
      { key: privPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(body.encrypted_aes_key, "base64")
    );
    const iv = Buffer.from(body.initial_vector, "base64");
    const algo = aesAlgoFor(aesKey);

    /* 2) Decrypt incoming payload (if present) */
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

    /* 3) Health check path — MUST return exactly {data:{status:"active"}} */
    if (incoming && (incoming.action === "ping" || incoming.health_check === true)) {
      const payload = Buffer.from(JSON.stringify({ data: { status: "active" } }), "utf8");
      const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
      const enc = Buffer.concat([cipher.update(payload), cipher.final()]);
      const tag = cipher.getAuthTag();
      const out = Buffer.concat([enc, tag]).toString("base64");
      return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
    }

    /* 4) Build Make payload (never send null; include full decrypted for debugging) */
    const fields =
      (incoming && (incoming.data || incoming.form_data || incoming.values)) ||
      incoming || {}; // fallback to full object

    const makePayload = {
      source: "wa-flow",
      received_at: new Date().toISOString(),
      meta: {
        action: incoming?.action || null,
        screen: incoming?.screen || null,
        name: incoming?.name || null,
      },
      fields,                 // clean fields when available
      incoming_raw: incoming, // full decrypted object for inspection
      request_headers: {
        "x-nf-client-connection-ip": event.headers["x-nf-client-connection-ip"] || null,
        "user-agent": event.headers["user-agent"] || null,
      },
    };

    const fwd = await forwardToMake(process.env.MAKE_WEBHOOK_URL, makePayload);
    console.log("Make forward:", fwd);

    /* 5) Encrypt success reply back to WhatsApp (shows your success screen) */
    const replyObj = { version: "3.0", screen: "SERVICE_SUCCESS", data: { ok: true } };
    const buf = Buffer.from(JSON.stringify(replyObj), "utf8");
    const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
    const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
    const tag = cipher.getAuthTag();
    const out = Buffer.concat([enc, tag]).toString("base64");

    return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
  } catch (e) {
    console.error("Flow error:", e);
    // Return a valid base64 minimal payload so the Flow UI doesn't break
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: b64Utf8({ data: { status: "active" } }),
    };
  }
};
