
# Ziomek GPT – Netlify + Groq

## Szybki deploy
1) Wrzuć cały folder do repo GitHub.
2) Połącz repo z Netlify.
3) Ustaw zmienne środowiska w Netlify:
   - GROQ_API_KEY = ***Twój klucz Groq***
   - GROQ_MODEL = llama-3.1-70b-versatile (lub inne dostępne u Ciebie, np. llama-3.1-8b-instant, mixtral-8x7b-32768)
4) Deploy. Front na `/`, backend na `/.netlify/functions/chat`.

## Struktura
- `public/` – front-end (HTML/CSS/JS)
- `netlify/functions/chat.js` – serwerless handler do Groq Chat Completions
- `system_prompt.txt` – system prompt ładowany po starcie
- `netlify.toml` – konfiguracja Netlify

## Uwagi
- Endpoint Groq: https://api.groq.com/openai/v1/chat/completions (OpenAI-compatible schema).
- Nie commituj klucza API. Ustaw go wyłącznie jako env w Netlify.
