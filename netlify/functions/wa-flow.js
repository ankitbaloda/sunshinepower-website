// netlify/functions/wa-flow.js
const crypto = require("crypto");

function invertIV(ivBuf) {
  // WhatsApp requires the IV for the RESPONSE to be "bitwise NOT" of the request IV
  const out = Buffer.from(ivBuf);
  for (let i = 0; i < out.length; i++) out[i] = (~out[i]) & 0xff;
  return out;
}

function aesAlgoFor(keyBuf) {
  // Meta may send 16 or 32 byte AES keys. Pick GCM size to match.
  return keyBuf.length === 16 ? "aes-128-gcm" : "aes-256-gcm";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 404, body: "Not found" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const privPem = (process.env.WA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!privPem) throw new Error("Missing WA_PRIVATE_KEY env var");

    // If Meta is doing a plaintext health probe (rare), answer with base64(JSON) and exit.
    if (!body.encrypted_aes_key || !body.initial_vector) {
      const plain = Buffer.from(JSON.stringify({ version: "2.0", data: { status: "active" } }), "utf8");
      return {
        statusCode: 200,
        headers: { "content-type": "text/plain" },
        body: plain.toString("base64"),
      };
    }

    // 1) Decrypt AES key using your RSA private key (OAEP SHA-256)
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

    // 2) (Optional) Decrypt incoming payload, useful for debugging
    if (body.encrypted_flow_data) {
      const enc = Buffer.from(body.encrypted_flow_data, "base64");
      const tag = enc.slice(enc.length - 16);
      const data = enc.slice(0, enc.length - 16);
      const decipher = crypto.createDecipheriv(algo, aesKey, iv);
      decipher.setAuthTag(tag);
      const clear = Buffer.concat([decipher.update(data), decipher.final()]);
      const incoming = JSON.parse(clear.toString("utf8"));
      console.log("Decrypted request:", incoming);
      // You can route by incoming.action / incoming.screen / incoming.op here
    }

    // 3) Build your normal Flow reply payload (any object is fine for health-check)
    const reply = {
      version: "2.0",
      screen: "SERVICE_SUCCESS",
      data: { status: "ok" }, // add fields your flow expects
    };
    const clearReply = Buffer.from(JSON.stringify(reply), "utf8");

    // 4) Encrypt reply with SAME AES key + INVERTED IV (bitwise NOT)
    const respIV = invertIV(iv);
    const cipher = crypto.createCipheriv(algo, aesKey, respIV);
    const enc = Buffer.concat([cipher.update(clearReply), cipher.final()]);
    const tag = cipher.getAuthTag();
    const encWithTag = Buffer.concat([enc, tag]);
    const b64 = encWithTag.toString("base64");

    // 5) Return the Base64 BYTES (no JSON wrapper)
    return {
      statusCode: 200,
      headers: { "content-type": "text/plain" },
      body: b64,
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: `Server error: ${e.message}` };
  }
};
