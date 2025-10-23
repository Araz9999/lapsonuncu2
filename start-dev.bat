@echo off
echo Starting Naxtap Development Environment...
echo.

echo Stopping any existing servers...
taskkill /f /im node.exe 2>nul

echo.
echo Starting Backend Server on port 3001...
start "Backend Server" cmd /k "node server.js"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "npx expo start --web"

echo.
echo ✅ Both servers are starting!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8083 (or check the Expo output)
echo.
echo Press any key to exit...
pause >nul
