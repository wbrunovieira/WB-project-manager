#!/bin/sh
set -e

if [ -f prisma-cli/node_modules/prisma/build/index.js ]; then
  echo "Running Prisma migrations..."
  node prisma-cli/node_modules/prisma/build/index.js migrate deploy || echo "Warning: migrations skipped (database may already be up to date)"
fi

echo "Starting application..."
exec "$@"
