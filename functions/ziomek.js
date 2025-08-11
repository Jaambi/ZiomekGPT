const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI = 'https://api.openai.com/v1';

exports.handler = async (event) => {
  const pathFull = event.path || '';
  const method = event.httpMethod || 'GET';
  const path = pathFull.replace(/^\/\.netlify\/functions\/ziomek/, '');

  if (!OPENAI_API_KEY) return json(500, { error: 'OPENAI_API_KEY missing' });

  try {
    if (path.startsWith('/chat') && method === 'POST') return await routeChat(event);
    if (path.startsWith('/image') && method === 'POST') return await routeImage(event);
    if (path.startsWith('/tts') && method === 'POST') return await routeTTS(event);
    if (path.startsWith('/transcribe') && method === 'POST') return await routeTranscribe(event);
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: String(e && e.message || e) });
  }
};

function json(status, obj) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}

async function routeChat(event) {
  const body = safeJSON(event.body);
  const messages = [
    { role: 'system', content: body.system || 'Jesteś Ziomek GPT.' },
    { role: 'user', content: body.text || '' }
  ];
  const r = await fetch(OPENAI + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages, temperature: 0.3 })
  });
  if (!r.ok) return json(r.status, { error: await r.text() });
  const data = await r.json();
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  return json(200, { text });
}

async function routeImage(event) {
  const body = safeJSON(event.body);
  const prompt = body.prompt || 'futurystyczny mentor biznesu';
  const size = body.size || '1024x1024';
  const r = await fetch(OPENAI + '/images/generations', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size })
  });
  if (!r.ok) return json(r.status, { error: await r.text() });
  const data = await r.json();
  const b64 = data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) return json(500, { error: 'no_image' });
  return json(200, { url: 'data:image/png;base64,' + b64 });
}

async function routeTTS(event) {
  const body = safeJSON(event.body);
  const text = body.text || 'Witaj';
  const voice = body.voice || 'alloy';
  const r = await fetch(OPENAI + '/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text, format: 'mp3' })
  });
  if (!r.ok) return json(r.status, { error: await r.text() });
  const buf = Buffer.from(await r.arrayBuffer());
  return { statusCode: 200, headers: { 'Content-Type': 'audio/mpeg' }, body: buf.toString('base64'), isBase64Encoded: true };
}

async function routeTranscribe(event) {
  const isB64 = !!event.isBase64Encoded;
  const audioBuf = Buffer.from(event.body || '', isB64 ? 'base64' : 'binary');

  const boundary = '----ziomek' + Math.random().toString(16).slice(2);
  const parts = [];
  function pushField(name, value, filename, type) {
    parts.push(Buffer.from(`--${boundary}\r\n`));
    if (filename) {
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`));
      parts.push(value);
      parts.push(Buffer.from(`\r\n`));
    } else {
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    }
  }
  pushField('model', 'whisper-1');
  pushField('file', audioBuf, 'audio.webm', 'audio/webm');
  parts.push(Buffer.from(`--${boundary}--`));

  const r = await fetch(OPENAI + '/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: Buffer.concat(parts)
  });
  if (!r.ok) return json(r.status, { error: await r.text() });
  const data = await r.json();
  return json(200, { text: data.text || '' });
}

function safeJSON(body) {
  try { return JSON.parse(body || '{}'); } catch { return {}; }
}
