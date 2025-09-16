# PowerShell script to run Django server
Write-Host "Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

Write-Host "Starting Django development server..." -ForegroundColor Green
python manage.py runserver

Read-Host "Press Enter to exit"
