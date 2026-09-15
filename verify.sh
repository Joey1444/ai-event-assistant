#!/usr/bin/env bash
# verify.sh —— 每次迭代的验证闸门（typecheck + lint + build）
#
# 用法：在项目根目录运行
#   bash verify.sh
# 或（Git Bash / WSL / macOS）：
#   ./verify.sh
#
# 注意：
# - 若在 Claude Code 的沙箱里跑 `next build` 报 `EXDEV: cross-device link not permitted`，
#   需要关沙箱执行（这是 Next.js 写 %APPDATA% 缓存导致的，不是代码问题）。
# - 首次或重装依赖后需先 `npx prisma generate`，否则 @prisma/client 类型缺失。
# - 本项目当前无单元测试；补测试后把 `npm test` 加进这里。

set -euo pipefail
cd "$(dirname "$0")"

echo "== 1/3 TypeScript 类型检查 =="
npx tsc --noEmit

echo "== 2/3 ESLint =="
npm run lint

echo "== 3/3 Next.js 生产构建 =="
npm run build

echo ""
echo "ALL CHECKS PASSED"
