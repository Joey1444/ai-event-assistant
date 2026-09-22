// Researcher Agent：联网调研，填充研究库（ResearchItem）与事实账本（Fact）
import { generateText } from "@/lib/ai/provider";
import { searchWeb } from "@/lib/ai/tavily";
import { parseJsonObject } from "./parse";
import type { FactData } from "./types";

const RESEARCHER_PROMPT = `<角色>
你是一名严谨的资料研究员，根据联网检索到的资料，提取与本次活动策划相关的研究条目与事实，供后续方案生成与事实核验使用。
</角色>

<任务>
读入项目简报与联网检索资料，产出研究条目与事实（带来源），落入研究库与事实账本。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现；查不到相关内容就输出空数组 []，不要硬凑。

{"items":[{"title":"...","content":"...","source":"...","sourceUrl":"..."}],"facts":[{"claim":"...","evidence":"...","source":"...","sourceUrl":"...","confidence":"high|medium|low","status":"FACT|ASSUMPTION|UNKNOWN|CONFLICT","reason":"..."}]}

- items：研究条目（保留对策划有用的资料要点，如场地信息、价格、规定、文化背景等）。
- facts：从资料里提取的具体事实（场地容量、日期、价格、规定等），供事实账本使用。
- facts 的 status：资料明确支持判 FACT；推测判 ASSUMPTION；无法确认判 UNKNOWN；矛盾判 CONFLICT。
- confidence 必须与 status 匹配：FACT→high/medium；ASSUMPTION→medium/low；UNKNOWN→low。
</输出>

<规则>
1. 只基于「检索到的资料」提取，绝不凭常识编造；资料里没有的，不得写进 facts。
2. 允许说不知道：查不到、无法确认的，输出空数组或标 UNKNOWN，不要猜一个合理值。
3. 每条 fact 必须带 source / sourceUrl（来自哪条资料）；没有来源的 claim 不得出现。
4. 提高信息密度：一条资料片段应尽量作证多个事实，优先提取能支撑多条 fact 的资料，避免内容重复冗余。
</规则>`;

export type ResearchItemData = {
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
};

export type ResearchResult = {
  items: ResearchItemData[];
  facts: FactData[];
};

export async function runResearcher(input: {
  briefText: string;
  queries: string[];
}): Promise<ResearchResult> {
  const snippets: string[] = [];
  for (const q of input.queries) {
    try {
      const results = await searchWeb(q, 2);
      for (const r of results) {
        snippets.push(`【标题】${r.title}\n【来源】${r.url}\n【内容】${r.content}`);
      }
    } catch {
      // 单条查询失败继续下一条
    }
  }
  if (snippets.length === 0) {
    throw new Error("联网搜索无结果或失败，请检查 EP_TAVILY_API_KEY 与网络");
  }
  const researchText = snippets.join("\n\n---\n\n");

  const text = await generateText({
    messages: [
      { role: "system", content: RESEARCHER_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n检索到的资料：\n${researchText}`,
      },
    ],
    maxTokens: 300000,
    timeoutMs: 300000,
  });

  return parseResearch(text);
}

function parseResearch(text: string): ResearchResult {
  const parsed = parseJsonObject(text);

  const items = (Array.isArray(parsed.items) ? parsed.items : []).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return {
      title: String(o.title ?? ""),
      content: String(o.content ?? ""),
      source: String(o.source ?? ""),
      sourceUrl: String(o.sourceUrl ?? ""),
    };
  });

  const facts = (Array.isArray(parsed.facts) ? parsed.facts : []).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const status = String(o.status ?? "UNKNOWN").toUpperCase();
    const validStatus = [
      "FACT",
      "USER_PROVIDED",
      "ASSUMPTION",
      "UNKNOWN",
      "CONFLICT",
    ].includes(status)
      ? status
      : "UNKNOWN";
    return {
      claim: String(o.claim ?? ""),
      evidence: String(o.evidence ?? ""),
      source: String(o.source ?? ""),
      sourceUrl: String(o.sourceUrl ?? ""),
      confidence: String(o.confidence ?? "low").toLowerCase(),
      status: validStatus,
      reason: String(o.reason ?? ""),
      requiresHumanVerification:
        validStatus === "UNKNOWN" || validStatus === "CONFLICT",
    };
  });

  return { items, facts };
}
