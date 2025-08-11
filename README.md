# ZiomekGPT Netlify Fix

Minimalny, działający czat na Netlify Functions.

## Szybki start

1) Wgraj pliki do repo jako **root** (bez podfolderów).
2) Podłącz repo w Netlify. Build command: brak. Publish: `.`. Functions: `netlify/functions`.
3) Ustaw zmienną środowiskową:
   - `OPENAI_API_KEY` = Twój klucz
4) Deploy. Test na prod:
   - Wejdź na stronę, wyślij wiadomość.
   - Albo: `curl -X POST https://<site>/.netlify/functions/chat -H "Content-Type: application/json" -d '{"message":"Cześć"}'`

## Lokalnie
- `npm i -g netlify-cli`
- `netlify dev`
