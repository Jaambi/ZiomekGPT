/* eslint-disable */
const fetch = global.fetch || require('node-fetch'); // Netlify Node 18 ma global fetch, fallback dla lokalnego testu

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Only POST' };
  }

  let payload;
  try{
    payload = JSON.parse(event.body || '{}');
  }catch{
    return { statusCode: 400, headers: corsHeaders(), body: 'Invalid JSON' };
  }

  const userMsg = (payload && payload.message || '').toString().slice(0, 4000);
  if(!userMsg){
    return { statusCode: 400, headers: corsHeaders(), body: 'message required' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey){
    return { statusCode: 500, headers: corsHeaders(), body: 'Missing OPENAI_API_KEY' };
  }

  try{
    // Minimalne wywołanie Chat Completions bez zależności
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Jesteś Ziomek GPT. Odpowiadasz krótko, konkretnie, po polsku.' },
          { role: 'user', content: userMsg }
        ],
        temperature: 0.2
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
      body: JSON.stringify({ reply })
    };
  }catch(e){
    return { statusCode: 500, headers: corsHeaders(), body: 'Server error: ' + e.message };
  }
};
