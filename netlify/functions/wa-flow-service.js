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
    const decrypted = JSON.parse(event.body); // <-- replace with your real DECRYPTED object
    console.log("DECRYPTED:", JSON.stringify(decrypted));
    const { action, screen, data = {}, flow_token } = decrypted;
    const names = new Set(["full_name","mobile","address","village","issue_type","urgency","preferred_date"]);
    const fields = { ...data };
    const extracted = deepFind(decrypted, names);
    Object.assign(fields, extracted);
    const looksBad =
      Object.entries(fields).some(([k,v]) => names.has(k) && (v == null || isPlaceholder(v)));
    if (looksBad && flow_token) {
      const fetched = await fetchFlowValuesByToken(flow_token);
      for (const key of names) {
        if (!fields[key] || isPlaceholder(fields[key])) {
          if (fetched[key] != null) fields[key] = fetched[key];
        }
      }
    }
    if (fields.preferred_date && typeof fields.preferred_date === "object") {
      fields.preferred_date_iso =
        fields.preferred_date.iso ||
        fields.preferred_date.value ||
        fields.preferred_date.date ||
        null;
    }
    const required = ["full_name","mobile","address","village","issue_type","urgency","preferred_date"];
    const missing = required.filter(k => !fields[k] || isPlaceholder(fields[k]));
    if (missing.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          version: "3.0",
          screen,
          data: {
            ok: false,
            error: "missing_required_fields",
            missing
          }
        })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        version: "3.0",
        screen: "SERVICE_SUCCESS",
        data: { ok: true, received: fields }
      })
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 200,
      body: JSON.stringify({
        version: "3.0",
        screen: "BOOK_SERVICE",
        data: { ok: false, error: "server_error", message: e.message }
      })
    };
  }
}
