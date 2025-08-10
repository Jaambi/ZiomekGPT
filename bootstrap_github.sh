#!/usr/bin/env bash
set -euo pipefail
echo "== Bootstrap GitHub repo =="
git init
git add .
git commit -m "Initial commit: Ziomek GPT Netlify app"
read -p "Podaj URL pustego repo (np. git@github.com:user/repo.git): " REM
git remote add origin "$REM"
git branch -M main
git push -u origin main
echo "Teraz ustaw w repo secrets NETLIFY_AUTH_TOKEN i NETLIFY_SITE_ID, albo połącz repo z Netlify przez panel."
