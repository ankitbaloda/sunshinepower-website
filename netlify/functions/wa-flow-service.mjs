// netlify/functions/wa-flow-service.mjs
// Node 18+ (Netlify default). ESM module.

// ==========================
// 1) Environment variables
// ==========================
//
// In Netlify -> Site settings -> Environment variables, add:
//   MAKE_WEBHOOK_URL       = https://hook.integromat.com/xxxxxxxx
//   // and any keys your crypto helpers need (e.g. PRIVATE_KEY, KEY_ID, etc.)

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

// ==========================
// 2) CRYPTO HELPERS (paste yours)
// ==========================
//
// IMPORTANT: Replace the two functions below with the SAME
// decrypt/encrypt helpers you used when Health Check succeeded.
// Keep the function signatures identical.
//
// They MUST:
//   - decryptFlowRequest(event) -> return a JS object like:
//       { version:"3.0", action:"data_exchange", screen:"BOOK_SERVICE",
//         flow_token:"...", data:{ op:"submit_service_form", ...your fields... } }
//
//   - encryptFlowResponse(obj) -> return base64 string to send back.
//
// If you had them in another file, just import them instead.

async function decryptFlowRequest(event) {
  // TODO: PASTE YOUR WORKING DECRYPTION HERE
  // Example shape (remove this throw and return the real body):
  throw new Error("Please paste your working decryptFlowRequest() implementation here.");
}

async function encryptFlowResponse(clearJsonObject) {
  // TODO: PASTE YOUR WORKING ENCRYPTION HERE
  // Must return a base64-encoded encrypted string.
  throw new Error("Please paste your working encryptFlowResponse() implementation here.");
}

// ==========================
// 3) UTIL: safe JSON parse
// ==========================
const tryJson = (v) => {
  try { return JSON.parse(v); } catch { return null; }
};

// ==========================
// 4) Handler
// ==========================
export const handler = async (event, context) => {
  try {
    // Decrypt WhatsApp's payload to clear JSON
    const body = await decryptFlowRequest(event);

    // Expected body shape (Data API v3.0):
    // { version:"3.0", action:"data_exchange"|"health_check", screen:"BOOK_SERVICE"|...,
    //   flow_token:"...", data:{ op:"...", ...fields } }

    const { action, screen, flow_token, data = {} } = body || {};
    const { op = null, ...fields } = data;

    // ---- OPTIONAL: guard rails ----
    if (action !== "data_exchange" && action !== "health_check") {
      // Build a small error response (still must be encrypted base64)
      const errResp = { version: "3.0", screen, data: { status: "error", reason: "unsupported_action" } };
      const encErr = await encryptFlowResponse(errResp);
      return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: encErr };
    }

    // ==========================
    // 5) Forward to Make.com
    // ==========================
    // Send both meta + extracted fields so you can log/debug in Make.
    if (MAKE_WEBHOOK_URL) {
      await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "wa-flow",
          received_at: new Date().toISOString(),
          meta: { action, screen, op, flow_token },
          fields,            // <— user answers live here
          incoming_raw: body // <— full decrypted body (handy for audits)
        })
      }).catch(() => {}); // do not block the flow on analytics failure
    }

    // ==========================
    // 6) Build Flow response
    // ==========================
    // Return next screen + any data you want to show there.
    const clearResponse = {
      version: "3.0",
      screen: "SERVICE_SUCCESS",
      data: { status: "ok" }
    };

    const encrypted = await encryptFlowResponse(clearResponse);

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: encrypted
    };

  } catch (err) {
    // If encryption helpers threw before we could encrypt a response,
    // we still return 200 with a best-effort generic encrypted body (if possible).
    // Otherwise log and fail.
    console.error("wa-flow-service error:", err?.stack || err);

    try {
      const fallback = await encryptFlowResponse({
        version: "3.0",
        screen: "SERVICE_SUCCESS",
        data: { status: "ok" }
      });
      return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: fallback };
    } catch {
      return { statusCode: 500, body: "Encryption failure" };
    }
  }
};
