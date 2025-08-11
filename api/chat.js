export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body);

    // Pobranie system prompt
    const fs = require('fs');
    const systemPrompt = fs.readFileSync('system_prompt.txt', 'utf-8');

    // Połączenie z API OpenAI
    const fetch = require('node-fetch');
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const json = await apiResponse.json();
    const reply = json.choices?.[0]?.message?.content || '[brak odpowiedzi]';

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
