@echo off
echo Starting Myanmar Foodie Bot System...
echo.
echo 1. Starting Admin Dashboard...
start "Admin Dashboard" cmd /k "npm run admin"
echo.
echo 2. Starting Telegram Bot...
start "Telegram Bot" cmd /k "npm run bot"
echo.
echo Both services are starting in separate windows.
echo.
echo Admin Dashboard: http://localhost:3001
echo Telegram Bot: Running locally
echo.
echo Your Telegram ID: 7398914587 (Bot Admin)
echo.
pause
