@echo off
title Share Project

cd /d "%~dp0"

echo ============================================
echo   Share this project with others
echo ============================================
echo.
echo   Step 0: Open CCSwitch app FIRST !!!
echo.
echo   [1/3] Starting the website...
start "Website - DO NOT CLOSE" cmd /k "npm run dev"

echo   [2/3] Waiting 15 seconds for the website...
timeout /t 15 /nobreak >nul

echo   [3/3] Creating the public link...
echo.
echo   >>> A link like https://xxxx.trycloudflare.com will appear below <<<
echo   >>> Copy it and send to others <<<
echo.
echo   Keep BOTH windows open. Do NOT shut down or sleep the PC.
echo   The link changes every time you rerun this script.
echo   If it does not open: wait 1 minute, or close both windows and rerun.
echo.
cloudflared.exe tunnel --url http://localhost:3000

pause
