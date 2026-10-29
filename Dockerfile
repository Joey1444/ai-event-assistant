# 生产镜像：Next.js 16 + Prisma + SQLite
# 构建：docker build -t ai-event-assistant .
# 运行：docker run -p 3000:3000 -v aes-data:/app/data \
#         -e EP_PUBLIC_MODE=1 -e EP_AI_API_KEY=... ai-event-assistant

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# npm 11 会拦截 prisma 的 postinstall，这里显式放开，避免 generate 被跳过
ENV NPM_CONFIG_IGNORE_SCRIPTS=false
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# 构建期 Prisma 只需要 schema，不连数据库
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 数据目录：SQLite 落在这里，挂载卷即可持久化
ENV EP_DATABASE_URL=file:/app/data/prod.db
COPY --from=build /app ./
RUN mkdir -p /app/data
EXPOSE 3000
# 启动时把 schema 同步到 SQLite（幂等），再起正式服务
CMD ["sh", "-c", "npx prisma db push --skip-generate && exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
