@echo off
echo Starting UniPay Invoice Platform locally...

echo.
echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python manage.py runserver 127.0.0.1:8000"

echo.
echo Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
