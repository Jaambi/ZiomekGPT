# Ziomek GPT – Full Power (OpenAI, Netlify + GitHub)

## Najszybsze wdrożenie (iPhone-friendly)
1) GitHub → utwórz repo → Upload całego folderu.
2) Netlify → Add new site → Import from Git → wskaż repo.
3) Site settings → Environment variables:
   - `OPENAI_API_KEY` = Twój klucz
   - (opcjonalnie) `OPENAI_MODEL` = `gpt-4o`
   - (opcjonalnie) `CORS_ALLOW_ORIGIN` = `https://twoja-domena.netlify.app`
4) Deploy włączy się automatycznie.

## Endpointy
- Front: `/`
- API: `/.netlify/functions/chat`
- Health: `/.netlify/functions/health`

## UI
- Szybkie pokrętła: `temperature`, `max_tokens` w pasku formularza.
