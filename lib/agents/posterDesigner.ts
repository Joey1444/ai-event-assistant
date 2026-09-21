// Poster Designer Agent：把海报文案转成文生图提示词（首图 / 基于上一张的局部修改）。
import { generateText } from "@/lib/ai/provider";
import { parseJsonObject } from "./parse";

const POSTER_DESIGNER_PROMPT = `# 角色
你是一名海报视觉设计提示词工程师（Poster Designer Agent）。你的职责是：根据海报文案，写出能交给文生图模型生成一张活动海报的提示词（prompt）。

# 输入
海报文案（主标题/副标题/日期/时间/地点/主办/行动号召/联系方式/视觉主题/文化元素）、项目简报，以及可选的「人为提示词」「上一版提示词」和「用户修改指令」。

# 输出 2 项（全部字符串）
- imagePrompt 文生图提示词：用中文详细描述一张竖版（3:4）活动海报。必须包含：
  1. 海报上的所有关键文字（主标题、副标题、日期、时间、地点、主办机构、行动号召、联系方式）——逐字写进提示词，让模型把这些文字渲染在图上；
  2. 视觉风格与配色（沿用视觉主题 visualTheme 的配色方向）；
  3. 构图与画面元素（以文化元素 culturalElements 为准；竖版居中排版；信息层级清晰）；
  4. 整体氛围（有文化厚度、雅致，非商业促销）；
  5. 画面质量要求：文字清晰无乱码、无错别字、无水印/logo、无肢体畸形、背景干净不杂乱。
- size 尺寸：固定输出 "1024*1536"（竖版 3:4）。

# 事实规则（极其重要）
1. 主标题、日期、时间、地点、主办机构、联系方式等文字必须来自海报文案，逐字照抄，不得改写或编造。
2. 信息缺失时用 [待确认] 占位，不得自行编造。
3. 活动主题、文化元素、配色方向一律以输入的海报文案和项目简报为准，不得写死任何具体节日或主题。
4. 若提供了「人为提示词」，它优先级最高：必须优先遵循人为提示词的所有要求（配色、元素、构图、文字等），再补充海报文案的关键文字。
5. 若提供了「用户修改指令」，在保留上一版 prompt 已确定风格/元素的基础上，只按指令做局部修改，不要推倒重来。
6. 若海报需要二维码、logo 等需要精确还原的图片元素，不要尝试让文生图模型精确画出（画不准会导致无法识别）；改为在 imagePrompt 里说明「在海报右下角留一块空白区域，稍后手动贴入二维码/logo」。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"imagePrompt":"...","size":"1024*1536"}`;

export type PosterDesignerResult = {
  imagePrompt: string;
  size: string;
};

export async function runPosterDesigner(input: {
  posterText: string;
  briefText: string;
  humanPrompt?: string;
  editInstruction?: string;
  prevPrompt?: string;
}): Promise<PosterDesignerResult> {
  const humanBlock = input.humanPrompt
    ? `\n\n人为提示词（优先级最高，必须优先遵循）：\n${input.humanPrompt}`
    : "";
  const prevBlock = input.prevPrompt
    ? `\n\n上一版提示词：\n${input.prevPrompt}`
    : "";
  const editBlock = input.editInstruction
    ? `\n\n用户修改指令：\n${input.editInstruction}`
    : "";

  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${POSTER_DESIGNER_PROMPT}\n\n项目简报：\n${input.briefText}\n\n海报文案：\n${input.posterText}${humanBlock}${prevBlock}${editBlock}\n\n请生成提示词并输出 JSON。`,
      },
    ],
    maxTokens: 8000,
    timeoutMs: 300000,
  });
  return parseFields(text);
}

function parseFields(text: string): PosterDesignerResult {
  const parsed = parseJsonObject(text);
  const size = String(parsed.size ?? "1024*1536");
  const allowedSizes = ["1024*1536", "1536*1024", "1024*1024"];
  return {
    imagePrompt: String(parsed.imagePrompt ?? ""),
    size: allowedSizes.includes(size) ? size : "1024*1536",
  };
}
