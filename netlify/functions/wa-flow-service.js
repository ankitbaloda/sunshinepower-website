// netlify/functions/wa-flow-service.js
import { privateDecrypt, createDecipheriv, constants } from "node:crypto";
function isPlaceholder(v) {
  return typeof v === "string" && /^\$\{[^}]+\}$/.test(v);
}

function deepFind(obj, names) {
  const out = {};
  const seen = new Set();
  function walk(x) {
    if (!x || typeof x !== "object") return;
    if (seen.has(x)) return;
    seen.add(x);
    if (Array.isArray(x.components)) {
      for (const c of x.components) {
        if (c && names.has(c.name)) {
          if (Object.prototype.hasOwnProperty.call(c, "value")) {
            out[c.name] = c.value;
          } else if (c.selected && (c.selected.id || c.selected.title)) {
            out[c.name] = c.selected.id || c.selected.title;
          }
        }
      }
    }
    for (const [k, v] of Object.entries(x)) {
      if (names.has(k)) {
        if (v && typeof v === "object") {
          out[k] = v.id || v.value || v.title || JSON.stringify(v);
        } else {
          out[k] = v;
        }
      }
      if (v && typeof v === "object") walk(v);
    }
}
  walk(obj);
  return out;
}
function decryptEnvelope(envelope) {
  const priv = (process.env.WA_PRIVATE_KEY || "").replace(/\n/g, "\n");
  if (!priv) throw new Error("WA_PRIVATE_KEY missing");
  const encKey = Buffer.from(envelope.encrypted_aes_key, "base64");
  const iv = Buffer.from(envelope.initial_vector, "base64");
  const cipher = Buffer.from(envelope.encrypted_flow_data, "base64");
  const aesKey = privateDecrypt({
    key: priv,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  }, encKey);
  const decipher = createDecipheriv("aes-256-cbc", aesKey, iv);
  import { privateDecrypt, createDecipheriv, constants } from "node:crypto";

  function isPlaceholder(v) {
    return typeof v === "string" && /^\$\{[^}]+\}$/.test(v);
  }

  function decryptEnvelope(envelope) {
    const priv = (process.env.WA_PRIVATE_KEY || "").replace(/\n/g, "\n");
    if (!priv) throw new Error("WA_PRIVATE_KEY missing");

    const encKeyB64 = envelope.encrypted_aes_key;
    const ivB64 = envelope.initial_vector;
    const cipherB64 = envelope.encrypted_flow_data;

    if (!encKeyB64 || !ivB64 || !cipherB64) {
      throw new Error("Envelope missing encrypted_aes_key / initial_vector / encrypted_flow_data");
    }

    const encKey = Buffer.from(encKeyB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const cipher = Buffer.from(cipherB64, "base64");

    // 1) RSA-OAEP (SHA-256) unwrap AES key
    const aesKey = privateDecrypt(
      { key: priv, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      encKey
    );

    // 2) Pick AES-CBC size by key length
    const keyLen = aesKey.length; // 16, 24, or 32
    let alg;
    if (keyLen === 16) alg = "aes-128-cbc";
    else if (keyLen === 24) alg = "aes-192-cbc";
    else if (keyLen === 32) alg = "aes-256-cbc";
    else {
      throw new Error(`Unexpected AES key length ${keyLen}. Check WA_PRIVATE_KEY.`);
    }

    if (iv.length !== 16) {
      throw new Error(`Unexpected IV length ${iv.length}. Expected 16 bytes for CBC.`);
    }

    let clearBuf;
    try {
      const decipher = createDecipheriv(alg, aesKey, iv);
      clearBuf = Buffer.concat([decipher.update(cipher), decipher.final()]);
    } catch (e) {
      e.message = `AES decrypt failed (${alg}): ${e.message}.` +
        ` If this persists, confirm NODE_OPTIONS="--openssl-legacy-provider" on Netlify,` +
        ` and verify your RSA key is correct.`;
      throw e;
    }

    const json = clearBuf.toString("utf8");
    return JSON.parse(json);
  }

  function deepFind(obj, names) {
    const out = {};
    const seen = new Set();
    (function walk(x) {
      if (!x || typeof x !== "object" || seen.has(x)) return;
      seen.add(x);
      if (Array.isArray(x.components)) {
        for (const c of x.components) {
          if (!c || !c.name) continue;
          if (names.has(c.name)) {
            if ("value" in c) out[c.name] = c.value;
            else if (c.selected) out[c.name] = c.selected.id || c.selected.title;
          }
        }
      }
      for (const [k, v] of Object.entries(x)) {
        if (names.has(k)) {
          out[k] = v && typeof v === "object"
            ? v.id || v.value || v.title || JSON.stringify(v)
            : v;
        }
        if (v && typeof v === "object") walk(v);
      }
    })(obj);
    return out;
  }

  export async function handler(event) {
    try {
      const envelope = JSON.parse(event.body || "{}");
      const decrypted =
        envelope.encrypted_flow_data && envelope.encrypted_aes_key && envelope.initial_vector
          ? decryptEnvelope(envelope)
          : envelope;
      console.log("DECRYPTED CLEAR:", JSON.stringify(decrypted));
      const { screen = "BOOK_SERVICE", data = {}, flow_token } = decrypted;
      const names = new Set([
        "full_name",
        "mobile",
        "address",
        "village",
        "issue_type",
        "urgency",
        "preferred_date",
      ]);
      const fields = { ...data, ...deepFind(decrypted, names) };
      if (fields.preferred_date && typeof fields.preferred_date === "object") {
        fields.preferred_date_iso =
          fields.preferred_date.iso ||
          fields.preferred_date.value ||
          fields.preferred_date.date ||
          null;
      }
      const required = [
        "full_name",
        "mobile",
        "address",
        "village",
        "issue_type",
        "urgency",
        "preferred_date",
      ];
      const missing = required.filter((k) => !fields[k] || isPlaceholder(fields[k]));
      if (missing.length) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            version: "3.0",
            screen: "BOOK_SERVICE",
            data: { ok: false, error: "missing_required_fields", missing, flow_token },
          }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          version: "3.0",
          screen: "SERVICE_SUCCESS",
          data: { ok: true, received: fields },
        }),
      };
    } catch (e) {
      console.error(e);
      return {
        statusCode: 200,
        body: JSON.stringify({
          version: "3.0",
          screen: "BOOK_SERVICE",
          data: { ok: false, error: "server_error", message: e.message },
        }),
      };
    }
  }
