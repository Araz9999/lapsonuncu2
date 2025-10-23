@REM @echo off
@REM echo Starting Naxtap Marketplace...

@REM echo Stopping any existing processes...
@REM taskkill /f /im node.exe 2>nul

@REM echo Starting backend server...
@REM start "Backend" cmd /k "node server.js"

@REM echo Waiting 3 seconds...
@REM timeout /t 3 /nobreak >nul

@REM echo Starting frontend...
@REM start "Frontend" cmd /k "npx expo start --web --clear --no-dev --minify"

@REM echo.
@REM echo Both servers are starting!
@REM echo Backend: http://localhost:3001
@REM echo Frontend: Check the Expo output for the web URL
@REM echo.
@REM pause
