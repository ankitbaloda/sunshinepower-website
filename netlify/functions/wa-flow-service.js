// netlify/functions/wa-flow-service.js
const { decryptFlowRequestBody, encryptFlowResponseBody } = require("../lib/waCrypto");
const { persistServiceSubmission } = require("../lib/persist");

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
    // Example 'clear': { version:"3.0", action:"data_exchange"|"health_check", screen:"BOOK_SERVICE", data:{...}, flow_token:"..." }

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

  // Robust field extraction across possible shapes
    let f = null;
    const roots = [clear.fields, clear.data?.fields, clear.data];
    for (const r of roots) {
      if (!r) continue;
      if (r.service_form && typeof r.service_form === "object") {
        f = r.service_form;
        break;
      }
      if (r.full_name || r.mobile) { // fields directly here
        f = r;
        break;
      }
    }

    // Unwrap possible { value: "..." } containers
    const unwrap = (v) => (v && typeof v === "object" && "value" in v && Object.keys(v).length === 1) ? v.value : v;
    const fullNameVal = normalizeName(unwrap(f?.full_name));
    const mobileVal = normalizeMobile(unwrap(f?.mobile));
    const addressVal = unwrap(f?.address);
    const villageVal = unwrap(f?.village);
    const issueTypeVal = unwrap(f?.issue_type);
    const urgencyVal = unwrap(f?.urgency);
    const preferredDateVal = unwrap(f?.preferred_date);

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
        clear.data?.op === "submit_service_form" &&
        !isSimulator) {
      // Strict validation of all required fields
      const missing = [];
      if (!fullNameVal) missing.push("full_name");
      if (!mobileVal) missing.push("mobile");
      if (!addressVal) missing.push("address");
      if (!villageVal) missing.push("village");
      if (!issueTypeVal) missing.push("issue_type");
      if (!urgencyVal) missing.push("urgency");
      if (!preferredDateVal) missing.push("preferred_date");

      if (missing.length) {
        nextScreen = "BOOK_SERVICE";
        responseData = { ok: false, error: "missing_required_fields", missing };
      } else if (submissionPayload) {
        // Fire & forget with retry (do not await full completion to avoid latency)
        persistServiceSubmission({ type: "service_form", ...submissionPayload });
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
