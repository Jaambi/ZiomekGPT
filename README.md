# ZiomekGPT Netlify – Groq API (darmowe)

## Jak uruchomić
1. Wgraj pliki do repo jako root (bez podfolderów).
2. Podłącz repo w Netlify: Build command: brak, Publish: `.`, Functions: `netlify/functions`.
3. W Netlify dodaj zmienną środowiskową:
   - `GROQ_API_KEY` = Twój klucz z https://console.groq.com/keys
4. Deploy.
5. Wejdź na stronę i testuj czat.

Model: `llama3-70b-8192` – darmowy, działa przez Groq API.
