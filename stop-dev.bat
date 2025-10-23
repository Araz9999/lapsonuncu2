@echo off
echo Stopping Naxtap Development Environment...
echo.

echo Stopping all Node.js processes...
taskkill /f /im node.exe 2>nul

echo.
echo ✅ All servers stopped!
echo.
pause
