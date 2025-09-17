# Optimized Dockerfile for Render deployment
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        libcairo2-dev \
        libpango1.0-dev \
        libgdk-pixbuf-xlib-2.0-dev \
        libffi-dev \
        shared-mime-info \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/logs

# Set minimal environment variables for build
ENV DEBUG=False
ENV SECRET_KEY=django-insecure-temp-key-for-build
ENV ALLOWED_HOSTS=unipay-1gus.onrender.com,*.onrender.com
ENV DATABASE_URL=sqlite:///db.sqlite3

# Try to collect static files, but don't fail if it doesn't work
RUN python manage.py collectstatic --noinput || echo "Static files collection skipped"

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check removed for free tier compatibility

# Start command optimized for Render free tier
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "30", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "100"]
