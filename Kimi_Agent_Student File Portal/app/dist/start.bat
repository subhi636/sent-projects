@echo off
chcp 65001 >nul
echo ==========================================
echo   Sent Projects - مرقع
echo   Student Files Management System
echo ==========================================
echo.

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting server...
cd server
call npm install
start "Sent Projects Server" node server.js
cd ..

echo Server started on http://localhost:3001
echo.
echo Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo   Server is running!
echo   API: http://localhost:3001
echo.
echo   To access the website:
echo   1. Open your browser
echo   2. Navigate to: http://localhost:3001
echo.
echo   Admin Login:
echo   Email: subhi20102005@gmail.com
echo   Password: Qw07750783066w2005/4/15S
echo ==========================================
echo.
echo Press any key to stop the server...
pause >nul

taskkill /FI "WINDOWTITLE eq Sent Projects Server*" /F >nul 2>&1
echo Server stopped.
