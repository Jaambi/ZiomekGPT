#!/usr/bin/env bash
set -euo pipefail
echo "== Netlify CLI deploy =="
netlify login || true
netlify init || true
if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Ustawiam OPENAI_API_KEY w Netlify (wklej swój klucz)"
  read -p "OPENAI_API_KEY: " KEY
  netlify env:set OPENAI_API_KEY "$KEY"
fi
# Model domyślny gpt-4o (możesz nadpisać)
netlify env:set OPENAI_MODEL "${OPENAI_MODEL:-gpt-4o}" || true
# Opcjonalne zawężenie CORS
if [ -n "${CORS_ALLOW_ORIGIN:-}" ]; then
  netlify env:set CORS_ALLOW_ORIGIN "$CORS_ALLOW_ORIGIN"
fi
netlify deploy --build --prod
