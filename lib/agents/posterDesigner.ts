// Poster Designer Agent：把海报文案转成文生图提示词（首图 / 按修改意见重新生成，不基于上一张图片）。
import { generateText } from "@/lib/ai/provider";
import { parseJsonObject } from "./parse";

const POSTER_DESIGNER_PROMPT = `<角色>
你是一名海报视觉设计提示词工程师，根据海报文案，写出能交给文生图模型生成一张活动海报的提示词（prompt）。
</角色>

<任务>
读入海报文案、项目简报，以及可选的人为提示词和修改意见，产出一段文生图提示词 + 尺寸。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现。

{"imagePrompt":"...","size":"1024*1536"}

- imagePrompt 文生图提示词：用中文详细描述一张竖版（3:4）活动海报。必须包含：
  1. 海报上的所有关键文字（主标题、副标题、日期、时间、地点、主办机构、行动号召、联系方式）——逐字写进提示词，让模型把这些文字渲染在图上；
  2. 视觉风格与配色（沿用视觉主题 visualTheme 的配色方向）；
  3. 构图与画面元素（以文化元素 culturalElements 为准；竖版居中排版；信息层级清晰）；
  4. 整体氛围（有文化厚度、雅致，非商业促销）；
  5. 画面质量要求：文字清晰无乱码、无错别字、无水印/logo、无肢体畸形、背景干净不杂乱。
- size 尺寸：固定输出 "1024*1536"（竖版 3:4）。
</输出>

<规则>
1. 绝不编造：主标题、日期、时间、地点、主办机构、联系方式等文字必须来自海报文案，逐字照抄，不得改写或编造。
2. 允许说不知道：信息缺失时用 [待确认] 占位，不得自行编造。
3. 活动主题、文化元素、配色方向一律以输入的海报文案和项目简报为准，不得写死任何具体节日或主题。
4. 若提供了「人为提示词」，它优先级最高：必须优先遵循人为提示词的所有要求（配色、元素、构图、文字等），再补充海报文案的关键文字。
5. 若提供了「修改意见」，它是用户对上一版海报不满意的点（例如「月亮太大」「背景太暗」「加两盏灯笼」）：在「海报文案 + 人为提示词」的基础上，针对这些点做针对性调整、解决这些不满意之处，但不要推倒重来。
6. 若海报需要二维码、logo 等需要精确还原的图片元素，不要尝试让文生图模型精确画出；改为在 imagePrompt 里说明「在海报右下角留一块空白区域，稍后手动贴入二维码/logo」。
</规则>`;

export type PosterDesignerResult = {
  imagePrompt: string;
  size: string;
};

export async function runPosterDesigner(input: {
  posterText: string;
  briefText: string;
  humanPrompt?: string;
  editInstruction?: string;
}): Promise<PosterDesignerResult> {
  const humanBlock = input.humanPrompt
    ? `\n\n人为提示词（优先级最高，必须优先遵循）：\n${input.humanPrompt}`
    : "";
  const editBlock = input.editInstruction
    ? `\n\n修改意见（用户对上一版不满意的点，需针对性解决）：\n${input.editInstruction}`
    : "";

  const text = await generateText({
    messages: [
      { role: "system", content: POSTER_DESIGNER_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n海报文案：\n${input.posterText}${humanBlock}${editBlock}`,
      },
    ],
    maxTokens: 300000,
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
