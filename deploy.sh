#!/bin/bash
set -e  # Script stoppt sofort, wenn ein Fehler auftritt

# 1. Lade lokale .env Variablen
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

IMAGE_NAME="lino-ionos-ber-app-01:5000/typischich-app-workshops:latest"

echo "🚀 Building image with Supabase Keys..."
# WICHTIG: Die Variablen müssen hier übergeben werden
docker build --no-cache \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t typischich-app-workshops .

echo "🏷️ Tagging..."
docker tag typischich-app-workshops $IMAGE_NAME

echo "📤 Pushing..."
docker push $IMAGE_NAME

echo "🔄 Updating Server..."
ssh root@lino-ionos-ber-app-01 "cd /srv/stacks/typischich-app-workshops && docker compose pull && docker compose up -d"

echo "✅ Done!"