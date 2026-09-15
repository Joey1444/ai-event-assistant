const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUT = "F:/1孔院/9中秋/event-planner";
const F_BODY = "宋体";
const F_HEAD = "黑体";

function title(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 36 })] });
}
function h1(text) {
  return new Paragraph({ spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 28 })] });
}
function h2(text) {
  return new Paragraph({ spacing: { before: 140, after: 60 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 24 })] });
}
function body(text, opt = {}) {
  return new Paragraph({ spacing: { after: 60, line: 330 },
    indent: opt.noIndent ? undefined : { firstLine: 460 },
    children: [new TextRun({ text, font: F_BODY, size: 21, bold: opt.bold })] });
}
function cell(text, width, opt = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
    shading: opt.shade ? { type: ShadingType.CLEAR, fill: "EEEEEE" } : undefined,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    children: text.split("\n").map((l) => new Paragraph({ spacing: { after: 25 },
      children: [new TextRun({ text: l, font: F_BODY, size: 19, bold: opt.bold })] })),
  });
}
function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { shade: true, bold: true })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, widths[i])) })),
    ],
  });
}

async function main() {
  const children = [
    title("Agent 迭代评审与优化方案"),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 260 },
      children: [new TextRun({ text: "合并版 v2 · 含「新人老师体验评审」与产品/前端/后端方案", font: F_BODY, size: 21, color: "555555" })] }),

    h1("一、评审说明"),
    body("两轮评审：第一轮「Agent 提示词层」，由提示词工程 / 领域实用性 / 反幻觉合规三视角评审 10 个智能体；第二轮「用户体验层」，由「新人老师」agent 模拟零基础教师真实使用，再由产品经理 / 前端 / 后端三个 agent 分别给出解决方案。本方案为合并结果。"),

    h1("二、重要事实澄清（关于 maxTokens）"),
    body("新人老师反馈「输出写一半就断」，初判是 config.ts 默认 2048 导致。后端逐行核实后确认：10 个 agent 实际都显式设了 maxTokens（8000/12000/16000），2048 只影响 testAi()。真正的问题是三点：", { noIndent: true }),
    body("1. provider 不读 stop_reason，一旦真被截断，业务层静默、产出残缺 JSON/HTML 也不报错；", { noIndent: true }),
    body("2. copywriter/poster 的 8000 对推理模型长输出偏紧；", { noIndent: true }),
    body("3. 2048 是「未来新增 agent 的静默陷阱」。", { noIndent: true }),
    body("修法：默认提到 16000 + provider 增加 stop_reason 截断检测 + copywriter/poster 升到 12000。"),

    h1("三、P0 清单（致命/阻断，先做）"),
    table(
      ["改动", "维度", "涉及文件", "说明"],
      [
        ["全站术语中文化", "体验层", "各 *Panel.tsx、approve/page.tsx、types.ts", "替换硬编码英文与内部名（Concept/Reject All/Final QA/PASS-WARNING-BLOCK/HTML/审批页模块标题/置信度英文），成本极低、信任收益最大"],
        ["maxTokens 兜底 + 截断检测", "Agent 层", "lib/ai/config.ts、provider.ts、.env", "默认 16000；provider 读 stop_reason==max_tokens 抛友好「输出被截断」；copywriter/poster 8000→12000"],
        ["预算补币种/总额", "Agent 层", "schema.prisma、budget.ts、actions.ts、serializers.ts、format.ts", "schema 已有 currency 默认「元」但从未产出；补 currency(KES)/total/contingencyRate，全链路贯通"],
        ["PM「补充信息」入口 + gate", "体验+Agent", "pm.ts、schema、actions.ts", "PmAnalysis 加 canStart；generateConcepts 前置 gate，信息不全时返回「请先补充 X」并阻止；前端给回填入口"],
        ["Designer 去硬编码", "Agent 层", "designer.ts", "删除「莫伊大学孔子学院 2026 年中秋节」「水墨月夜」硬编码，改为从输入读"],
        ["文案「复制」按钮", "体验层", "components/ui/CopyButton.tsx（新增）+ 各文案面板", "纯前端 navigator.clipboard，成本极低，收益最高"],
      ],
      [2000, 900, 2200, 3926]
    ),

    h1("四、P1 清单（高价值）"),
    table(
      ["改动", "维度", "涉及文件", "说明"],
      [
        ["PM 二分结构（对应诉求 1）", "Agent 层", "pm.ts、types.ts、schema、actions.ts", "knownFacts/missingInformation/assumptions 改为 blockers（主要矛盾）+ minorGaps（次要提醒）+ canStart"],
        ["Strategist 动态化（对应诉求 2）", "Agent 层", "strategist.ts、types.ts、critic.ts", "不预设 A/B/C 三方向，改维度驱动 + 2~4 方案自适应，direction 自拟；critic recommendedConcept 去硬编码"],
        ["流程引导", "体验层", "lib/workflow.ts（新增）、WorkflowStepper.tsx、page.tsx、NextStepHint.tsx", "顶部 6 里程碑可点击锚点 + 悬浮「现在该做什么」卡 + 每面板底部「下一步」引导条，与按钮联动"],
        ["成果导出", "体验层", "lib/exportText.ts、lib/download.ts、各面板", "方案 Word、预算 Excel、文案复制/下载、海报 PNG/PDF"],
        ["错误信息用户化", "体验层", "lib/ai/provider.ts classifyError", "CCSwitch/127.0.0.1/AI_MODEL 等内部词换成「AI 服务没连上，请检查网络或稍后重试」"],
        ["加载进度/预计时间", "体验层", "各 *Panel.tsx 按钮区", "统一不确定进度条 + 「约 20~60 秒，请勿离开本页」"],
        ["Poster→Designer 打通", "Agent 层", "actions.ts generateDesign、designer.ts", "generateDesign 传 poster 内容，Designer 沿用不重提取，消除三层重复"],
        ["QA 补 HTML 输入", "Agent 层", "actions.ts runFinalQa、qa.ts", "QA 检查最终 HTML 海报一致性，补盲区"],
        ["JSON 防御性解析 + toBool", "Agent 层", "全部 parse、provider.ts", "JSON.parse 包 try/catch；Boolean(\"false\") 误判改用 toBool；PM 补 timeoutMs"],
      ],
      [2100, 900, 2400, 3626]
    ),

    h1("五、P2 清单（稳健性/打磨）"),
    table(
      ["改动", "维度", "说明"],
      [
        ["假设/置信度大白话", "体验层", "置信度 high/medium/low 显示为「把握：高/中/低」；「假设」首次出现配图例「AI 的猜测，未经确认」"],
        ["审批三按钮后果说明", "体验层", "批准=流程结束 / 驳回=打回重做 / 要求修改=退回改后再审，每按钮加一行小字"],
        ["统一事实标注规范", "Agent 层", "[ASSUMPTION]/[待确认]/FACT 四态抽成共享常量，消除三套标记混用"],
        ["抽公共 parse 工具", "Agent 层", "parseJson/toBool/toStrArray/toNumber 抽到 lib/agents/parse.ts，10 处复用"],
        ["静态提示词进 system", "Agent 层", "角色/规则/schema 放 system role，动态输入放 user，命中 prompt caching 省 token"],
        ["confidence 归一 + 小 bug", "Agent 层", "factChecker confidence 归一枚举；analyzeProject 重复 create 改 deleteMany+create；selectConcept 校验 variant"],
      ],
      [2200, 1100, 5726]
    ),

    h1("六、落地顺序建议"),
    body("第 1 批（P0，几乎零架构改动，先上）：术语中文化 + maxTokens 兜底/截断检测 + 预算币种 + PM 补充入口 + Designer 去硬编码 + 文案复制按钮。", { noIndent: true }),
    body("第 2 批（你的两条诉求，P1 首批）：PM 二分结构、Strategist 动态化。", { noIndent: true }),
    body("第 3 批（体验闭环）：流程引导 + 成果导出 + 错误信息用户化 + 加载进度。", { noIndent: true }),
    body("第 4 批（结构修复 + 打磨）：Poster→Designer 打通、QA 补 HTML、JSON 防御、P2 各项。", { noIndent: true }),

    h1("七、待确认"),
    body("1. 是否接受数据库字段改动（PmAnalysis 加 blockers/minorGaps/canStart；Budget 补 currency/total/contingencyRate）？"),
    body("2. 是否接受 Strategist 方案数量 2~4 个（不再固定 3 个，人工关卡 UI 需支持任意数量）？"),
    body("3. 是否要我按 P0 → 你的两条诉求 → 体验闭环的顺序，直接动手改代码？"),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: F_BODY, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, "Agent优化方案_v2.docx"), buf);
  console.log("written: Agent优化方案_v2.docx");
}
main().catch((e) => { console.error(e); process.exit(1); });
