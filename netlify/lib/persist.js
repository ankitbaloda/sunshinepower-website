// netlify/lib/persist.js
// Lightweight persistence helper. In a serverless (Netlify) context you do not
// have durable local disk writes, so we forward submissions to an external
// webhook (e.g. Make.com, Zapier, your API) for storage (DB, Sheet, CRM, etc.).
//
// Set SERVICE_SUBMISSION_WEBHOOK_URL to a webhook endpoint that accepts JSON.
// Fallback: if not set, this becomes a no-op (you already have the raw forward
// earlier in the main handler via MAKE_WEBHOOK_URL if configured).

async function persistServiceSubmission(submission) {
  const url = process.env.SERVICE_SUBMISSION_WEBHOOK_URL;
  if (!url) return; // silent no-op when not configured
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    if (!res.ok) {
      console.warn("persistServiceSubmission non-2xx", res.status, await safeText(res));
    }
  } catch (err) {
    console.warn("persistServiceSubmission failed", err.message);
  }
}

async function safeText(res) {
  try { return await res.text(); } catch { return "<no-body>"; }
}

module.exports = { persistServiceSubmission };
