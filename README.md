# Ziomek GPT-5 Plus – Komandos AI ULTRA

Single‑page PWA z czatem, trybami eksperckimi, DALL·E, TTS, STT. Backend to funkcja Netlify `ziomek.js` w katalogu głównym. Klucz OpenAI tylko w zmiennej środowiskowej `OPENAI_API_KEY` na Netlify.

## Szybki start
1. Ustaw w Netlify zmienną środowiskową `OPENAI_API_KEY`.
2. Wgraj ZIP do nowej strony w Netlify lub użyj Netlify CLI:  
   ```bash
   npm i -g netlify-cli
   ./deploy.sh <twoja-nazwa-strony>
   ```
3. Wejdź na `/` i testuj tryby: `/elite, /hack-pro, /fin-pro, /osint, /dev-pro, /media, /psycholog, /vision, /motywacja`.

## Architektura
- **Frontend**: `index.html`, `style.css`, `app.js`, `prompts.js`, PWA `manifest.json`, `sw.js`.
- **Backend**: Netlify Function `ziomek.js` z trasami `/api/chat`, `/api/image`, `/api/tts`, `/api/transcribe`.
- **Bezpieczeństwo**: brak klucza w kliencie. CORS + CSP. Offline cache dla UI.

## Testy lokalne
Możesz użyć `netlify dev` aby uruchomić funkcję i serwować PWA lokalnie.

## Uwaga o kluczach
Nie umieszczaj klucza w kodzie klienckim. Korzystaj z `OPENAI_API_KEY` po stronie serwera.
