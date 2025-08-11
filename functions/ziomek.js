const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI = 'https://api.openai.com/v1';

exports.handler = async (event) => {
  const method = event.httpMethod || 'GET';
  const subpath = detectSubpath(event);
  if (!OPENAI_API_KEY) return j(500, { error: 'OPENAI_API_KEY missing' });

  try {
    if (subpath.startsWith('/chat') && method === 'POST') return await chat(event);
    if (subpath.startsWith('/image') && method === 'POST') return await image(event);
    if (subpath.startsWith('/tts') && method === 'POST') return await tts(event);
    if (subpath.startsWith('/transcribe') && method === 'POST') return await transcribe(event);

    // Fallbacks: decide by body shape on POST to base /api
    if ((subpath === '' || subpath === '/' ) && method === 'POST') {
      const body = safeJSON(event.body);
      if (body && (body.text || body.system)) return await chat(event);
      if (body && body.prompt) return await image(event);
    }

    return j(200, { ok: true, route: subpath });
  } catch (e) {
    return j(500, { error: String(e && e.message || e) });
  }
};

function detectSubpath(event){
  try {
    const url = new URL(event.rawUrl || '');
    const p = (url.pathname || '');
    return p.replace(/^\/\.netlify\/functions\/ziomek/,'').replace(/^\/api/,'') || '/';
  } catch {
    const p = (event.path || '');
    return p.replace(/^\/\.netlify\/functions\/ziomek/,'').replace(/^\/api/,'') || '/';
  }
}

function j(status, obj){ return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }; }
function safeJSON(b){ try { return JSON.parse(b || '{}'); } catch { return {}; } }

async function chat(event){
  const body = safeJSON(event.body);
  const messages = [
    { role: 'system', content: body.system || 'Jesteś Ziomek GPT.' },
    { role: 'user', content: body.text || '' }
  ];
  const r = await fetch(OPENAI + '/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':'Bearer '+OPENAI_API_KEY, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:'gpt-4o', messages, temperature:0.3 })
  });
  if(!r.ok) return j(r.status, { error: await r.text() });
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return j(200, { text });
}

async function image(event){
  const { prompt='futurystyczny mentor biznesu', size='1024x1024' } = safeJSON(event.body);
  const r = await fetch(OPENAI + '/images/generations', {
    method:'POST',
    headers:{ 'Authorization':'Bearer '+OPENAI_API_KEY, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:'gpt-image-1', prompt, size })
  });
  if(!r.ok) return j(r.status, { error: await r.text() });
  const data = await r.json();
  const b64 = data?.data?.[0]?.b64_json;
  if(!b64) return j(500, { error: 'no_image' });
  return j(200, { url: 'data:image/png;base64,'+b64 });
}

async function tts(event){
  const { text='Witaj', voice='alloy' } = safeJSON(event.body);
  const r = await fetch(OPENAI + '/audio/speech', {
    method:'POST',
    headers:{ 'Authorization':'Bearer '+OPENAI_API_KEY, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:'gpt-4o-mini-tts', voice, input:text, format:'mp3' })
  });
  if(!r.ok) return j(r.status, { error: await r.text() });
  const buf = Buffer.from(await r.arrayBuffer());
  return { statusCode:200, headers:{ 'Content-Type':'audio/mpeg' }, body: buf.toString('base64'), isBase64Encoded:true };
}

async function transcribe(event){
  const audio = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'binary');
  const boundary = '----ziomek'+Math.random().toString(16).slice(2);
  const parts = [];
  function add(name, value, filename, type){
    parts.push(Buffer.from(`--${boundary}\\r\\n`));
    if(filename){
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\\r\\nContent-Type: ${type}\\r\\n\\r\\n`));
      parts.push(value); parts.push(Buffer.from(`\\r\\n`));
    } else {
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\\r\\n\\r\\n${value}\\r\\n`));
    }
  }
  add('model','whisper-1');
  add('file', audio, 'audio.webm', 'audio/webm');
  parts.push(Buffer.from(`--${boundary}--`));
  const r = await fetch(OPENAI + '/audio/transcriptions', {
    method:'POST',
    headers:{ 'Authorization':'Bearer '+OPENAI_API_KEY, 'Content-Type':'multipart/form-data; boundary='+boundary },
    body: Buffer.concat(parts)
  });
  if(!r.ok) return j(r.status, { error: await r.text() });
  const data = await r.json();
  return j(200, { text: data?.text || '' });
}
