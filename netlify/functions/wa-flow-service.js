// netlify/functions/wa-flow-service.js



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
    const priv = (process.env.WA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!priv) throw new Error("WA_PRIVATE_KEY missing");

    const encKey = Buffer.from(envelope.encrypted_aes_key, "base64");
    const iv = Buffer.from(envelope.initial_vector, "base64");
    const cipher = Buffer.from(envelope.encrypted_flow_data, "base64");

    // RSA-OAEP(SHA-256) unwrap AES key
    const aesKey = crypto.privateDecrypt(
      {
        key: priv,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encKey
    );

    // AES-256-CBC decrypt flow data
    const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
    const clear = Buffer.concat([decipher.update(cipher), decipher.final()]);
    const json = clear.toString("utf8");
    return JSON.parse(json);
  }

async function fetchFlowValuesByToken(flow_token) {
  const GRAPH_TOKEN = process.env.WHATSAPP_GRAPH_TOKEN;
  const FLOW_DATA_URL =
    process.env.FLOW_DATA_URL ||
    "https://graph.facebook.com/v20.0/flows?action=data_exchange_fetch";

  if (!GRAPH_TOKEN) return {};

  try {
    const res = await fetch(FLOW_DATA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GRAPH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ flow_token }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Flow Data API error:", res.status, t);
      return {};
    }
    const j = await res.json();
    const names = new Set([
      "full_name",
      "mobile",
      "address",
      "village",
      "issue_type",
      "urgency",
      "preferred_date",
    ]);
    return deepFind(j, names);
  } catch (e) {
    console.error("Flow Data API fetch failed:", e);
    return {};
  }
}

  export async function handler(event) {
    try {
      const envelope = JSON.parse(event.body);

      // If it’s the encrypted envelope (what you just logged), decrypt it:
      const decrypted =
        envelope.encrypted_flow_data && envelope.encrypted_aes_key
          ? decryptEnvelope(envelope)
          : envelope;

      console.log("DECRYPTED CLEAR:", JSON.stringify(decrypted));

      const { screen = "BOOK_SERVICE", data = {}, flow_token } = decrypted;

      // Pull values no matter where the provider put them
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

      // If preferred_date is an object, add ISO if present
      if (fields.preferred_date && typeof fields.preferred_date === "object") {
        fields.preferred_date_iso =
          fields.preferred_date.iso ||
          fields.preferred_date.value ||
          fields.preferred_date.date ||
          null;
      }

      // Validate required
      const required = [
        "full_name",
        "mobile",
        "address",
        "village",
        "issue_type",
        "urgency",
        "preferred_date",
      ];
      const missing = required.filter(
        (k) => !fields[k] || isPlaceholder(fields[k])
      );

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

      // TODO: forward to Make/Sheets if you want:
      // await fetch(process.env.MAKE_WEBHOOK_URL, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(fields) });

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
