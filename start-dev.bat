@REM @echo off
@REM echo Starting Naxtap Development Environment...
@REM echo.

@REM echo Stopping any existing servers...
@REM taskkill /f /im node.exe 2>nul

@REM echo.
@REM echo Starting Backend Server on port 3001...
@REM start "Backend Server" cmd /k "node server.js"

@REM echo Waiting 3 seconds for backend to start...
@REM timeout /t 3 /nobreak >nul

@REM echo.
@REM echo Starting Frontend Server...
@REM start "Frontend Server" cmd /k "npx expo start --web"

@REM echo.
@REM echo ✅ Both servers are starting!
@REM echo Backend: http://localhost:3001
@REM echo Frontend: http://localhost:8083 (or check the Expo output)
@REM echo.
@REM echo Press any key to exit...
@REM pause >nul
