const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign, PageBreak,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUT = "F:/1孔院/9中秋/event-planner/比赛申报材料";
fs.mkdirSync(OUT, { recursive: true });

const F_BODY = "宋体";
const F_HEAD = "黑体";

// ---------- helpers ----------
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
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: text.split("\n").map((line) =>
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: line, font: F_BODY, size: 22, bold: opt.bold })],
      })
    ),
  });
}
function formTable(rows, labelW, valW) {
  const total = labelW + valW;
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: [labelW, valW],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    },
    rows: rows.map(([label, value, opt = {}]) =>
      new TableRow({
        children: [
          cell(label, labelW, { shade: true, bold: true }),
          cell(value, valW),
        ],
      })
    ),
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
async function save(name, children) {
  const doc = new Document({
    styles: { default: { document: { run: { font: F_BODY, size: 24 } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log("written:", name);
}

const 作品名称 = "「AI 活动策划助手」——面向国际中文教育文化活动策划的多智能体协同应用";

// ============================================================
// 1. 单位推荐表
// ============================================================
async function doc1() {
  const children = [
    title("首届国际中文教育人工智能创新应用案例征集活动"),
    subtitle("单 位 推 荐 表"),
    formTable([
      ["作品名称", 作品名称],
      ["申报组别", "智能体设计应用组"],
      ["申报单位（全称）", "【请填写单位全称】"],
      ["单位类型", "【如：孔子学院 / 高校 / 教育机构】"],
      ["团队负责人", "【请填写姓名】"],
      ["职务 / 职称", "【请填写】"],
      ["联系电话", "【请填写】"],
      ["电子邮箱", "【请填写】"],
      ["团队成员", "【请填写全部成员姓名】"],
      ["作品简介",
        "本作品是一款面向国际中文教育文化活动策划的多智能体协同应用。系统围绕「AI 提议、人类决定」的核心理念，构建由项目经理、策划师、评审、事实核查、详细规划、预算、文案、海报内容、海报设计、最终质检等 10 个专业智能体组成的流水线，并在方案方向选择与最终审批两处设置必须真人操作的关卡，确保人工智能只提供建议、不替代人类决策。系统引入反幻觉事实账本机制，将外部信息严格标注为已核实、未知、假设、冲突等状态，从机制上抑制大模型编造。该应用已在莫伊大学孔子学院 2026 年中秋节活动策划中实际应用，显著降低了文化活动策划的门槛与成本，具备良好的可迁移与推广价值。"],
      ["单位推荐意见", "\n\n\n\n【此栏由推荐单位填写推荐意见】"],
      ["推荐单位（盖章）", "\n\n【此处加盖单位公章】"],
      ["日期", "【      年      月      日】"],
    ], 2600, 6426),
  ];
  await save("01_单位推荐表.docx", children);
}

// ============================================================
// 2. 作品综合说明
// ============================================================
async function doc2() {
  const children = [
    title("作品综合说明"),
    subtitle(作品名称),
    h1("一、设计思路"),
    h2("1. 背景与痛点"),
    body("国际中文教育机构（以孔子学院为代表）承担着语言教学与文化传播的双重职能，需要常态化组织传统节日庆典、文化体验、交流讲座等各类文化活动。这类活动的策划长期依赖有经验的教师手工完成，存在四大痛点：一是策划门槛高，新手教师难以系统兼顾预算、审批、安全合规、宣传等全流程要素；二是信息不透明，场地、日期、预算、联系人等信息分散，缺乏统一来源与可信度标注；三是沟通成本高，方案需要多轮讨论修改，却缺乏结构化的评审与决策记录；四是直接使用大模型生成方案时，容易出现「一本正经地胡说八道」的问题，把不确定信息当作事实。"),
    h2("2. 设计理念"),
    body("本作品以「AI 提议、人类决定」为核心原则，构建一条「需求分析 → 方案生成 → AI 评审 → 事实核验 → 人工决策 → 细化产出 → 最终质检 → 人工审批」的多智能体流水线。人工智能负责高效生成与质量把关，人类在两处关键节点（选择方案方向、最终批准）行使最终决定权，从机制上保证「AI 不替人类做最终决定」。"),
    h2("3. 核心原则"),
    body("一是 AI 永远不替人类做最终决定，两道人工关卡只能由真人点击；二是不把 AI 假设当事实，所有外部信息要么有来源、要么明确标注为未知（UNKNOWN）/ 假设（ASSUMPTION）/ 冲突（CONFLICT）；三是不编造，缺失信息一律用【待确认】占位；四是每个环节的产出均解析为结构化数据并落库，实现全程可追溯。"),
    h1("二、人工智能技术应用说明"),
    h2("1. 多智能体分工协作"),
    body("系统设计 10 个职责明确的专业智能体：项目经理（PM）负责需求分析与已知/未知梳理，策划师（Strategist）生成三个方向不同的方案，评审（Critic）进行八维评分并给出推荐，事实核查（Fact Checker）对外部信息进行分类标注，详细规划（Planner）生成十六章节正式方案，预算（Budget）生成十类预算项并自动合计，文案（Copywriter）产出九项宣传文案，海报内容（Poster）与海报设计（Designer）分别产出海报文案与完整 HTML 海报，最终质检（QA）输出 PASS / WARNING / BLOCK 结论。每个智能体遵循统一的「角色 / 输入 / 输出 / 规则」提示词规范，输出结构化 JSON，实现流水线式协作。"),
    h2("2. 统一 AI 接入层"),
    body("业务代码统一通过 lib/ai/provider.ts 的 generateText() 访问大模型，实现「业务代码零 Provider 绑定」。当前通过本机网关接入 DeepSeek 推理模型（deepseek-v4-pro），切换模型只需修改网关配置与模型名称，无需改动任何业务代码，显著降低对单一模型供应商的依赖。"),
    h2("3. 反幻觉事实账本"),
    body("针对大模型「编造事实」的普遍问题，系统引入事实账本机制，将每个外部事实标注为 unverified / ai_checked / human_verified / rejected 四级状态；无来源信息一律标记为 UNKNOWN，推测标记为 ASSUMPTION，冲突标记为 CONFLICT 并保留冲突双方原文。人工智能不得自行将任何事实标记为已由人类核实，从机制上抑制幻觉，契合教育场景「不能错」的刚性要求。"),
    h2("4. 人机协同双关卡"),
    body("系统在流程中设置两道必须真人点击的审批关卡：第一道为「请选择活动方向」，用户在三个方案中点击选择或全部驳回；第二道为「最终人工审批」，用户点击通过、驳回或要求修改。每个决策均落库并成为后续环节的输入，实现可追溯的人机协同，而非完全放任模型自动运行。"),
    h2("5. 结构化数据与版本管理"),
    body("每个智能体的输出均解析为结构化数据并持久化到数据库；详细方案、预算、文案、海报等支持版本化管理，重新生成时保留历史或明确版本号。所有 AI 结果均带时间戳，重要数据可追踪、决策可回溯。"),
    h1("三、创新性"),
    body("第一，将「AI 提议 + 人类决定」从理念落地为一套可执行的双关卡机制，而非停留在口号层面。", { noIndent: true }),
    body("第二，反幻觉事实账本机制直击教育场景「不能错」的刚性需求，用状态机而非事后提醒来抑制幻觉。", { noIndent: true }),
    body("第三，模型无关的统一接入层，降低对单一模型的依赖，便于后续迁移与升级。", { noIndent: true }),
    body("第四，面向国际中文教育文化活动场景的专用多智能体流水线，将领域知识与通用大模型能力相结合。", { noIndent: true }),
    h1("四、应用性"),
    body("本作品已在莫伊大学孔子学院 2026 年中秋节活动策划中实际应用，覆盖从需求分析、方案生成、事实核验、人工决策到最终审批的完整流程。系统面向新手设计，显著降低了文化活动策划的门槛，提高了策划的效率与规范性，使缺乏经验的人员也能产出专业、规范、可追溯的策划成果。"),
    h1("五、推广价值"),
    body("一是可迁移：系统架构与智能体流水线可平移到春节、元宵节、文化周、讲座交流等其它文化活动，以及其它国际中文教育机构；二是可扩展：可在现有框架上继续接入资料研究智能体、文生图模型等，并向课程设计、教学管理等更广泛的教学场景延伸；三是轻量化：采用 SQLite 与本地网关，部署成本低，适合资源有限的教学一线。"),
    h1("六、技术实现概述"),
    body("技术栈：Next.js 16（App Router）+ TypeScript + Tailwind CSS 4 + Prisma 6 + SQLite。"),
    body("系统架构：Web 应用 → 统一 AI Provider 层 → 大模型（经网关接入），业务代码不直接依赖任何具体模型供应商。"),
    body("数据模型：共 18 张表，覆盖项目、简报、分析、研究库、事实账本、方案、评审、决策、详细计划、预算、文案、海报、海报设计、最终质检、审批等，支撑全流程的结构化沉淀与版本管理。"),
    body("运行环境：Node.js 22+，本地 AI 网关（Anthropic 兼容协议），浏览器访问。"),
  ];
  await save("02_作品综合说明.docx", children);
}

// ============================================================
// 3. 智能体应用案例包
// ============================================================
async function doc3() {
  const children = [
    title("智能体应用案例包"),
    subtitle(作品名称),
    h1("一、案例概述"),
    body("本案例面向国际中文教育机构的常态化文化活动策划需求，构建了一个「多智能体流水线 + 人机协同双关卡」的应用系统。系统以一次真实活动（莫伊大学孔子学院 2026 年中秋节活动）为场景，实现了从需求分析到最终审批的端到端自动策划，并突出「反幻觉」与「可追溯」两大工程特性。"),
    h1("二、系统架构"),
    body("系统采用「Web 应用 → 统一 AI Provider 层 → 大模型」三层架构。前端为 Next.js 应用，提供项目管理、智能体面板与人工审批界面；后端通过统一的 AI Provider 抽象层调用大模型，各智能体以「角色 + 提示词 + 结构化输出」实现，不依赖任何具体模型供应商。数据层采用 Prisma + SQLite，覆盖全流程共 18 张表。"),
    h1("三、智能体清单"),
    body("系统包含 10 个专业智能体与 2 道人工关卡，职责如下：", { noIndent: true }),
  ];

  const agentRows = [
    ["项目经理（PM）", "需求分析，梳理已知 / 未知 / 假设 / 下一步"],
    ["策划师（Strategist）", "生成三个方向不同的方案 A / B / C"],
    ["评审（Critic）", "八维评分 + 优点 / 缺点 / 风险 + 推荐"],
    ["事实核查（Fact Checker）", "外部事实分类：FACT / ASSUMPTION / UNKNOWN / CONFLICT"],
    ["详细规划（Planner）", "十六章节正式活动方案"],
    ["预算（Budget）", "十类预算项 + 自动合计 + 成本风险"],
    ["文案（Copywriter）", "九项宣传文案"],
    ["海报内容（Poster）", "十项海报字段"],
    ["海报设计（Designer）", "完整 HTML / CSS 海报"],
    ["最终质检（QA）", "PASS / WARNING / BLOCK 结论"],
  ];
  children.push(
    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [2600, 6426],
      rows: [
        new TableRow({ tableHeader: true, children: [
          cell("智能体 / 关卡", 2600, { shade: true, bold: true }),
          cell("职责", 6426, { shade: true, bold: true }),
        ]}),
        ...agentRows.map(([a, b]) => new TableRow({ children: [cell(a, 2600), cell(b, 6426)] })),
        new TableRow({ children: [cell("人工关卡 1（选方向）", 2600, { bold: true }), cell("用户从方案 A / B / C 中点击选择或全部驳回", 6426)] }),
        new TableRow({ children: [cell("人工关卡 2（最终审批）", 2600, { bold: true }), cell("用户点击通过 / 驳回 / 要求修改", 6426)] }),
      ],
    })
  );

  children.push(
    h1("四、典型应用流程"),
    body("创建项目 → 项目经理分析（已知 / 未知 / 假设）→ 生成三个方案 A/B/C → 人工智能评审（评分 + 推荐）→ 事实核验（外部事实分类）→ 人工关卡 1：选择活动方向 → 生成十六章节详细方案 → 生成预算（十类 + 自动合计）→ 生成宣传文案（九项）→ 生成海报内容与 HTML 海报设计 → 最终质检（PASS / WARNING / BLOCK）→ 人工关卡 2：最终批准 / 驳回 / 要求修改。", { noIndent: true }),
    h1("五、关键功能与界面"),
    body("（1）项目管理：项目列表、新建（十一字段表单）、编辑、删除；", { noIndent: true }),
    body("（2）智能体面板：每个智能体对应一个面板，支持生成、查看、重新生成与版本记录；", { noIndent: true }),
    body("（3）人工审批：两道关卡均为独立界面，决策结果落库；", { noIndent: true }),
    body("（4）连通性测试：/ai-test 页面可一键测试网关连接状态。", { noIndent: true }),
    body("【建议在此附上系统运行界面截图】", { bold: true, noIndent: true }),
    h1("六、数据模型"),
    body("核心数据表 18 张，包括：Project（项目）、ProjectBrief（简报）、PmAnalysis（分析）、ResearchItem（研究库）、Fact（事实账本）、Concept（方案）、Critique（评审）、Decision（决策）、ActivityPlan（详细方案）、Budget / BudgetItem（预算）、Copy（文案）、Poster（海报内容）、PosterDesign（海报设计）、FinalQa（质检）、Approval（审批）等。"),
    h1("七、技术栈与运行环境"),
    body("技术栈：Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma 6 + SQLite。"),
    body("运行环境：Node.js 22+；本地 AI 网关（Anthropic 兼容协议，当前接入 DeepSeek 推理模型）；浏览器访问。"),
    h1("八、演示说明"),
    body("启动应用后，新建一个活动项目并填写简报，即可依次触发各智能体；在两道人工关卡处需真人点击以继续流程；最终在审批页完成整个闭环。"),
  );
  await save("03_智能体应用案例包.docx", children);
}

// ============================================================
// 4. 原创与合规承诺书
// ============================================================
async function doc4() {
  const children = [
    title("原创与合规承诺书"),
    body("申报单位 / 团队：【请填写单位或团队名称】", { noIndent: true }),
    body("作品名称：" + 作品名称, { noIndent: true }),
    body("申报组别：智能体设计应用组", { noIndent: true }),
    h1("承诺事项"),
    body("本人（团队）郑重承诺：", { noIndent: true }),
    body("1. 本作品为本人（团队）原创或依法享有相关权利，不侵犯任何第三方的著作权、商标权、专利权、肖像权、名誉权等合法权益；", { noIndent: true }),
    body("2. 作品中使用的数据、素材、代码等来源合法合规，符合国家有关法律法规及本次活动的要求；", { noIndent: true }),
    body("3. 申报材料真实、准确，不存在虚假、夸大或抄袭情形；", { noIndent: true }),
    body("4. 同意主办方在本次活动范围内对作品进行展示、交流与传播。", { noIndent: true }),
    body("如因作品权利瑕疵或内容违规引发的法律纠纷及责任，由本人（团队）自行承担。", { noIndent: true }),
    body("", { noIndent: true }),
    body("负责人（签名）：【请签名】", { noIndent: true }),
    body("日期：【      年      月      日】", { noIndent: true }),
  ];
  await save("04_原创与合规承诺书.docx", children);
}

// ============================================================
// 5. 支撑材料清单
// ============================================================
async function doc5() {
  const children = [
    title("必要支撑材料清单"),
    subtitle("智能体设计应用组"),
    body("建议随申报材料一并提交以下支撑材料，逐项核对勾选：", { noIndent: true }),
  ];
  const rows = [
    ["系统源代码", "提供可访问的代码仓库地址（GitHub）"],
    ["操作演示视频", "录制 3—5 分钟完整流程演示（从创建项目到最终审批）"],
    ["界面截图", "项目列表、智能体面板、人工关卡、审批页等关键界面截图"],
    ["系统架构图", "Web 应用 → AI Provider 层 → 大模型 的架构示意"],
    ["数据模型说明", "18 张表的实体关系说明"],
    ["运行 / 测试记录", "网关连通性测试、类型检查、代码检查、构建通过记录"],
    ["用户使用说明", "快速开始步骤（安装、配置、启动）"],
    ["真实应用案例说明", "莫伊大学孔子学院中秋活动策划的实际产出样例"],
  ];
  children.push(
    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [2800, 6226],
      rows: [
        new TableRow({ tableHeader: true, children: [
          cell("支撑材料", 2800, { shade: true, bold: true }),
          cell("说明", 6226, { shade: true, bold: true }),
        ]}),
        ...rows.map(([a, b]) => new TableRow({ children: [cell(a, 2800), cell(b, 6226)] })),
      ],
    })
  );
  await save("05_支撑材料清单.docx", children);
}

(async () => {
  await doc1();
  await doc2();
  await doc3();
  await doc4();
  await doc5();
  console.log("DONE");
})().catch((e) => { console.error(e); process.exit(1); });
