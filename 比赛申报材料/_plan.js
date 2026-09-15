const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUT = "F:/1孔院/9中秋/event-planner/比赛申报材料";
fs.mkdirSync(OUT, { recursive: true });

const F_BODY = "宋体";
const F_HEAD = "黑体";

function title(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 36 })],
  });
}
function subtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text, font: F_BODY, size: 24, color: "555555" })],
  });
}
function h1(text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 28 })],
  });
}
function h2(text) {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, size: 24 })],
  });
}
function body(text, opt = {}) {
  return new Paragraph({
    spacing: { after: 80, line: 360 },
    indent: opt.noIndent ? undefined : { firstLine: 480 },
    children: [new TextRun({ text, font: F_BODY, size: 24, bold: opt.bold })],
  });
}
function cell(text, width, opt = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    shading: opt.shade ? { type: ShadingType.CLEAR, fill: "EEEEEE" } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: text.split("\n").map((line) =>
      new Paragraph({
        spacing: { after: 40 },
        alignment: opt.center ? AlignmentType.CENTER : undefined,
        children: [new TextRun({ text: line, font: F_BODY, size: 22, bold: opt.bold })],
      })
    ),
  });
}
function table(headers, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, widths[i], { shade: true, bold: true, center: opts.centerHeader })),
  });
  const dataRows = rows.map((r) =>
    new TableRow({ children: r.map((c, i) => cell(c, widths[i], { center: opts.centerCells })) })
  );
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    },
    rows: [headerRow, ...dataRows],
  });
}

