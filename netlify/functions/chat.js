
/**
 * Netlify Function: chat
 * POST /.netlify/functions/chat
 * Body: { messages: [{role:"user"|"assistant"|"system", content:string}] }
 * Env: OPENAI_API_KEY, OPENAI_MODEL
 */
import fs from "fs";
import path from "path";

const API_URL = "https://api.openai.com/v1/chat/completions";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
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
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [sys, ...messages].slice(-40),
      temperature: 0.4
    };

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: errText }) };
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
}
