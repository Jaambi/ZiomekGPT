#!/usr/bin/env bash
set -euo pipefail
# Wymaga: npm i -g netlify-cli  oraz NETLIFY_AUTH_TOKEN w env lub 'netlify login'
# Użycie: ./deploy.sh my-ziomek-site
SITE_NAME=${1:-}
if [ -z "$SITE_NAME" ]; then
  echo "Użycie: ./deploy.sh <nazwa-strony-na-netlify>"; exit 1;
fi

# Inicjalizacja
if ! command -v netlify >/dev/null 2>&1; then
  echo "Zainstaluj Netlify CLI: npm i -g netlify-cli"; exit 1;
fi

# Tworzenie lub linkowanie strony
if ! netlify sites:list | grep -q "$SITE_NAME"; then
  netlify sites:create --name "$SITE_NAME"
fi

# Ustaw zmienne środowiskowe
if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Ustaw zmienną OPENAI_API_KEY w środowisku lub w panelu Netlify."
else
  netlify env:set OPENAI_API_KEY "$OPENAI_API_KEY"
fi

# Deploy
netlify deploy --dir . --prod --message "Deploy Ziomek AI ULTRA"
echo "Zakończono deploy."
