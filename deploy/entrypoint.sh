#!/bin/sh
set -eu

echo "[isms] waiting for postgres:5432…"
i=0
until node -e "
const net = require('net');
const s = net.connect(5432, 'postgres', () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 2000);
"; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[isms] database not ready after 60s" >&2
    exit 1
  fi
  sleep 1
done

echo "[isms] applying Prisma migrations…"
./node_modules/.bin/prisma migrate deploy

if [ -f ./database/extensions.sql ]; then
  echo "[isms] ensuring Postgres extensions…"
  ./node_modules/.bin/prisma db execute --file ./database/extensions.sql || \
    echo "[isms] extensions step skipped (non-fatal)"
fi

echo "[isms] starting app…"
exec "$@"
