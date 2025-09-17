#!/bin/bash

# Startup script for Render deployment
# This script runs migrations and seeds the database

echo "Starting Unipay Backend..."

# Wait for database to be ready
echo "Waiting for database connection..."
python manage.py migrate --noinput

# Check if we need to seed the database
echo "Checking if database needs seeding..."

# Count existing users
USER_COUNT=$(python manage.py shell -c "from accounts.models import User; print(User.objects.count())" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -lt 5 ]; then
    echo "Database appears to be empty or incomplete. Seeding database..."
    python manage.py seed_database
    echo "Database seeding completed!"
else
    echo "Database already has data. Skipping seeding."
fi

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
