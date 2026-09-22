# AI 接入说明（用户说明书）

> 这份说明写给「不熟悉 AI 接入」的你。目标：看完就懂你的 app 是怎么用上 AI 的。

## 一、一句话总结

你的活动策划 app **直接调用两个云端的 AI 服务**，各自用 `.env` 里的 API Key 调用，不经过任何本地中转软件：

| 用途 | 服务 | 走哪个函数 | 环境变量 |
|---|---|---|---|
| 文本（分析/方案/评审/文案等） | DeepSeek 官方 API | `generateText()` | `EP_AI_BASE_URL` / `EP_AI_API_KEY` / `EP_AI_MODEL` |
| 文生图（海报图片） | 通义万相 DashScope | `generateImage()` | `EP_IMAGE_API_BASE_URL` / `EP_IMAGE_API_KEY` / `EP_IMAGE_MODEL` |
| 联网搜索 | Tavily | `searchWeb()` | `EP_TAVILY_API_KEY` |

## 二、环境变量怎么填

在项目根目录的 `.env` 文件里填（`.env.example` 是模板，每个变量都有注释）：

```bash
# 文本模型
EP_AI_BASE_URL=https://api.deepseek.com
EP_AI_API_KEY=sk-你的DeepSeek密钥
EP_AI_MODEL=deepseek-v4-pro

# 文生图
EP_IMAGE_API_BASE_URL=https://maas.qianwenaiapi.com/api/v1
EP_IMAGE_API_KEY=你的通义万相密钥
EP_IMAGE_MODEL=wan2.7-image-pro

# 联网搜索
EP_TAVILY_API_KEY=你的tavily密钥
```

## 三、Key 从哪里拿

- **DeepSeek**：去 https://platform.deepseek.com 注册，在「API Keys」页面创建 key。
- **通义万相**：去阿里云百炼（Model Studio）开通，拿 `EP_IMAGE_API_BASE_URL` 和 `EP_IMAGE_API_KEY`。
- **Tavily**：去 https://tavily.com 注册拿 key（可选，不填的话调研功能查不到实时资料）。

## 四、点一次「Test AI」发生了什么

1. 你在网页点 Test AI。
2. 浏览器把请求发给**你自己的 Next.js 服务器**。
3. 服务器里的 `generateText()` 带着 `.env` 里的 `EP_AI_API_KEY`，发请求到 `https://api.deepseek.com/chat/completions`。
4. DeepSeek 回答，服务器把答案显示到网页上。

一句话流程：

```
你的 app  →  DeepSeek 官方 API（用你 .env 里的 key）
```

## 五、常见问题

**Q：点 Test AI 报错？**
A：依次检查：`.env` 里 `EP_AI_API_KEY` 填了没、`EP_AI_BASE_URL` 是不是 `https://api.deepseek.com`、网络能不能访问 api.deepseek.com。

**Q：Key 会不会泄露？**
A：不会。Key 只存在你本机的 `.env` 里，这个文件被 `.gitignore` 忽略、不会提交到 git，也不会出现在前端页面里。

**Q：换模型怎么办？**
A：文本模型换模型改 `EP_AI_MODEL`（和 `EP_AI_BASE_URL`）；文生图换模型改 `EP_IMAGE_*` 三个变量。代码一行不用动。
