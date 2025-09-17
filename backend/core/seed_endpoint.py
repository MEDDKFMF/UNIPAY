"""
One-time seeding endpoint for production deployment.
This can be called after deployment to seed the database.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from accounts.models import User
import subprocess
import os

@csrf_exempt
@require_http_methods(["POST"])
def seed_database(request):
    """
    Endpoint to seed the database with initial data.
    This should only be called once after deployment.
    """
    try:
        # Check if database already has data
        user_count = User.objects.count()
        
        if user_count > 5:
            return JsonResponse({
                'success': False,
                'message': 'Database already has data. Seeding skipped.',
                'user_count': user_count
            })
        
        # Run the seed command
        result = subprocess.run(
            ['python', 'manage.py', 'seed_database'],
            capture_output=True,
            text=True,
            cwd=os.getcwd()
        )
        
        if result.returncode == 0:
            return JsonResponse({
                'success': True,
                'message': 'Database seeded successfully!',
                'output': result.stdout
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Seeding failed',
                'error': result.stderr
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        })
