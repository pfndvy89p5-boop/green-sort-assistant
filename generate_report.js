const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalAlign, ShadingType
} = require("docx");
const fs = require("fs");
const path = require("path");

const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, bold: opts.bold || false, size: opts.size || 24, font: "宋体" }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") {
        runs.push(new TextRun({ text: t, bold: opts.bold || false, size: opts.size || 24, font: "宋体" }));
      } else {
        runs.push(new TextRun({ size: 24, font: "宋体", ...t }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: opts.spacing || { after: 0, line: 360 },
  });
}

function cell(content, opts = {}) {
  const children = Array.isArray(content) ? content : [p(content, { bold: opts.bold, alignment: opts.alignment })];
  return new TableCell({
    children,
    borders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: opts.verticalAlign || VerticalAlign.CENTER,
    columnSpan: opts.columnSpan || undefined,
    rowSpan: opts.rowSpan || undefined,
  });
}

function contentCell(paragraphs, opts = {}) {
  return new TableCell({
    children: paragraphs,
    borders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.TOP,
    columnSpan: opts.columnSpan || undefined,
  });
}

// ===== 正文内容 =====

const s1_1 = `现在垃圾分类已经推行好几年了，但说实话，大多数人还是分不清手里的东西到底该扔哪个桶。我自己平时扔垃圾也经常犹豫，更别说家里长辈了。网上虽然有各种分类查询工具，但要么界面复杂，要么要下载专门的APP，用起来不太方便。`;

const s1_2 = `微信小程序不用安装，打开就能用，这个特点特别适合做垃圾分类这种\u201C用完即走\u201D的场景。所以我想做一个基于微信小程序的垃圾分类助手，核心功能就是拍照识别和文字查询\u2014\u2014拍一下或者输入名字，马上就能知道这个垃圾属于哪一类，该怎么投放。`;

const s1_3 = `除了基本的查询功能，我还加了收藏、分类浏览、搜索历史这些实用的小功能，让用户体验更完整。后端用的是微信云开发，数据库存了79种常见垃圾的分类数据，图像识别接的是百度AI的开放平台API。整个项目从需求分析、界面设计、编码实现到测试，都是我一个人完成的。`;

const s1_4 = `做这个项目一方面是完成毕业设计的要求，另一方面也是想做一个真正能用的东西。如果后续能推广到社区或者学校，对提高大家的垃圾分类意识还是有帮助的。`;

const s2_content = [
  p(`研究主要内容：`, { bold: true, spacing: { after: 60, line: 360 } }),
  p(`（1）调研现有垃圾分类工具的功能和用户体验，确定系统需要实现的核心功能模块，包括拍照识别、文字查询、分类浏览、收藏管理和搜索历史等。`, { spacing: { after: 60, line: 360 } }),
  p(`（2）完成系统的整体架构设计，前端用微信小程序的WXML和WXSS搭建界面，后端用云开发提供数据存储和接口服务，图像识别对接百度AI开放平台。`, { spacing: { after: 60, line: 360 } }),
  p(`（3）实现用户端的全部功能：首页搜索和拍照入口、AI拍照识别并返回分类结果、文字查询垃圾信息、四分类知识库浏览、个人收藏管理、搜索历史记录，以及管理员后台的数据管理功能。`, { spacing: { after: 60, line: 360 } }),
  p(`（4）对系统进行全面的功能测试和兼容性测试，确保在不同机型和微信版本上都能正常使用。`, { spacing: { after: 120, line: 360 } }),
  p(`研究方法：`, { bold: true, spacing: { after: 60, line: 360 } }),
  p(`主要用了文献研究法和原型法。前期查了一些关于垃圾分类政策和现有APP的文献资料，了解行业现状和用户需求。开发过程中采用原型迭代的方式，先做出基本功能，再根据实际使用情况逐步优化界面和交互。`, { spacing: { after: 120, line: 360 } }),
  p(`技术路线：`, { bold: true, spacing: { after: 60, line: 360 } }),
  p(`前端框架是微信小程序原生开发，用WXML写页面结构，WXSS写样式，JavaScript处理逻辑。界面设计采用了Neo-Brutalist（新粗野主义）风格，特点是粗黑边框、硬阴影、高对比度配色，视觉效果比较鲜明。后端用的是微信云开发，数据库用云数据库MongoDB，存了trash_data集合，里面有79条种子数据。图像识别调的是百度AI的垃圾识别API，前端拍照后把图片传到云函数，云函数再调用百度接口，返回识别结果。整个开发流程按照需求分析、概要设计、详细设计、编码实现、系统测试这几个阶段来推进。`, { spacing: { after: 0, line: 360 } }),
];

