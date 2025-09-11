// netlify/functions/wa-flow-service.js
const { decryptFlowRequestBody, encryptFlowResponseBody } = require("../lib/waCrypto");

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

    // Example: basic validation for a submit op
    if (clear.action === "data_exchange" && clear.data && clear.data.op === "submit_service_form") {
      const f = clear.data.fields || clear.data; // depending on your form binding
      // Add light validation if you want:
      if (!f || !f.full_name || !f.mobile) {
        nextScreen = "BOOK_SERVICE";
        responseData = { ok: false, error: "missing_required_fields" };
      }
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
