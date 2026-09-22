# AI 活动策划助手（Event Planner MVP）

一个面向新手的 AI 活动策划工具，用「**AI 提议 + 人类决定**」的方式，把一次活动从需求分析一路推进到最终审批。

首个实战场景：**莫伊大学孔子学院 2026 年中秋节活动策划**。

---

## 这是什么

用户填写活动简报（名称、机构、日期、预算、地点、人群等），系统随后调用多个 AI Agent 依次完成：需求分析 → 方案设计 → 评审 → 事实核验 → 详细方案 → 预算 → 文案 → 海报 → 最终质检，中间有两道**必须真人点击**的审批关卡。AI 全程只提议、不拍板。

## 核心原则

1. **AI 永远不替人类做最终决定**——两道 Human Gate（选方向、最终批准）只能由用户点击。
2. **不把 AI 假设当事实**——所有外部信息要么有来源，要么标 `UNKNOWN` / `ASSUMPTION` / `CONFLICT`，绝不凭常识断定。
3. **不编造**——日期、地点、联系人、电话、费用、报名方式缺失时用 `[待确认]` 占位。
4. 完整规则见 [AI_DEVELOPMENT_RULES.md](rules/AI_DEVELOPMENT_RULES.md)。

## 技术栈

- **Next.js 16**（App Router）+ **TypeScript** + **Tailwind CSS 4**
- **Prisma 6** + **SQLite**
- **统一 AI Provider 层**（`lib/ai/provider.ts`），直连 **DeepSeek 官方 API**（`deepseek-v4-pro`）
- 架构说明见 [docs/AI接入说明.md](docs/AI接入说明.md)

架构链路：

```
Web App → lib/ai/provider.ts (generateText) → DeepSeek API
```

业务代码零 Provider 绑定；换模型只改 `EP_AI_BASE_URL` / `EP_AI_MODEL`。

## Agent 与人工关卡

全部 Agent（名称、文件、输入、输出）以 `lib/agents/registry.ts` 为**唯一事实来源**，不在此重复；每个 Agent 的字段与规则见各 `lib/agents/*.ts` 的 prompt。流水线顺序见下方「完整工作流」。

**两道人工关卡**：
- **Human Gate 1**——「请选择活动方向」：用户在多个方案中点击选择（或全部驳回），系统绝不自动选。
- **Human Gate 2**——「最终人工审批」：用户点击 APPROVE / REJECT / REQUEST CHANGES。

## 完整工作流

```
创建项目
  → PM 分析（已知/未知/假设）
  → 资料调研（联网检索，填充研究库 + 事实账本）
  → 生成多个方案（2~4 个）
  → AI 评审（打分 + 推荐）
  → 事实核验（外部事实分类）
  → 🧑 Human Gate 1：人工选择方向
  → 生成 16 章节详细方案
  → 生成预算（10 类 + 自动合计）
  → 生成宣传文案（9 项）
  → 生成海报内容 + 海报图片（文生图，支持历史版本与图生图修改）
  → Final QA（PASS/WARNING/BLOCK）
  → 🧑 Human Gate 2：最终批准 / 驳回 / 要求修改
```

## 快速开始

### 环境要求

- Node.js 22+

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.example 为 .env 并填写）
cp .env.example .env

# 3. 生成 Prisma 客户端 + 建库
npx prisma generate
npx prisma db push

# 4. 启动
npm run dev
```

浏览器打开 `http://localhost:3000`。

> 若换机器重装依赖后，需重跑 `npx prisma generate && npx prisma db push` 重建数据库（npm 11 默认拦截安装脚本，Prisma 的 postinstall 不会自动跑）。

### 测试 AI 连接

打开 `http://localhost:3000/ai-test`，点「测试 AI」，看到「状态：已连接」即代表网关通了。

### 通过临时链接分享给他人（可选）

