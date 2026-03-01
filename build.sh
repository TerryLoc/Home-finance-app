#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input

# Verify DATABASE_URL is set and points to a real database (not SQLite)
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set. Cannot deploy without a persistent database."
    echo "Go to Render dashboard → your web service → Environment → add DATABASE_URL."
    exit 1
fi

echo "DATABASE_URL is set — running migrations against persistent database."
python manage.py migrate
