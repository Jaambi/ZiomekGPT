/* eslint-disable */
const fetch = global.fetch || require('node-fetch');

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

const MODES = {
  "default": "Jesteś Ziomek GPT. Krótko, konkretnie, po polsku. Udzielasz odpowiedzi rzeczowo, bez ozdobników.",
  "dev-pro": "Jesteś Ziomek GPT w trybie DEV-PRO. Działasz jak starszy inżynier. Zawsze: 1) diagnoza, 2) krótka lista kroków, 3) gotowy kod/diff, 4) testy i weryfikacja. Krótko i bez zbędnych słów.",
  "hack": "Jesteś Ziomek GPT w trybie HACK. Cel: szybka diagnostyka i naprawa. Proponujesz hipotezy, komendy, logi do zebrania, minimalne poprawki i testy.",
  "fin": "Jesteś Ziomek GPT w trybie FIN. Liczysz koszty, marże, ROI, TCO. Podajesz liczby i wzory. Wynik w tabeli gdy to sensowne.",
  "elite": "Jesteś Ziomek GPT w trybie ELITE. Decyzje, ryzyka, alternatywy, plan A/B. Minimum słów, maksimum treści.",
  "psycholog": "Jesteś Ziomek GPT w trybie PSYCHOLOG. Zadajesz precyzyjne pytania sokratejskie, strukturyzujesz myśli, nadajesz zadania.",
  "motywacja": "Jesteś Ziomek GPT w trybie MOTYWACJA. Tworzysz minimum-viable plan działania na dziś, 3 kroki, miary sukcesu.",
  "vision": "Jesteś Ziomek GPT w trybie VISION. Definiujesz wizję produktu, USP, roadmapę w punktach, KPI i ryzyka."
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Only POST' };
  }

  let payload;
  try{ payload = JSON.parse(event.body || '{}'); }
  catch{ return { statusCode: 400, headers: corsHeaders(), body: 'Invalid JSON' }; }

  const userMsg = (payload.message || '').toString().slice(0, 6000);
  const mode = (payload.mode || 'default');
  const temperature = typeof payload.temperature === 'number' ? payload.temperature : 0.2;
  const maxTokens = Math.max(64, Math.min(4096, parseInt(payload.max_tokens || 512,10) || 512));

  if(!userMsg){
    return { statusCode: 400, headers: corsHeaders(), body: 'message required' };
  }

  const groqKey = process.env.GROQ_API_KEY;
  if(!groqKey){
    return { statusCode: 500, headers: corsHeaders(), body: 'Missing GROQ_API_KEY' };
  }

  const systemPrompt = MODES[mode] || MODES.default;

  try{
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + groqKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg }
        ],
        temperature,
        max_tokens: maxTokens
      })
    });

    if(!resp.ok){
      const errText = await resp.text();
      return { statusCode: resp.status, headers: corsHeaders(), body: 'Upstream error: ' + errText };
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      body: JSON.stringify({ reply, mode, temperature, max_tokens: maxTokens })
    };
  }catch(e){
    return { statusCode: 500, headers: corsHeaders(), body: 'Server error: ' + e.message };
  }
};
