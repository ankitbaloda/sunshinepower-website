// netlify/functions/wa-flow-service.js
const { decryptFlowRequestBody, encryptFlowResponseBody } = require("../lib/waCrypto");
const { persistServiceSubmission } = require("../lib/persist");

// -------- Robust form fields extractor helpers --------
function arrayToObject(arr) {
  const out = {};
  for (const entry of arr || []) {
    if (!entry) continue;
    const name = entry.name || entry.key || entry.id;
    if (!name) continue;
    if (entry.value !== undefined) out[name] = entry.value;
    else if (entry.selected_option && entry.selected_option.id) out[name] = entry.selected_option.id;
    else if (Array.isArray(entry.values) && entry.values.length === 1) out[name] = entry.values[0];
    else out[name] = entry; // raw fallback
  }
  return out;
}

function coerceFormCandidate(candidate) {
  if (!candidate) return null;
  if (Array.isArray(candidate)) return arrayToObject(candidate);
  if (Array.isArray(candidate.fields)) return arrayToObject(candidate.fields);
  return candidate;
}

function deepScanForFields(obj, depth = 0) {
  if (!obj || depth > 8) return null;
  if (Array.isArray(obj)) {
    const asObj = arrayToObject(obj);
    if (Object.keys(asObj).length) return asObj;
    for (const el of obj) {
      const found = deepScanForFields(el, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === 'object') {
    if (obj.fields) {
      const cc = coerceFormCandidate(obj);
      if (cc && Object.keys(cc).length) return cc;
    }
    for (const key of Object.keys(obj)) {
      if (/form|fields|responses/i.test(key)) {
        const cc = coerceFormCandidate(obj[key]);
        if (cc && Object.keys(cc).length) return cc;
      }
    }
    for (const key of Object.keys(obj)) {
      const found = deepScanForFields(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function extractFormFields(clear) {
  const roots = [
    clear?.data?.fields,
    clear?.data?.service_form,
    clear?.fields,
    clear?.data
  ];
  for (const r of roots) {
    const cand = coerceFormCandidate(r);
    if (cand && Object.keys(cand).length) return cand;
  }
  if (Array.isArray(clear?.data?.form_responses)) {
    for (const fr of clear.data.form_responses) {
      if (!fr) continue;
      if (Array.isArray(fr.fields)) {
        const cand = arrayToObject(fr.fields);
        if (Object.keys(cand).length) return cand;
      }
    }
  }
  const deep = deepScanForFields(clear);
  return deep || {};
}

// One-time log guard per function instance
let __LOGGED_ONCE__ = false;

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const PRIVATE_KEY = process.env.WA_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
      console.error("WA_PRIVATE_KEY is not set");
      return { statusCode: 500, body: "Server not configured" };
    }

    // 1) Decrypt incoming payload from Meta (Flows Data API v3.0)
  const { clear, aesKey, ivBuf } = decryptFlowRequestBody(event.body, PRIVATE_KEY);
  // Force full decrypted dump for Netlify logs to inspect exact shape
  try {
    console.log("DECRYPTED CLEAR:", JSON.stringify(clear, null, 2));
    console.log("DECRYPTED DATA:", JSON.stringify(clear?.data, null, 2));
    console.log("DECRYPTED FIELDS:", JSON.stringify(clear?.fields, null, 2));
    console.log("DECRYPTED DATA.FIELDS:", JSON.stringify(clear?.data?.fields, null, 2));
    console.log("DECRYPTED DATA.SERVICE_FORM:", JSON.stringify(clear?.data?.service_form, null, 2));
    console.log("DECRYPTED DATA.FORM_RESPONSES:", JSON.stringify(clear?.data?.form_responses, null, 2));
  } catch (_) {}
    // Example 'clear': { version:"3.0", action:"data_exchange"|"health_check", screen:"BOOK_SERVICE", data:{...}, flow_token:"..." }

    // One-time diagnostic logs to confirm decrypted payload and field keys
    const msg = clear;
    if (!__LOGGED_ONCE__) {
      try {
        console.log('RAW_DECRYPTED:', JSON.stringify(msg, null, 2));
        console.log('FIELDS_KEYS:', Object.keys(
          msg?.data?.fields ||
          msg?.payload?.fields ||
          msg?.fields ||
          msg?.data?.service_form ||
          msg?.service_form ||
          {}
        ));
      } catch (_) {}
      __LOGGED_ONCE__ = true;
    }

    // 1.1) Health Check handling — must reply with exactly { data: { status: 'active' } }
    const opCandidate =
      (clear && (clear.payload && clear.payload.op)) ||
      (clear && clear.data && clear.data.op) ||
      (clear && clear.op) ||
      null;

    const isHealthCheck =
      opCandidate === 'health_check' ||
      clear?.action === 'health_check' ||
      clear?.event === 'HEALTH_CHECK' ||
      clear?.type === 'HEALTH_CHECK' ||
      // Minimal envelope: nothing actionable
      (!opCandidate && !clear?.screen && !clear?.fields && !clear?.data?.op);

    if (isHealthCheck) {
      const healthPayload = { data: { status: 'active' } };
      const encryptedHealth = encryptFlowResponseBody(healthPayload, aesKey, ivBuf);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: encryptedHealth,
      };
    }

    // 2) (Optional) forward raw data to Make.com (if you set MAKE_WEBHOOK_URL)
    try {
      const hook = process.env.MAKE_WEBHOOK_URL;
      if (hook) {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "wa-flow",
            received_at: new Date().toISOString(),
            meta: {
              action: clear.action,
              screen: clear.screen,
              version: clear.version,
            },
            fields: clear.data || null,
            incoming_raw: clear,
          }),
        });
      }
    } catch (e) {
      console.warn("Make.com forward failed (continuing):", e.message);
    }

  // 3) Build response JSON expected by Flows
  //    You can decide next screen based on validation/business logic.
    let nextScreen = "SERVICE_SUCCESS";
    let responseData = { ok: true };

    // Detect simulator (broader heuristic)
    const isSimulator =
      clear.action === "health_check" ||
      (typeof clear.flow_token === "string" && /random|string|test|placeholder/i.test(clear.flow_token));

    // Robust field extraction across possible shapes (handles object, array, nested 'fields')
    const DEBUG = process.env.WA_FLOW_DEBUG === '1';
    const f = extractFormFields(clear);

    if (DEBUG) {
      try {
        console.log('[WA_FLOW_DEBUG] decrypted clear payload:', JSON.stringify(clear, null, 2));
        console.log('[WA_FLOW_DEBUG] data:', JSON.stringify(clear.data, null, 2));
        console.log('[WA_FLOW_DEBUG] extracted form keys:', f ? Object.keys(f) : null);
        console.log('[WA_FLOW_DEBUG] raw form object:', JSON.stringify(f, null, 2));
      } catch(_) {}
    }

    // Unwrap possible { value: "..." } containers
    const unwrap = (v) => {
      if (v && typeof v === 'object') {
        if ("value" in v && Object.keys(v).length === 1) return v.value; // { value: "..." }
        if (v.selected_option?.id) return v.selected_option.id; // dropdown pattern
        if (Array.isArray(v.values) && v.values.length === 1) return v.values[0]; // { values: ["single"] }
      }
      return v;
    };
    const fullNameVal = normalizeName(unwrap(f?.full_name));
    const mobileVal = normalizeMobile(unwrap(f?.mobile));
    const addressVal = unwrap(f?.address);
    const villageVal = unwrap(f?.village);
    const issueTypeVal = unwrap(f?.issue_type);
    const urgencyVal = unwrap(f?.urgency);
    const preferredDateVal = unwrap(f?.preferred_date);

    // Determine op consistently across shapes
    const op =
      (clear && clear.payload && clear.payload.op) ||
      (clear && clear.data && clear.data.op) ||
      (clear && clear.op) ||
      null;

    // Optional: log to confirm shape
    try {
      console.log('WA FLOW MSG:', JSON.stringify({
        op,
        action: clear?.action,
        screen: clear?.screen,
        keys: Object.keys(f || {})
      }));
    } catch(_) {}

    // Map issue_type id -> Hindi label (keep same if unknown)
    const ISSUE_TYPE_LABELS_HI = {
      no_generation_problem: "उत्पादन/बिजली बंद",
      solar_plate_problem: "सोलर प्लेट समस्या",
      net_metering_problem: "नेट मीटर समस्या",
      app_problem: "ऐप समस्या",
      inverter_problem: "इनवर्टर समस्या",
      wiring_problem: "वायरिंग समस्या",
      earthing_problem: "अर्थिंग समस्या",
      other_problem: "अन्य समस्या",
    };
    const issueTypeLabelHi = issueTypeVal ? ISSUE_TYPE_LABELS_HI[issueTypeVal] || issueTypeVal : null;

    // Build a normalized submission object (only when we have some data) for persistence
    const submissionPayload = (f && (fullNameVal || mobileVal)) ? {
      full_name: fullNameVal || null,
      mobile: mobileVal || null,
      address: addressVal,
      village: villageVal,
      issue_type: issueTypeVal,
      issue_type_label_hi: issueTypeLabelHi,
      urgency: urgencyVal,
      preferred_date: preferredDateVal,
      flow_screen: clear.screen,
      op: clear.data?.op,
      action: clear.action,
      flow_version: clear.version || null,
      data_api_version: clear.data_api_version || null,
      received_at: new Date().toISOString(),
      simulator: isSimulator,
    } : null;

    // Validate only for real final submissions
  if (clear.action === "data_exchange" &&
    (op === "submit_service_form") &&
        !isSimulator) {
      // Strict required list (current form fields)
      const missing = [];
      if (!fullNameVal) missing.push("full_name");
      if (!mobileVal) missing.push("mobile");
      if (!addressVal) missing.push("address");
      if (!villageVal) missing.push("village");
      if (!issueTypeVal) missing.push("issue_type");
      if (!urgencyVal) missing.push("urgency");
      if (!preferredDateVal) missing.push("preferred_date");

      const RELAX = process.env.WA_FLOW_RELAX_VALIDATION === '1';
      if (missing.length) {
        if (RELAX) {
          // Allow progression but flag partial
            responseData = { ok: true, partial: true, missing };
            nextScreen = "SERVICE_SUCCESS"; // proceed anyway
        } else {
          nextScreen = "BOOK_SERVICE";
          responseData = { ok: false, error: "missing_required_fields", missing };
        }
      } else if (submissionPayload) {
        // Fire & forget local persistence
        persistServiceSubmission({ type: "service_form", ...submissionPayload });

        // Forward to Make with BOTH op and normalized fields
        try {
          const hook = process.env.MAKE_WEBHOOK_URL;
          if (hook) {
            const fieldsToSend = {
              full_name: fullNameVal,
              mobile: mobileVal,
              address: addressVal,
              village: villageVal,
              issue_type: issueTypeVal,
              urgency: urgencyVal,
              preferred_date: preferredDateVal,
            };
            await fetch(hook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: 'whatsapp_flow',
                op: 'submit_service_form',
                fields: fieldsToSend,
                received_at: new Date().toISOString(),
              }),
            });
          }
        } catch (e) {
          console.warn('Make.com forward (fields) failed (continuing):', e.message);
        }
      }
    }

    function normalizeMobile(raw) {
      if (!raw || typeof raw !== "string") return null;
      // Remove spaces, dashes, parentheses
      let v = raw.replace(/[\s\-()]/g, "");
      // Remove leading +91 or 0 if present
      v = v.replace(/^\+?91/, "").replace(/^0+/, "");
      // Accept only 10 digit final
      if (!/^\d{10}$/.test(v)) return null;
      return "+91" + v; // store normalized in +91XXXXXXXXXX format
    }

    function normalizeName(n) {
      if (!n || typeof n !== "string") return null;
      const trimmed = n.trim();
      return trimmed.length ? trimmed : null;
    }

    const responseJson = { version: "3.0", screen: nextScreen, data: responseData };

    // 4) Encrypt response according to Meta rules (AES-GCM with inverted IV) and return as base64 STRING
    const encryptedB64 = encryptFlowResponseBody(responseJson, aesKey, ivBuf);

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" }, // MUST be plain base64, not JSON
      body: encryptedB64,
    };
  } catch (err) {
    console.error("wa-flow-service error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};