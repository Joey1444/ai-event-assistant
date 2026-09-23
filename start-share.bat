@echo off
chcp 65001 >nul
title event-planner 一键启动
cd /d "%~dp0"

echo ================================================
echo   event-planner 一键启动
echo ================================================
echo.

if not exist node_modules\ (
    echo 未检测到依赖，请先双击 setup.bat 安装
    pause
    exit /b 1
)

echo [1/3] 停止旧的 dev server ...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -and ($_.CommandLine -match 'event-planner' -or $_.CommandLine -match 'run dev') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
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
echo.
call npm run dev

echo.
echo dev server 已停止。
pause
