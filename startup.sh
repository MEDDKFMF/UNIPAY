#!/bin/bash

# Startup script for Render deployment
# This script runs migrations and starts the server

echo "Starting Unipay Backend..."

# Run migrations first
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the application
echo "Starting Gunicorn server..."
exec gunicorn core.wsgi_optimized:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --timeout 30 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload
