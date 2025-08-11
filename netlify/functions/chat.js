
/**
 * Netlify Function: chat (Groq)
 * POST /.netlify/functions/chat
 * Body: { messages: [{role:"user"|"assistant"|"system", content:string}] }
 * Env: GROQ_API_KEY, GROQ_MODEL
 * API: https://api.groq.com/openai/v1/chat/completions (OpenAI-compatible)
 */
import fs from "fs";
import path from "path";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing GROQ_API_KEY env" }) };
  }

  try {
    const { messages = [] } = JSON.parse(event.body || "{}");

    // Load system prompt
    const roots = [
      process.cwd(),
      path.resolve(__dirname, "../../.."),
      path.resolve(__dirname, "../../../")
    ];
    let sp = "";
    for (const r of roots) {
      try {
        sp = fs.readFileSync(path.join(r, "system_prompt.txt"), "utf-8");
        if (sp) break;
      } catch {}
    }
    const sys = { role: "system", content: sp || "You are a helpful assistant." };

    const body = {
      model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
      messages: [sys, ...messages].slice(-40),
      temperature: 0.4
    };

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const text = await resp.text();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: text }) };
    }

    let data;
    try { data = JSON.parse(text); } catch { data = { choices:[{message:{content:text}}] }; }
    const reply = data.choices?.[0]?.message?.content ?? "";
    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
}
