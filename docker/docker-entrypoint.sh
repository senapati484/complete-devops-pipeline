#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss --skip-generate

echo "Starting application..."
exec node server.js
