@echo off
chcp 65001 >nul
cd /d "%~dp0"
title event-planner 首次安装

echo ================================================
echo   event-planner 首次安装
echo ================================================
echo.

echo [1/5] 检查 Node.js ...
where node >nul 2>nul
if errorlevel 1 (
    echo       未检测到 Node.js，请先安装 Node.js 20.9 或更高版本
    pause
    exit /b 1
)
node -e "var m=process.versions.node.split('.');process.exit(m[0]*1>=20&&m[1]*1>=9?0:1)"
if errorlevel 1 (
    echo       Node.js 版本过低，请安装 20.9 或更高版本
    pause
    exit /b 1
)
echo       完成。

echo.
echo [2/5] 准备 .env 配置文件 ...
if not exist .env (
    copy .env.example .env >nul
    echo       已复制 .env.example 为 .env（稍后填 key 或在 /ai-test 页面配置）
) else (
    echo       .env 已存在，跳过
)
echo       完成。

echo.
echo [3/5] 安装依赖（npm ci）...
call npm ci
if errorlevel 1 (
    echo       依赖安装失败，请检查上方报错
    pause
    exit /b 1
)
echo       完成。

echo.
echo [4/5] 生成 Prisma 客户端 ...
call npx prisma generate
if errorlevel 1 (
    echo       Prisma 客户端生成失败，请检查上方报错
    pause
    exit /b 1
)
echo       完成。

echo.
echo [5/5] 初始化数据库（prisma db push）...
call npx prisma db push
if errorlevel 1 (
    echo       数据库初始化失败，请检查上方报错
    pause
    exit /b 1
)
echo       完成。

echo.
echo ================================================
echo   安装完成
echo   首次使用请编辑 .env 填 key，或启动后打开
echo   http://localhost:3000/ai-test 配置模型
echo   以后双击 start-share.bat 即可启动
echo ================================================
pause
