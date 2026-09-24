@echo off
chcp 65001 >nul
cd /d "%~dp0"
title event-planner 首次安装

echo ================================================
echo   event-planner 首次安装
echo ================================================
echo.

echo [1/5] 准备 Node.js 运行环境 ...
where node >nul 2>nul
if errorlevel 1 goto download_node
node -e "var m=process.versions.node.split('.').map(Number);process.exit(m[0]>20||(m[0]===20&&m[1]>=9)?0:1)"
if errorlevel 1 goto download_node
echo       已检测到系统 Node.js，直接使用。
goto node_ready

:download_node
echo       未检测到合适的 Node.js，自动下载便携版（约 30MB，需联网）...
if exist runtime\node\node.exe goto use_local_node
if not exist runtime mkdir runtime
set "NODE_ARCH=x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "NODE_ARCH=arm64"
set "NODE_VER=v22.11.0"
echo       设备架构：%NODE_ARCH%，下载 Node.js %NODE_VER% ...
curl -L -o runtime\node.zip "https://nodejs.org/dist/%NODE_VER%/node-%NODE_VER%-win-%NODE_ARCH%.zip"
if errorlevel 1 (
    echo.
    echo   [错误] 下载 Node.js 失败，请检查网络后重新运行本脚本
    echo.
    pause
    exit /b 1
)
echo       解压中 ...
"%SystemRoot%\System32\tar.exe" -xf runtime\node.zip -C runtime
if errorlevel 1 (
    echo       [错误] 解压 Node.js 失败
    pause
    exit /b 1
)
for /d %%d in (runtime\node-v*) do ren "%%d" node
del runtime\node.zip

:use_local_node
set "PATH=%CD%\runtime\node;%PATH%"

:node_ready
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