应用默认只能在 `localhost:3000` 本机访问。想让**没装环境的人**（比如参与体验的老师）通过公网链接直接打开，可以用 [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)（cloudflared）把本地端口临时暴露出去。

**最简单的方式（推荐）**：双击项目里的 `start-share.bat`，脚本会自动启动网页 + 建立公网隧道，把窗口里出现的 `https://xxx.trycloudflare.com` 链接发给别人即可。

**手动分三步：**

1. 启动应用（`npm run dev`），确认 `localhost:3000` 已监听。

2. 下载并启动 cloudflared：

```bash
# 下载 cloudflared（Windows amd64）。GitHub 直连可能很慢，可加 ghproxy 镜像前缀加速：
curl -L -o cloudflared.exe "https://ghproxy.net/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"

# 启动隧道（若 cloudflared 不在 PATH，用完整路径 ./cloudflared.exe）
cloudflared tunnel --url http://localhost:3000
```

3. 从 cloudflared 输出里找到形如 `https://xxx.trycloudflare.com` 的链接，发给别人即可打开。

**注意**：

- 这是**临时链接**，每次重启 cloudflared 都会生成全新的随机域名，旧链接随即失效。
- 需**一直开着**应用和 cloudflared 两个进程，链接才有效；电脑也不能关机或睡眠。
- 免费快速隧道**无可用性保证**，且需每小时至少访问一次以保持存活，不适合长期或正式使用。
- 一旦开启，应用即**对公网可见**，其中的报名信息（机构、联系人、预算等）他人也能看到，演示时注意。

## 环境变量

见 `.env.example`（每个变量都有注释，以它为准）。项目**不直接持有任何模型 Provider 的 Key**，也不要把真实 Key 写进前端、数据库或 `.env.example`。

## 目录结构与数据模型

- **目录结构**：见 `rules/CONTRIBUTING.md` 的「目录结构」（唯一来源）。
- **数据模型**：见 `prisma/schema.prisma`（表名、字段、关系都在那里，不在此重复）。

## 文档导航

| 文件 | 是什么 |
|---|---|
| `rules/AI_DEVELOPMENT_RULES.md` | 开发铁律（AI 开发必须遵守） |
| `rules/CONTRIBUTING.md` | 工程规范（目录结构 / 命名 / 文档规范 / 如何新增 Agent） |
| `rules/PROJECT_SPEC.md` | 验收标准（怎么算做完） |
| `TASKS.md` | 按优先级排序的待办清单 |
| `PROGRESS.md` | 进度记录（当前状态 + 变更日志） |
| `CLAUDE.md` | 给 Claude Code 的说明（自治循环 + 命令 + 架构大图） |
| `docs/AI接入说明.md` | AI 接入用户说明书（怎么用上 AI） |
| `docs/提示词说明.md` | Agent 提示词约定（骨架 / 反幻觉原则） |
| `docs/数据模型与数据流.md` | 表关系结构 + 提示词数据流（只写结构原则，链接代码） |

## 已知说明 / 踩坑记录

- **`deepseek-v4-pro` 是推理模型**，会先"思考"再输出。各 Agent 的 `max_tokens` 已统一设为 300000，provider 层也会检测截断并提示。
- **`next build`/`next dev` 在 Claude 沙箱里跑会报 EXDEV**（写 `%APPDATA%\nextjs-nodejs` 失败），你自己的终端里无此问题。
- **杀毒/清理程序可能清空 `node_modules`**：若报「`next` 不是内部或外部命令」，重跑 `npm install` 即可。
- **Researcher（资料调研）已实现**：联网检索（Tavily）填充 `ResearchItem` / `Fact`，来源可追溯；未配置 `EP_TAVILY_API_KEY` 时研究库与事实账本为空，各 Agent 会把外部信息严格标为 `UNKNOWN`/`ASSUMPTION`。

## 下一步可做的事

- 海报图片导出 PNG / PDF、多套设计主题
- 预算、文案等模块的历史版本对比界面
