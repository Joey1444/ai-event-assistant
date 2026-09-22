@echo off
chcp 65001 >nul
title event-planner 一键重启 + 局域网分享
cd /d "%~dp0"

echo ================================================
echo   event-planner 自动重启 + 局域网分享
echo ================================================
echo.

echo [1/3] 停止旧的 dev server ...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and ($_.CommandLine -match 'event-planner' -or $_.CommandLine -match 'run dev') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul
echo       完成。

echo.
echo [2/3] 重新生成 Prisma 客户端 ...
call npx prisma generate
if errorlevel 1 (
    echo       Prisma 生成失败，请检查上方报错。
    pause
    exit /b 1
)
echo       完成。

echo.
echo [3/3] 启动 dev server ...
echo       本机访问：   http://localhost:3000
echo       局域网分享：看下方启动输出的 Network 地址
echo.
call npm run dev

echo.
echo dev server 已停止。
pause
