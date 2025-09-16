@echo off
echo Setting up Invoice Platform Development Environment...

echo.
echo 1. Creating Python virtual environment...
python -m venv venv

echo.
echo 2. Activating virtual environment...
call venv\Scripts\activate

echo.
echo 3. Upgrading pip...
python -m pip install --upgrade pip

echo.
echo 4. Installing development dependencies...
pip install -r backend\requirements-dev.txt

echo.
echo 5. Setting up environment variables...
set DEBUG=True
set SECRET_KEY=dev-secret-key-change-in-production
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoice_platform
set REDIS_URL=redis://localhost:6379/0

echo.
echo 6. Running Django migrations...
cd backend
python manage.py makemigrations
python manage.py migrate

echo.
echo 7. Creating superuser...
python manage.py createsuperuser --noinput --username admin --email admin@example.com

echo.
echo 8. Installing frontend dependencies...
cd ..\frontend
npm install

echo.
echo Setup complete! 
echo.
echo To start the development servers:
echo 1. Backend: cd backend && python manage.py runserver
echo 2. Frontend: cd frontend && npm start
echo 3. Or use Docker: docker-compose up
echo.
pause 