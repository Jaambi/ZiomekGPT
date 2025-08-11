#!/usr/bin/env bash
set -euo pipefail
SITE=${1:-}
if [ -z "$SITE" ]; then echo "Użycie: ./deploy.sh <site-name>"; exit 1; fi
if ! command -v netlify >/dev/null 2>&1; then npm i -g netlify-cli; fi
if ! netlify sites:list | grep -q "$SITE"; then netlify sites:create --name "$SITE"; fi
netlify env:set OPENAI_API_KEY "${OPENAI_API_KEY:-}"
netlify env:set NODE_VERSION "20"
netlify deploy --prod --dir . --message "ZiomekGPT deploy"
