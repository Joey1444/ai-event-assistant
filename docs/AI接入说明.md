# AI 接入说明（用户说明书）

> 这份说明写给「不熟悉 AI 网关」的你。目标：看完就懂你的 app 是怎么用上 AI 的。

## 一、一句话总结

你的活动策划 app **不直接跟 DeepSeek 打交道**，而是通过电脑上的 **cc-switch** 这个「中转站」去访问模型。app 只认 cc-switch，cc-switch 负责去跟真正的模型（现在是 DeepSeek）沟通。

## 二、三个角色

| 角色 | 是谁 | 干什么 | 保管什么 |
|---|---|---|---|
| 你的 app（event-planner） | 你正在开发的网页 | 发问题、收答案 | 只有 cc-switch 的地址，**没有任何模型 Key** |
| cc-switch | 电脑上装的桌面软件（`D:\apps\cc switch\cc-switch.exe`） | 中转：收 app 的请求，转发给真正的模型 | **DeepSeek 的真实 Key** |
| DeepSeek | 真正回答问题的人工智能 | 思考并回答 | — |

**关键点：DeepSeek 的 Key 只在 cc-switch 手里，你的 app 从头到尾不知道它、也不保存它。**

## 三、打个比方（点外卖）

- 你的 app = 你（顾客）
- cc-switch = 外卖平台
- DeepSeek = 餐厅厨师

你点餐时只跟外卖平台打交道，不需要知道厨师的电话、账号、付款方式。平台负责把你的订单翻译给厨师、用平台的钱结算、再把菜送回来。以后这家餐厅换了（换模型），你照常下单，一点不受影响。

## 四、点一次「Test AI」到底发生了什么

1. 你在网页点 **Test AI**。
2. 浏览器把请求发给**你自己的 Next.js 服务器**（不是直接发给 cc-switch，更不会直接发给 DeepSeek）。
3. 服务器里的 `generateText()` 发一个 HTTP 请求到 `http://127.0.0.1:15721/v1/messages` —— 这是 cc-switch 在你电脑上开的一个「门」。
4. cc-switch 收到后，把它翻译成 DeepSeek 能懂的格式，塞进它自己保管的 Key，转发给 DeepSeek。
5. DeepSeek 回答，cc-switch 把答案传回你的服务器，服务器再显示到网页上。

一句话流程：

```
你的 app  →  cc-switch（127.0.0.1:15721）  →  DeepSeek
```

## 五、你可能会疑惑的「claude」

之前探测时提到 cc-switch 里有 `claude`、`claude-desktop`、`codex`、`gemini`。**这些不是指某个软件**，而是 cc-switch 把「接待客户端」分成了几路，每路讲一种「语言」（专业叫「协议」）：

| 这一路叫什么 | 讲什么语言 | 你的 app 用了吗 |
|---|---|---|
| `claude` | Anthropic 语言 | ✅ 用的就是这路 |
| `codex` | OpenAI 语言 | ❌ 没启用 |
| `gemini` | Gemini 语言 | ❌ 没启用 |

你的 app 只会讲「Anthropic 语言」，所以走 `claude` 这一路。**这里的 `claude` 只是一个语言标签，跟 Claude Desktop / Claude Code 这些软件毫无关系**——你不需要装 Claude，也不需要打开它。

再打个比方：cc-switch 是个会讲三种外语的前台。你的 app 只会讲英语（Anthropic 语），于是走「英语通道」，前台再把你说的话翻译给后厨（DeepSeek）。

## 六、怎么用（测试步骤）

1. 先确认 **cc-switch 这个桌面软件是开着的**（它开着时，你电脑的 `127.0.0.1:15721` 端口在监听）。
2. 启动你的 app：

```bash
cd F:/1孔院/9中秋/event-planner
npm run dev
```

3. 浏览器打开 `http://localhost:3000/ai-test`。
4. 点 **Test AI**。看到 `Status: CONNECTED` 和 `Response: AI connection successful.` 就说明整条链路通了。

## 七、以后想换模型怎么办

两步，**代码一行都不用改**：

1. 在 cc-switch 界面里，把「当前 provider」从 DeepSeek 换成别的（Kimi、GLM、或以后的新模型）。
2. 打开项目里的 `.env`，把 `AI_MODEL` 改成新模型的名字。

你的 `Researcher / Strategist / Critic / Fact Checker`（已实现）全部只调 `generateText()`，所以换模型对它们零影响。

**文生图模型（海报图片）走另一条路**：它**不经过 cc-switch**，而是由你的 Next.js 服务器直接连第三方文生图服务（DashScope 原生 API）。对应环境变量是 `IMAGE_API_BASE_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL`（Key 填在服务端 `.env`，同样不要提交）。换文生图模型只改这三个变量。

## 八、关键文件速查

| 文件 | 作用 |
|---|---|
| `.env` | 存 `AI_BASE_URL`（网关地址）、`AI_MODEL`（模型名）、`AI_API_KEY`（占位符）；文生图另存 `IMAGE_API_BASE_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL` |
| `lib/ai/config.ts` | 把这些环境变量读进来，统一管理 |
| `lib/ai/provider.ts` | 唯一「发请求 + 收答案」的地方，对外暴露 `generateText()`（文本）与 `generateImage()`（文生图） |
| `lib/ai/actions.ts` | 网页按钮触发的服务端函数 `testAi()` |
| `app/ai-test/page.tsx` | `/ai-test` 页面 |
| `components/AiTestPanel.tsx` | 「Test AI」按钮和结果显示 |

## 九、常见问题

**Q：点 Test AI 报「CCSwitch 没启动」？**
A：说明 cc-switch 桌面软件没开。打开它再试即可。

**Q：会不会泄露 DeepSeek Key？**
A：不会。项目里没有任何 DeepSeek Key，`.env` 里的 `AI_API_KEY=cc-switch-local` 只是个占位符，真实 Key 在 cc-switch 里。

**Q：换一台电脑怎么办？**
A：在新电脑上装好 cc-switch、配好 provider，再把项目 `.env` 里的 `AI_BASE_URL` 改成新电脑上 cc-switch 的地址即可。

**Q：为什么不用 OpenAI 那种写法？**
A：因为你这台电脑上 cc-switch 当前只启用了「Anthropic 语言」这一路。项目按实际情况走 Anthropic 协议。哪天你在 cc-switch 里改用「OpenAI 语言」那一路，只需改 `provider.ts` 里的请求格式，业务代码仍然只调 `generateText()`。
