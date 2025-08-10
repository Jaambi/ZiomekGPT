const ALLOWED_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS_HEADERS };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method Not Allowed" }) };
  const ok = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ status: "ok", model, openai_key_present: ok, version: "2025-08-10-full" }) };
};
