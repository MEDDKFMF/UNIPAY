#!/bin/bash

# Build script for Render deployment
set -e

echo "Starting build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Set environment variables for build
export DEBUG=False
export SECRET_KEY=django-insecure-temp-key-for-build
export ALLOWED_HOSTS=*

# Change to backend directory
cd backend

# Create static and media directories
mkdir -p staticfiles media

# Try to collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static files collection skipped"

echo "Build completed successfully!"