const s3_content = [
  p(`研究条件：`, { bold: true, spacing: { after: 60, line: 360 } }),
  p(`开发工具用的是微信开发者工具，后端环境是微信云开发平台，不需要自己搭服务器。图像识别用的是百度AI开放平台的免费额度，目前够用。测试设备有Android手机，可以在真机上调试。学校图书馆的知网和万方数据库可以查相关文献。指导老师在这一块有经验，能提供指导。`, { spacing: { after: 120, line: 360 } }),
  p(`可能存在的问题：`, { bold: true, spacing: { after: 60, line: 360 } }),
  p(`（1）拍照识别的准确率受光线、角度、背景影响比较大，有些物品可能识别不出来或者识别错误。解决办法是加上文字查询作为补充，用户拍不准的时候可以直接输入名字查。`, { spacing: { after: 60, line: 360 } }),
  p(`（2）百度AI的免费调用额度有限，如果用户量大了可能会超限。目前项目主要是毕业设计用途，用户量不大，暂时够用。后续如果需要可以升级套餐或者换其他识别方案。`, { spacing: { after: 60, line: 360 } }),
  p(`（3）不同手机型号和微信版本可能存在兼容性问题，需要在多个设备上做测试。`, { spacing: { after: 60, line: 360 } }),
  p(`（4）数据库里的垃圾种类目前只有79种，覆盖面还不够广，后续需要持续补充数据。`, { spacing: { after: 0, line: 360 } }),
];

const s4_content = [
  p(`预期完成以下成果：`, { spacing: { after: 60, line: 360 } }),
  p(`（1）完成一个基于微信小程序的垃圾分类助手，包含用户端和管理员端两个部分。用户端能实现拍照识别分类、文字查询、四分类知识库浏览、收藏管理、搜索历史等功能；管理员端能管理垃圾数据、查看用户反馈。`, { spacing: { after: 60, line: 360 } }),
  p(`（2）完成系统的功能测试和兼容性测试，提交测试报告，记录测试用例和运行效果截图。`, { spacing: { after: 60, line: 360 } }),
  p(`（3）撰写并提交符合学校规范的毕业论文一篇，内容涵盖系统需求分析、总体设计、详细设计、编码实现、系统测试等全过程。`, { spacing: { after: 0, line: 360 } }),
];

const s5_content = [
  p(`第1-2周：查阅文献资料，完成需求分析和开题报告。`, { spacing: { after: 60, line: 360 } }),
  p(`第3-4周：完成系统总体设计和数据库设计，搭建开发环境。`, { spacing: { after: 60, line: 360 } }),
  p(`第5-8周：完成前端页面开发和后端云函数编写，实现核心功能。`, { spacing: { after: 60, line: 360 } }),
  p(`第9-10周：进行系统测试，修复bug，优化性能和用户体验。`, { spacing: { after: 60, line: 360 } }),
  p(`第11-14周：撰写毕业论文，整理文档和截图。`, { spacing: { after: 60, line: 360 } }),
  p(`第15-16周：修改完善论文，准备答辩。`, { spacing: { after: 0, line: 360 } }),
];

// ===== 构建文档 =====

const titleRow = new TableRow({
  children: [
    cell(`题  目`, { bold: true, alignment: AlignmentType.CENTER, width: 20 }),
    cell(`基于微信小程序的垃圾分类管理系统设计与实现`, { alignment: AlignmentType.CENTER, width: 80, columnSpan: 4 }),
  ],
});

const timeRow = new TableRow({
  children: [
    cell(`毕业论文（设计）时间`, { bold: true, alignment: AlignmentType.CENTER, width: 20 }),
    cell(``, { alignment: AlignmentType.CENTER, width: 30 }),
    cell(`至`, { alignment: AlignmentType.CENTER, width: 10 }),
    cell(``, { alignment: AlignmentType.CENTER, width: 40, columnSpan: 2 }),
  ],
});

