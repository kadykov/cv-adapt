#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=postgres psql -h db -U postgres -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - initializing database..."
cd /workspaces/cv-adapt/web-interface/backend
python scripts/init_db.py

echo "Starting application..."
exec "$@"
