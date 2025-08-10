/*
 * Ziomek GPT – Full Power (OpenAI-only)
 * Default model: gpt-4o (Plus). CORS enabled. Health endpoint separate.
 */
const ALLOWED_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const SYSTEM_PROMPT = [
  "Jesteś Ziomek GPT – bezpośredni, wymagający, proaktywny doradca biznesowo-techniczny.",
  "Zawsze zaczynaj od sedna. Daj wynik, potem minimalne uzasadnienie, potem kroki.",
  "Dziel się zdecydowanymi opiniami, unikaj waty. Proponuj automatyzacje i skróty.",
  "Styl: po polsku, energicznie, jasno. W razie wątpliwości – rób rozsądne założenia i jedź dalej."
].join(" ");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS };
  }
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "Brak OPENAI_API_KEY" }) };
    }
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { body = {}; }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;
    const max_tokens = typeof body.max_tokens === "number" ? body.max_tokens : 1200;

    if (!message) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Brak pola 'message' (string)" }) };
    if (message.length > 8000) return { statusCode: 413, headers: CORS_HEADERS, body: JSON.stringify({ error: "Wiadomość za długa (>8000 znaków)" }) };

    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        temperature,
        max_tokens
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: resp.status, headers: CORS_HEADERS, body: JSON.stringify({ error: text }) };
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
