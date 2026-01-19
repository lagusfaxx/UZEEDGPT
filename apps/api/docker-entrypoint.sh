#!/usr/bin/env sh
set -e

# NOTE: Prisma migration is safe to run on startup; it does NOT generate client.
# Client must already exist from build stage.
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] prisma migrate deploy"
  ./node_modules/.bin/prisma migrate deploy
fi

exec "$@"
