#!/bin/bash
set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

IMAGE_NAME="lino-ionos-ber-app-01:5000/typischich-app-workshops:latest"

echo "🚀 Building image with Appwrite Config..."

docker build --no-cache \
  --build-arg VITE_APPWRITE_ENDPOINT="$VITE_APPWRITE_ENDPOINT" \
  --build-arg VITE_APPWRITE_PROJECT_ID="$VITE_APPWRITE_PROJECT_ID" \
  --build-arg VITE_APPWRITE_DATABASE_ID="$VITE_APPWRITE_DATABASE_ID" \
  --build-arg VITE_APPWRITE_WORKSHOP_COLLECTION_ID="$VITE_APPWRITE_WORKSHOP_COLLECTION_ID" \
  --build-arg VITE_APPWRITE_PARTICIPANT_COLLECTION_ID="$VITE_APPWRITE_PARTICIPANT_COLLECTION_ID" \
  -t typischich-app-workshops .

echo "🏷️ Tagging..."
docker tag typischich-app-workshops $IMAGE_NAME

echo "📤 Pushing..."
docker push $IMAGE_NAME

echo "🔄 Updating Server..."
ssh root@lino-ionos-ber-app-01 "cd /srv/stacks/typischich-app-workshops && docker compose pull && docker compose up -d"

echo "✅ Done!"