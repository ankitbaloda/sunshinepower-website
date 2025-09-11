// netlify/lib/waCrypto.js
const crypto = require("crypto");

/** Normalize a PEM that may be stored on one line in an env var */
function normalizePem(pem) {
  if (!pem) throw new Error("Missing private key PEM");
  // Accept both multi-line and \n-escaped one-liners
  if (!pem.includes("BEGIN")) {
    pem = Buffer.from(pem, "base64").toString("utf8");
  }
  return pem.replace(/\\n/g, "\n").trim();
}

/** RSA-OAEP(SHA-256) decrypt of the AES session key */
function rsaDecryptAesKeyB64(encryptedAesKeyB64, privateKeyPem) {
  const enc = Buffer.from(encryptedAesKeyB64, "base64");
  const key = normalizePem(privateKeyPem);
  const aesKey = crypto.privateDecrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    enc
  );
  if (aesKey.length !== 16) {
    // Meta uses a 128-bit AES key
    throw new Error(`Unexpected AES key length: ${aesKey.length}`);
  }
  return aesKey; // Buffer(16)
}

/** AES-128-GCM decrypt; auth tag is last 16 bytes appended to ciphertext */
function aesGcmDecryptB64(cipherPlusTagB64, keyBuf, ivB64) {
  const enc = Buffer.from(cipherPlusTagB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const tag = enc.slice(enc.length - 16);
  const ciphertext = enc.slice(0, enc.length - 16);
  const decipher = crypto.createDecipheriv("aes-128-gcm", keyBuf, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return pt.toString("utf8"); // JSON string
}

/** Invert IV bits for response as required by Meta */
function invertIv(ivBuf) {
  const out = Buffer.alloc(ivBuf.length);
  for (let i = 0; i < ivBuf.length; i++) out[i] = ivBuf[i] ^ 0xff;
  return out;
}

/** AES-128-GCM encrypt; returns base64(ciphertext||tag) */
function aesGcmEncryptToB64(plainUtf8, keyBuf, ivBuf) {
  const cipher = crypto.createCipheriv("aes-128-gcm", keyBuf, ivBuf);
  const ct = Buffer.concat([cipher.update(Buffer.from(plainUtf8, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([ct, tag]).toString("base64");
}

/** Decrypt the incoming Flows request body into JSON + crypto params */
function decryptFlowRequestBody(bodyStr, privateKeyPem) {
  const body = JSON.parse(bodyStr);

  // Body fields per Meta: encrypted_flow_data, encrypted_aes_key, initial_vector
  const aesKey = rsaDecryptAesKeyB64(body.encrypted_aes_key, privateKeyPem);
  const clearJsonStr = aesGcmDecryptB64(body.encrypted_flow_data, aesKey, body.initial_vector);

  const clear = JSON.parse(clearJsonStr); // { version, action, screen, data, ... }
  const ivBuf = Buffer.from(body.initial_vector, "base64");
  return { clear, aesKey, ivBuf };
}

/** Encrypt a Flows response JSON using same AES key and inverted IV */
function encryptFlowResponseBody(responseJson, aesKey, ivBuf) {
  const responseStr = typeof responseJson === "string" ? responseJson : JSON.stringify(responseJson);
  const respIv = invertIv(ivBuf);
  return aesGcmEncryptToB64(responseStr, aesKey, respIv);
}

module.exports = {
  decryptFlowRequestBody,
  encryptFlowResponseBody,
};