const teacherRow = new TableRow({
  children: [
    cell(`指导教师`, { bold: true, alignment: AlignmentType.CENTER, width: 20, rowSpan: 2 }),
    cell(`姓名`, { bold: true, alignment: AlignmentType.CENTER, width: 10 }),
    cell(`夏钰红`, { alignment: AlignmentType.CENTER, width: 20 }),
    cell(`所在单位`, { bold: true, alignment: AlignmentType.CENTER, width: 15 }),
    cell(`成都文理学院`, { alignment: AlignmentType.CENTER, width: 35 }),
  ],
});

const teacherRow2 = new TableRow({
  children: [
    cell(`职称`, { bold: true, alignment: AlignmentType.CENTER, width: 10 }),
    cell(`副教授`, { alignment: AlignmentType.CENTER, width: 20 }),
    cell(``, { width: 15 }),
    cell(``, { width: 35 }),
  ],
});

const mainTitle = p(`附表二`, { alignment: AlignmentType.CENTER, size: 28, bold: true });
const subTitle = p(`成都文理学院本科毕业论文（设计）开题报告表`, { alignment: AlignmentType.CENTER, size: 32, bold: true, spacing: { after: 200, line: 360 } });
const infoLine = p(`学院  理工学院    专业  网络工程    姓名  兰哲    学号  231060250126`, { alignment: AlignmentType.LEFT, size: 24, spacing: { after: 200, line: 360 } });

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    titleRow,
    timeRow,
    teacherRow,
    teacherRow2,
    new TableRow({
      children: [
        contentCell([
          p(`1.选题背景与意义`, { bold: true, size: 24, spacing: { after: 120, line: 360 } }),
          p(s1_1, { spacing: { after: 120, line: 360 } }),
          p(s1_2, { spacing: { after: 120, line: 360 } }),
          p(s1_3, { spacing: { after: 120, line: 360 } }),
          p(s1_4, { spacing: { after: 0, line: 360 } }),
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`2.研究主要内容、方法与技术路线`, { bold: true, size: 24, spacing: { after: 120, line: 360 } }),
          ...s2_content,
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`3.研究条件和可能存在的问题`, { bold: true, size: 24, spacing: { after: 120, line: 360 } }),
          ...s3_content,
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`4.预期结果`, { bold: true, size: 24, spacing: { after: 120, line: 360 } }),
          ...s4_content,
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`5.论文工作进度安排`, { bold: true, size: 24, spacing: { after: 120, line: 360 } }),
          ...s5_content,
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`指导教师意见：`, { bold: true, size: 24, spacing: { after: 2400, line: 360 } }),
          p(``, { spacing: { after: 200 } }),
          p(`指导教师签名：`, { alignment: AlignmentType.RIGHT, size: 24, spacing: { after: 0 } }),
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`教研室意见：`, { bold: true, size: 24, spacing: { after: 2400, line: 360 } }),
          p(``, { spacing: { after: 200 } }),
          p(`教研室主任签名：`, { alignment: AlignmentType.RIGHT, size: 24, spacing: { after: 0 } }),
        ], { columnSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        contentCell([
          p(`学院意见：`, { bold: true, size: 24, spacing: { after: 2400, line: 360 } }),
          p(``, { spacing: { after: 200 } }),
          p(`分管院长签名（签章）：`, { alignment: AlignmentType.RIGHT, size: 24, spacing: { after: 0 } }),
        ], { columnSpan: 5 }),
      ],
    }),
  ],
});

const noteP = p(`注：1、开题报告应根据指导教师下发的毕业论文（设计）任务书，在教师的指导下由学生独立撰写，在毕业论文（设计）开始后三周内完成。`, { size: 20, spacing: { before: 200, line: 300 } });

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 },
      },
    },
    children: [
      mainTitle,
      subTitle,
      infoLine,
      table,
      noteP,
    ],
  }],
});

const outputPath = path.join(__dirname, `\u5F00\u9898\u62A5\u544A-\u5170\u54F2-231060250126.docx`);
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`\u6587\u6863\u5DF2\u751F\u6210\uFF1A` + outputPath);
}).catch(err => {
  console.error(`\u751F\u6210\u5931\u8D25\uFF1A`, err);
});