async function main() {
  const children = [
    title("「AI 活动策划助手」项目计划书"),
    subtitle("面向国际中文教育文化活动策划的多智能体协同应用"),

    h1("一、项目概述"),
    body("项目名称：「AI 活动策划助手」——面向国际中文教育文化活动策划的多智能体协同应用。"),
    body("项目性质：国际中文教育人工智能创新应用（智能体设计应用方向）。"),
    body("项目概述：面向孔子学院等国际中文教育机构的文化活动策划需求，构建一条「多智能体流水线 + 人机协同双关卡」的智能体应用，实现从需求分析、方案生成、事实核验、人工决策到最终审批的端到端自动策划，重点解决新手教师策划门槛高、信息不透明、方案易编造等问题。"),

    h1("二、项目背景与意义"),
    h2("1. 背景"),
    body("国际中文教育机构承担语言教学与文化传播双重职能，需常态化组织传统节日庆典、文化体验、交流讲座等文化活动。这类策划长期依赖有经验的教师手工完成，存在四大痛点：一是策划门槛高，新手教师难以系统兼顾预算、审批、安全合规、宣传等全流程要素；二是信息不透明，场地、日期、预算、联系人等信息分散且缺乏可信度标注；三是沟通成本高，方案多轮修改却缺乏结构化评审与决策记录；四是直接使用大模型生成方案时容易「一本正经地胡说八道」，把不确定信息当作事实。"),
    h2("2. 意义"),
    body("本项目以「AI 提议、人类决定」为核心原则，将通用大模型能力与文化活动策划的领域知识相结合，可显著降低策划门槛、提升策划效率与规范性，并通过对事实的严格标注抑制大模型幻觉，契合教育场景「不能错」的刚性需求，具备明确的应用价值与推广价值。"),

    h1("三、项目目标"),
    body("总体目标：建成一个可在国际中文教育机构实际使用的文化活动策划智能体应用，并完成至少一个真实活动的端到端策划验证。", { noIndent: true }),
    body("具体目标：", { noIndent: true }),
    body("1. 实现覆盖「需求分析—方案生成—评审—事实核验—人工决策—细化产出—质检—审批」全流程的多智能体系统；", { noIndent: true }),
    body("2. 建立两道必须真人操作的审批关卡，确保人工智能不替代人类最终决定；", { noIndent: true }),
    body("3. 建立反幻觉事实账本机制，对所有外部信息进行可信度标注与可追溯管理；", { noIndent: true }),
    body("4. 在莫伊大学孔子学院 2026 年中秋节活动策划中完成真实应用验证。", { noIndent: true }),

    h1("四、项目内容与实施方案"),
    h2("1. 系统架构"),
    body("系统采用「Web 应用 → 统一 AI Provider 层 → 大模型」三层架构。前端为 Next.js 应用，提供项目管理、智能体面板与人工审批界面；后端通过统一的 AI Provider 抽象层调用大模型，各智能体以「角色 + 提示词 + 结构化输出」实现，不依赖任何具体模型供应商；数据层采用 Prisma + SQLite，覆盖全流程共 18 张表。"),
    h2("2. 核心功能"),
    body("系统包含 10 个专业智能体与 2 道人工关卡：项目经理（需求分析）、策划师（三方案）、评审（八维评分）、事实核查（事实分类）、详细规划（十六章节方案）、预算（十类预算项自动合计）、文案（九项宣传文案）、海报内容、海报设计（HTML 海报）、最终质检（PASS/WARNING/BLOCK），以及「选择活动方向」「最终人工审批」两道人工关卡。"),
    h2("3. 技术路线"),
    body("技术栈：Next.js 16（App Router）+ TypeScript + Tailwind CSS 4 + Prisma 6 + SQLite。人工智能接入采用本地网关（Anthropic 兼容协议）统一访问 DeepSeek 推理模型，实现业务代码零 Provider 绑定，换模型只改配置不改代码。"),

    h1("五、项目创新点"),
    body("1. 将「AI 提议 + 人类决定」从理念落地为可执行的双关卡机制；", { noIndent: true }),
    body("2. 反幻觉事实账本机制，用状态机而非事后提醒抑制大模型幻觉；", { noIndent: true }),
    body("3. 模型无关的统一接入层，降低对单一模型供应商的依赖；", { noIndent: true }),
    body("4. 面向国际中文教育文化活动场景的专用多智能体流水线，领域知识与通用能力相结合。", { noIndent: true }),

    h1("六、实施进度安排"),
    body("第一阶段（已完成）：完成 MVP 开发，包括 18 张数据表、10 个智能体、2 道人工关卡、完整界面与统一 AI 接入层，并通过类型检查与代码检查。", { noIndent: true }),
    body("第二阶段（进行中）：完成真实活动场景验证，录制演示视频，完善作品综合说明与支撑材料。", { noIndent: true }),
    body("第三阶段（后续）：补全资料研究智能体，接入国际中文教育知识图谱与语料库，完善测试体系与公网部署。", { noIndent: true }),

    h1("七、预期成果"),
    body("1. 一套可运行的文化活动策划智能体应用（含完整源代码与数据模型）；", { noIndent: true }),
    body("2. 一份真实活动（中秋活动）的完整策划产出样例；", { noIndent: true }),
    body("3. 一段完整展示核心任务流程的演示视频；", { noIndent: true }),
    body("4. 一份作品综合说明与支撑材料。", { noIndent: true }),

    h1("八、项目预算"),
    h2("（一）一次性投入（建设期）"),
    body("本项目 MVP 已基本开发完成，一次性投入如下：", { noIndent: true }),
    table(
      ["项目", "说明", "金额"],
      [
        ["硬件设备", "使用现有个人电脑，无新增采购", "0 元"],
        ["软件开发", "MVP 已自研完成（10 个智能体 + 18 张数据表 + 完整界面）；如按市场外包价估算约 5–8 万元", "0 元（自研）"],
      ],
      [2000, 5126, 1900]
    ),
    body("小计：一次性投入 0 元。", { bold: true, noIndent: true }),
    h2("（二）持续性运行成本（按年估算，以实际用量为准）"),
    table(
      ["项目", "说明", "估算"],
      [
        ["AI 模型调用费", "使用 DeepSeek 推理模型，按 token 计费；按平均每周完成 2–3 场活动策划、每场全流程约 30–50 万 token 估算", "约 500–2000 元/年"],
        ["云托管 / 服务器", "如需向教师提供公网体验链接：轻量云服务器（约 30–60 元/月）或 Vercel 免费档", "0–720 元/年"],
        ["域名（可选）", "如需固定域名", "约 50–100 元/年"],
      ],
      [2000, 5126, 1900]
    ),
    body("小计：持续性运行成本约 600–2800 元/年。", { bold: true, noIndent: true }),
    h2("（三）预算总计"),
    body("一次性投入 0 元 + 年运行成本约 600–2800 元。以上为估算值，实际费用以 DeepSeek 官方定价及真实使用量为准。"),

    h1("九、后续改进方向"),
    body("1. 补全资料研究智能体（Researcher）：自动联网调研，填充研究库与事实账本，进一步提升信息可信度；", { noIndent: true }),
    body("2. 接入国际中文教育知识图谱与语料库：为活动策划中的文化点、语言点提供权威、可追溯的知识支撑；", { noIndent: true }),
    body("3. 完善测试体系：补充单元测试、集成测试与端到端测试，提升系统稳定性与可维护性；", { noIndent: true }),
    body("4. 海报导出与多主题设计：支持 PNG/PDF 导出、多套设计主题，并接入文生图模型；", { noIndent: true }),
    body("5. 历史版本对比界面：为预算、文案、详细方案等提供历史版本对比，增强可追溯与决策支持；", { noIndent: true }),
    body("6. 公网部署与稳定体验链接：将 SQLite 迁移至云端数据库、接入 DeepSeek 公网端点，实现 7×24 小时稳定在线体验；", { noIndent: true }),
    body("7. 多用户与权限管理：支持团队协作、数据隔离与隐私保护；", { noIndent: true }),
    body("8. 界面与可用性优化：多语言界面、移动端适配，进一步降低零基础教师使用门槛。", { noIndent: true }),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: F_BODY, size: 24 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, "项目计划书.docx"), buf);
  console.log("written: 项目计划书.docx");
}

main().catch((e) => { console.error(e); process.exit(1); });
