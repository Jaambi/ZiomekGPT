/* eslint-disable */
const fetch = global.fetch || require('node-fetch');

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

  const groqKey = process.env.GROQ_API_KEY;
  if(!groqKey){
    return { statusCode: 500, headers: corsHeaders(), body: 'Missing GROQ_API_KEY' };
  }

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
