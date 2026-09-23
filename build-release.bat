@echo off
chcp 65001 >nul
cd /d "%~dp0"
title event-planner 打包 release

if not exist release mkdir release
del /q release\event-planner-v1.0.0.zip 2>nul

tar -a -c -f release\event-planner-v1.0.0.zip ^
  --exclude=node_modules --exclude=.next --exclude=.git ^
  --exclude=.claude --exclude=cloudflared.exe --exclude=release ^
  --exclude=*.db --exclude=prisma/dev.db ^
  --exclude=.env --exclude=.env.tmp --exclude=tsconfig.tsbuildinfo ^
  --exclude=next-env.d.ts --exclude=*.log ^
  app components lib prisma public rules docs ^
  package.json package-lock.json .npmrc .gitignore .env.example ^
  next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs ^
  verify.sh setup.bat start-share.bat README.md CLAUDE.md AGENTS.md TASKS.md PROGRESS.md

if errorlevel 1 (
  echo [失败] 打包出错，请检查上方 tar 输出。
  pause
  exit /b 1
)

echo.
echo [完成] 已生成 release\event-planner-v1.0.0.zip
echo 解压后首次双击 setup.bat，之后双击 start-share.bat 启动。
echo.
pause
