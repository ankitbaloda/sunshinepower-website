// netlify/functions/wa-flow.js
const crypto = require("crypto");

function invertIV(ivBuf) {
  const out = Buffer.from(ivBuf);
  for (let i = 0; i < out.length; i++) out[i] = (~out[i]) & 0xff;
  return out;
}
function aesAlgoFor(keyBuf) {
  return keyBuf.length === 16 ? "aes-128-gcm" : "aes-256-gcm";
}
function b64(s) {
  return Buffer.from(s, "utf8").toString("base64");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const privPem = (process.env.WA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!privPem) {
    return { statusCode: 500, body: "Missing WA_PRIVATE_KEY env var" };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  // --- Old/plain health probe fallback (no encryption present) ---
  if (!body.encrypted_aes_key || !body.initial_vector) {
    // MUST be base64 of {"data":{"status":"active"}}
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: b64(JSON.stringify({ data: { status: "active" } }))
    };
  }

  // --- Decrypt AES key with RSA-OAEP SHA-256 ---
  const aesKey = crypto.privateDecrypt(
    { key: privPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(body.encrypted_aes_key, "base64")
  );

  const iv = Buffer.from(body.initial_vector, "base64");
  const algo = aesAlgoFor(aesKey);

  // --- Decrypt incoming payload (to detect health-check "ping") ---
  let incoming = {};
  if (body.encrypted_flow_data) {
    const enc = Buffer.from(body.encrypted_flow_data, "base64");
    const tag = enc.slice(-16);
    const data = enc.slice(0, -16);
    const dec = crypto.createDecipheriv(algo, aesKey, iv);
    dec.setAuthTag(tag);
    const clear = Buffer.concat([dec.update(data), dec.final()]);
    try { incoming = JSON.parse(clear.toString("utf8") || "{}"); } catch {}
  }

  // --- HEALTH CHECK RESPONSE (exact shape required) ---
  if (incoming && (incoming.action === "ping" || incoming.health_check === true)) {
    const payload = Buffer.from(JSON.stringify({ data: { status: "active" } }), "utf8");
    const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
    const enc = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();
    const out = Buffer.concat([enc, tag]).toString("base64");
    return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
  }

  // --- NORMAL FLOW REPLY (you can customize later) ---
  const replyObj = { version: "3.0", screen: "SERVICE_SUCCESS", data: { ticket_id: `SV-${Date.now()}` } };
  const replyBuf = Buffer.from(JSON.stringify(replyObj), "utf8");
  const cipher = crypto.createCipheriv(algo, aesKey, invertIV(iv));
  const enc = Buffer.concat([cipher.update(replyBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = Buffer.concat([enc, tag]).toString("base64");
  return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: out };
};
