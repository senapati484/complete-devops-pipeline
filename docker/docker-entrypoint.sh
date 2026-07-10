#!/bin/sh
set -e

echo "Running database migrations..."
# prisma migrate deploy uses versioned migration files — safe for production.
# Falls back to db push if no migrations directory exists (first run / dev).
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy
else
  echo "No migrations found — running prisma db push (first-time setup)"
  npx prisma db push --skip-generate
fi

echo "Starting application..."
exec node server.js
