
# Ziomek GPT – Netlify Front-end + Function

## Szybki deploy
1) Wrzuć cały folder do repo GitHub.
2) Połącz repo z Netlify.
3) Ustaw zmienne środowiska w Netlify:
   - OPENAI_API_KEY = ***Twój klucz OpenAI***
   - OPENAI_MODEL = gpt-4o-mini (lub inny)
4) Deploy. Odwiedź stronę. Chat działa przez funkcję `/.netlify/functions/chat`.

## Struktura
- `public/` – front-end (HTML/CSS/JS)
- `netlify/functions/chat.js` – serwerless handler do OpenAI
- `system_prompt.txt` – system prompt ładowany po starcie
- `netlify.toml` – konfiguracja Netlify

## Uwaga
- Nie commituj klucza API do repo. Ustaw go tylko jako env w Netlify.
