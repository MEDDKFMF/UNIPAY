"""
Optimized WSGI application for Render deployment.
Handles database connections and startup more gracefully.
"""

import os
import sys
from django.core.wsgi import get_wsgi_application
from django.db import connection
from django.core.exceptions import ImproperlyConfigured

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Get the WSGI application
application = get_wsgi_application()

# Test database connection on startup (non-blocking)
def test_database_connection():
    """Test database connection without blocking startup."""
    try:
        # Close any existing connections
        connection.close()
        # Test connection with a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("Database connection test successful")
    except Exception as e:
        print(f"Database connection test failed: {e}")
        # Don't raise the exception, just log it
        pass

# Test database connection in background
try:
    test_database_connection()
except Exception:
    # Ignore database connection errors during startup
    pass
