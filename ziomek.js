// Netlify Function in project root. Exposed at /.netlify/functions/ziomek
// Routes via /api/* configured in netlify.toml
const API_KEY = process.env.OPENAI_API_KEY; // never expose to client
const OPENAI = "https://api.openai.com/v1";

function cors(event) {
  const origin = event.headers.origin || '*';
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

async function readBody(event) {
  if ((event.headers['content-type'] || '').includes('application/json')) {
    return JSON.parse(event.body || '{}');
  }
  return null;
}

async function handleChat(event) {
  const contentType = event.headers['content-type'] || '';
  let system = '', user = '', mode = '';
  let imageBlob = null, imageBase64 = null;

  if (contentType.startsWith('multipart/form-data')) {
    // Netlify parses? We will parse a simple boundary-less body using busboy-esque approach is heavy.
    // Instead rely on raw base64 by FileReader in client? We used FormData so we need parsing.
    // Use 'form-data-parser' minimal. But avoid deps: Netlify provides event.isBase64Encoded and raw body.
    const boundary = contentType.split('boundary=')[1];
    const buf = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
    const parts = buf.toString('binary').split('--' + boundary);
    for (const part of parts) {
      if (part.includes('name="system"')) {
        system = /\r\n\r\n([\s\S]*?)\r\n$/.exec(part)?.[1] || system;
      }
      if (part.includes('name="user"')) {
        user = /\r\n\r\n([\s\S]*?)\r\n$/.exec(part)?.[1] || user;
      }
      if (part.includes('name="mode"')) {
        mode = /\r\n\r\n([\s\S]*?)\r\n$/.exec(part)?.[1] || mode;
      }
      if (part.includes('name="image"')) {
        const match = /\r\n\r\n([\s\S]*?)\r\n$/.exec(part);
        if (match) {
          imageBase64 = Buffer.from(match[1], 'binary').toString('base64');
        }
      }
    }
  } else {
    const body = await readBody(event);
    system = body.system || '';
    user = body.user || '';
    mode = body.mode || '';
    imageBase64 = body.imageBase64 || null;
  }

  const messages = [
    { role: "system", content: system },
    { role: "user", content: [
        ...(imageBase64 ? [{ type: "input_image", image_url: { url: `data:image/png;base64,${imageBase64}` } }] : []),
        { type: "text", text: user }
      ] }
  ];

  const model = "gpt-4o"; // fallback compatible model
  const r = await fetch(`${OPENAI}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3
    })
  });
  if (!r.ok) {
    const err = await r.text();
    return { statusCode: r.status, headers: cors(event), body: JSON.stringify({ error: err }) };
  }
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content || "";
  return { statusCode: 200, headers: { "Content-Type":"application/json", ...cors(event) }, body: JSON.stringify({ text, visionNotes: imageBase64 ? "Analiza obrazu włączona." : null }) };
}

async function handleImage(event) {
  const body = await readBody(event);
  const prompt = body?.prompt || "ciemny futurystyczny mentor biznesu, realistyczny, styl fotograficzny";
  // Use Images API (gpt-image-1)
  const r = await fetch(`${OPENAI}/images/generations`, {
    method:"POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    })
  });
  if (!r.ok) {
    const err = await r.text();
    return { statusCode: r.status, headers: cors(event), body: JSON.stringify({ error: err }) };
  }
  const data = await r.json();
  const b64 = data.data?.[0]?.b64_json;
  return { statusCode:200, headers:{ "Content-Type":"application/json", ...cors(event) }, body: JSON.stringify({ url: `data:image/png;base64,${b64}` }) };
}

async function handleTTS(event) {
  const body = await readBody(event);
  const text = body?.text || "Witaj w Ziomku.";
  const r = await fetch(`${OPENAI}/audio/speech`, {
    method:"POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      format: "mp3"
    })
  });
  if (!r.ok) {
    const err = await r.text();
    return { statusCode: r.status, headers: cors(event), body: JSON.stringify({ error: err }) };
  }
  const arrayBuffer = await r.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
  return { statusCode:200, headers:{ "Content-Type":"application/json", ...cors(event) }, body: JSON.stringify({ audioBase64 }) };
}

async function handleTranscribe(event) {
  // multipart form with audio
  const contentType = event.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return { statusCode: 400, headers: cors(event), body: JSON.stringify({ error: 'multipart/form-data required' }) };
  }
  const boundary = contentType.split('boundary=')[1];
  const buf = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
  const parts = buf.toString('binary').split('--' + boundary);
  let audioBinary = null;
  for (const part of parts) {
    if (part.includes('name="audio"')) {
      const m = /\r\n\r\n([\s\S]*?)\r\n$/.exec(part);
      if (m) audioBinary = Buffer.from(m[1], 'binary');
    }
  }
  if (!audioBinary) {
    return { statusCode: 400, headers: cors(event), body: JSON.stringify({ error: 'audio missing' }) };
  }
  // OpenAI transcription (Whisper)
  const formBoundary = '----netlifyForm' + Math.random().toString(16).slice(2);
  const formParts = [];
  function addField(name, value, filename=null, type='text/plain') {
    formParts.push(Buffer.from(`--${formBoundary}\r\n`));
    if (filename) {
      formParts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: audio/webm\r\n\r\n`));
      formParts.push(value);
      formParts.push(Buffer.from(`\r\n`));
    } else {
      formParts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    }
  }
  addField('model', 'whisper-1');
  addField('file', audioBinary, 'speech.webm', 'audio/webm');
  formParts.push(Buffer.from(`--${formBoundary}--`));
  const r = await fetch(`${OPENAI}/audio/transcriptions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": `multipart/form-data; boundary=${formBoundary}` },
    body: Buffer.concat(formParts)
  });
  if (!r.ok) {
    const err = await r.text();
    return { statusCode: r.status, headers: cors(event), body: JSON.stringify({ error: err }) };
  }
  const data = await r.json();
  return { statusCode:200, headers:{ "Content-Type":"application/json", ...cors(event) }, body: JSON.stringify({ text: data.text || "" }) };
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(event) };
  }
  const path = new URL(event.rawUrl).pathname;
  if (path.endsWith('/chat')) return await handleChat(event);
  if (path.endsWith('/image')) return await handleImage(event);
  if (path.endsWith('/tts')) return await handleTTS(event);
  if (path.endsWith('/transcribe')) return await handleTranscribe(event);
  return { statusCode: 200, headers: { "Content-Type":"application/json", ...cors(event) }, body: JSON.stringify({ ok:true }) };
};
