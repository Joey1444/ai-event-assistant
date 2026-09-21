@echo off
chcp 65001 >nul
title 分享活动策划项目

cd /d "%~dp0"

echo ==========================================
echo   分享活动策划项目给别人
echo ==========================================
echo.
echo 提醒：请先双击打开 CCSwitch 这个软件！
echo （它是电脑上的 AI 网关，不开的话 AI 功能用不了）
echo.

echo [1] 正在启动项目网页...
start "项目网页 - 别关这个窗口" cmd /k "npm run dev"

echo [2] 等网页起来（约 15 秒）...
timeout /t 15 /nobreak >nul

echo [3] 正在生成公网链接...
echo.
echo 下面会出现一行 https://xxxx.trycloudflare.com 的链接，
echo 复制它发给别人就能打开。
echo.
echo 注意：这个窗口和「项目网页」窗口都要一直开着，
echo      电脑也不能关机/睡眠，链接才有效。
echo      每次重新运行，链接会变成新的。
echo.
cloudflared.exe tunnel --url http://localhost:3000

pause
