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
  return new Paragraph({ spacing: { before: 260, after: 110 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 28 })] });
}
function h2(text) {
  return new Paragraph({ spacing: { before: 160, after: 70 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 24 })] });
}
function body(text, opt = {}) {
  return new Paragraph({ spacing: { after: 70, line: 340 },
    indent: opt.noIndent ? undefined : { firstLine: 480 },
    children: [new TextRun({ text, font: F_BODY, size: 22, bold: opt.bold })] });
}
function mono(text) {
  return new Paragraph({ spacing: { after: 70, line: 300 },
    shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
    children: [new TextRun({ text, font: "Consolas", size: 18 })] });
}
function cell(text, width, opt = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
    shading: opt.shade ? { type: ShadingType.CLEAR, fill: "EEEEEE" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: text.split("\n").map((l) => new Paragraph({ spacing: { after: 30 },
      children: [new TextRun({ text: l, font: F_BODY, size: 20, bold: opt.bold })] })),
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
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 280 },
      children: [new TextRun({ text: "「AI 活动策划助手」10 个智能体 · 三视角评审汇总", font: F_BODY, size: 22, color: "555555" })] }),

    h1("一、评审结论"),
    body("由「提示词工程」「领域实用性」「反幻觉合规」三个视角独立评审全部 10 个智能体，结论一致：整体架构扎实——事实账本反幻觉机制、人机协同双关卡、Provider 抽象层均到位，FactChecker 尤其严谨。但存在三类问题："),
    body("1. 负责人指出的两条（PM 过细、Strategist 锁死三方向），确认为体系性问题，本方案第二节给出改写方案。", { noIndent: true }),
    body("2. 真实缺陷：预算缺币种字段、海报视觉方向是「断头路」、Designer 硬编码活动事实。", { noIndent: true }),
    body("3. 稳健性增强：JSON 解析缺防御、事实标注规范不统一、重复代码。", { noIndent: true }),

    h1("二、两条诉求的落地方案（重点）"),
    h2("2.1 PM（项目经理）：从「三张平铺清单」改为「主要矛盾 + 次要提醒」"),
    body("现状问题：knownFacts / missingInformation / assumptions 三张平行清单，把「日期未定」和「承办人电话没填」放在同一层级，严重程度被抹平，用户看完仍不知道先补什么。"),
    body("改法：改为 blockers（主要矛盾）+ minorGaps（次要提醒）二分结构，每个阻塞项附带一个可回问的具体问题。新输出结构：", { noIndent: true }),
    mono('{"summary":"一句话：是否可启动、卡在哪","blockers":[{"item":"活动日期未定","impact":"high","why":"无法确定档期、预订场地、倒排筹备周期","blockingQuestion":"请确认活动日期（如未定，是否授权按 9 月中旬假设推进？）"}],"minorGaps":["承办人联系电话未填（文案/海报阶段需补，不阻塞策划）"],"assumptions":[{"item":"面向全校学生与教职工","basis":"孔院中秋惯例","confidence":"medium"}],"nextStep":"先确认日期与预算上限即可开始策划，其余可后补","canStart":true}'),
    body("关键规则：blockers 只放「会阻塞策划推进」的硬条件（日期/地点/预算/人数/目的），通常 0~4 条；凡文案/海报阶段才用得到的信息（联系方式、logo、宣传渠道）一律进 minorGaps，不得进 blockers。canStart 布尔值替代原 requiresHumanInput，更能指导编排层是否放行。"),

    h2("2.2 Strategist（策划师）：从「固定三方向」改为「维度驱动 + 数量自适应」"),
    body("现状问题：A 文化传播 / B 学生参与 / C 大型传播 三个预设方向，换节日、换活动性质就失效，且方案数量固定为 3，无法适应「有的活动 2 个够、有的要 4 个」的真实需求。"),
    body("改法：分两步——先显式提炼「本次活动的关键设计维度」，再基于维度生成 2~4 个差异最大化的方案，direction 由模型自拟，不再三选一。新增字段：designDimensions（设计维度）、differentiator（每方案差异点）、rationale（为何是这几个方向）。"),
    mono('{"designDimensions":[{"dimension":"参与深度","options":["展示型","体验型","共创型"],"tendency":"本活动偏体验型"}],"concepts":[{"variant":"A","direction":"低门槛游园会，兼顾传播","differentiator":"本方案在「规模」维度取全校传播，与 B 的差异在于…","name":"...","theme":"..."}],"rationale":"为何对本次活动提出这几个方向"}'),
    body("保留不动：16 个字段、以及「事实规则」四条（只认事实账本、没来源标 [ASSUMPTION]、不编造、预算贴合简报）——这是全系统一致性的根基。"),

    h1("三、评审发现的其它问题（按优先级）"),
    table(
      ["优先级", "问题", "涉及文件", "建议"],
      [
        ["P0", "Designer 硬编码了「莫伊大学孔子学院 2026 年中秋节」等事实，换活动就得改代码", "designer.ts", "机构/年份/节日/主题抽成输入变量"],
        ["P0", "预算缺币种字段（types 已预留 currency 但 prompt/解析未产出）", "budget.ts", "补 currency + total + 「不超预算」硬约束"],
        ["P1", "Poster 的视觉方向是断头路，没喂给 Designer，三层重复提取事实", "actions.ts / designer.ts", "generateDesign 增加 poster 输入，Designer 沿用不重提取"],
        ["P1", "Critic 的 recommendedConcept 硬编码 A/B/C，与 Strategist 动态化冲突", "critic.ts", "改为填任意 variant 值"],
        ["P1", "QA 看不到 Designer 生成的 HTML，海报一致性检查是盲区", "qa.ts / actions.ts", "runFinalQa 增加 posterDesign.html 输入"],
        ["P1", "JSON.parse 未包 try/catch，畸形 JSON 抛英文报错；Boolean(\"false\") 误判；PM 缺 timeoutMs", "全部 parse / pm.ts", "抽公共解析工具 + toBool + 补 timeout"],
        ["P2", "事实标注规范不统一（[ASSUMPTION] vs [待确认] vs FACT 四态）", "多个 agent", "统一为共享常量"],
        ["P2", "Copywriter maxTokens 8000 偏紧，9 段文案易截断", "copywriter.ts", "升到 12000"],
        ["P2", "JSON 解析逻辑重复 10 遍、无 system/user 分层", "全部 agent", "抽共享 parseJson + 静态提示词进 system"],
      ],
      [700, 3600, 2100, 2626]
    ),

    h1("四、建议的落地顺序"),
    body("第 1 批（对应你的两条诉求 + 硬伤）：Strategist 动态化、PM 二分结构、Designer 去硬编码、Budget 补币种。", { noIndent: true }),
    body("第 2 批（结构修复）：Poster→Designer 打通、Critic 去硬编码、QA 补 HTML 输入、JSON 防御性解析。", { noIndent: true }),
    body("第 3 批（稳健性）：统一事实标注规范、Copywriter maxTokens、抽公共工具。", { noIndent: true }),

    h1("五、待确认"),
    body("1. PM 改为 blockers/minorGaps 后，数据库 PmAnalysis 表和编排层 analyzeProject 需同步改字段，是否接受这次改动？"),
    body("2. Strategist 动态化后方案数量 2~4 个（不再固定 3 个），人工关卡「三选一」的 UI 是否接受任意数量？"),
    body("3. 是否要我直接动手改代码（先从 PM + Strategist 两条开始），还是先只改提示词、你自己看效果？"),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: F_BODY, size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, "Agent优化方案.docx"), buf);
  console.log("written: Agent优化方案.docx");
}
main().catch((e) => { console.error(e); process.exit(1); });
