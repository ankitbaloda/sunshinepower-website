// netlify/functions/wa-flow.js
// Node 18+ on Netlify has global fetch; no extra deps needed.
const crypto = require("crypto");

/** --- Helpers for WhatsApp Flows encryption --- */
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
function b64(s) {
  return Buffer.from(s, "utf8").toString("base64");
}

/** --- Netlify Function entry --- */
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Load keys from env (normalize newlines if pasted as \n)
  const privPem = (process.env.WA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!privPem) {
    return { statusCode: 500, body: "Missing WA_PRIVATE_KEY env var" };
  }
  const makeWebhook = process.env.MAKE_WEBHOOK_URL || "";

  // Parse incoming body from WhatsApp
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  // Fallback: some health probes may be plaintext (no encryption fields)
  if (!body.encrypted_aes_key || !body.initial_vector) {
    // Health check expects base64 of {"data":{"status":"active"}}
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: b64(JSON.stringify({ data: { status: "active" } }))
    };
  }

  try {
    /** 1) Decrypt AES key using RSA-OAEP(SHA-256) */
    const aesKey = crypto.privateDecrypt(
      {
        key: privPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(body.encrypted_aes_key, "base64")
    );

    const iv = Buffer.from(body.initial_vector, "base64");
    const algo = aesAlgoFor(aesKey);

    /** 2) Decrypt incoming payload (if present) */
    let incoming = {};
    if (body.encrypted_flow_data) {
      const enc = Buffer.from(body.encrypted_flow_data, "base64");
      const tag = enc.slice(-16);
      const data = enc.slice(0, -16);
      const dec = crypto.createDecipheriv(algo, aesKey, iv);
      dec.setAuthTag(tag);
      const clear = Buffer.concat([dec.update(data), dec.final()]);
      try { incoming = JSON.parse(clear.toString("utf8") || "{}"); } catch {}
      // console.log("Incoming (decrypted):", incoming); // useful when checking logs
    }

    /** 3) Health check reply (must be EXACT shape) */
    if (incoming && (incoming.action === "ping" || incoming.health_check === true)) {
      const payload = Buffer.from(JSON.stringify({ data: { status: "active" } }), "utf8");
      const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
      const enc = Buffer.concat([cipher.update(payload), cipher.final()]);
      const tag = cipher.getAuthTag();
      const out = Buffer.concat([enc, tag]).toString("base64");
      return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
    }

    /** 4) Forward submissions to Make (non-blocking; safe if not set) */
    if (makeWebhook && incoming && incoming.data) {
      try {
        await fetch(makeWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "wa-flow",
            received_at: new Date().toISOString(),
            flow_action: incoming.action || null,
            flow_screen: incoming.screen || null,
            flow_name: incoming.name || null,
            data: incoming.data // your form fields (full_name, mobile, address, etc.)
          })
        });
      } catch (err) {
        console.error("Make forward failed:", err.message);
        // we still continue; never break the user experience
      }
    }

    /** 5) Encrypt SUCCESS reply back to WhatsApp */
    const replyObj = {
      version: "3.0",
      screen: "SERVICE_SUCCESS",
      data: { ticket_id: `SV-${Date.now()}` }
    };
    const replyBuf = Buffer.from(JSON.stringify(replyObj), "utf8");
    const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
    const enc = Buffer.concat([cipher.update(replyBuf), cipher.final()]);
    const tag = cipher.getAuthTag();
    const out = Buffer.concat([enc, tag]).toString("base64");

    return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
  } catch (e) {
    console.error("Flow error:", e);
    // Even on error, return a valid base64 so WhatsApp gets a response
    const failPayload = b64(JSON.stringify({ data: { status: "active" } }));
    return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: failPayload };
  }
};
