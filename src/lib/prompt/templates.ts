export const AI_ANALYSIS_PROMPT_TEMPLATE = `你是一位资深技术面试官和代码审查专家。请分析以下项目，并输出结构化的JSON数据，帮助我准备技术面试。

## 项目信息
- 项目名称：{projectName}
- 项目描述：{description}
- 代码路径：{repoPath}

## 分析要求

请仔细阅读项目代码（重点关注目录结构、核心文件、技术栈、架构设计），然后输出以下JSON结构。注意：必须严格遵循JSON格式，不要在JSON之外添加任何解释文字。

{
  "overview": {
    "language": "主要编程语言（如 TypeScript, Python, Go, Java 等）",
    "summary": "项目的整体概述，用2-3句话描述项目是做什么的、解决了什么问题",
    "architecture": "架构模式的详细描述（如 MVC, 微服务, 单体应用, 事件驱动, Serverless 等），并解释为什么选择这种架构",
    "directoryStructure": {
      "顶级目录或关键目录名": "该目录的作用和包含内容的说明"
    }
  },
  "techStack": {
    "frameworks": ["使用的框架名称，如 Next.js, Express, Spring Boot 等"],
    "database": "使用的数据库（如 PostgreSQL, MongoDB, Redis, SQLite 等，如果项目没有使用数据库则填'无'）",
    "keyLibraries": ["项目中使用的关键第三方库，如 axios, lodash, prisma 等"]
  },
  "keyFiles": [
    {
      "filePath": "相对于项目根目录的文件路径，如 src/app/page.tsx",
      "role": "该文件在项目中的角色定位（如：应用入口、核心业务逻辑、数据模型定义、路由配置、中间件、工具函数等）",
      "description": "该文件的详细说明，包括它的主要功能、为什么重要、以及它在整个架构中的位置",
      "keyTechnologies": ["该文件中涉及的关键技术点、设计模式或编程概念"]
    }
  ],
  "interviewQuestions": [
    {
      "category": "问题分类，从以下选项中选择：架构设计、性能优化、技术难点、代码质量、安全、测试、数据库、部署运维",
      "question": "面试官可能会问的具体技术问题",
      "suggestedAnswer": "建议的回答要点和思路，包含技术关键词，帮助你在面试中展现深度"
    }
  ],
  "resumeHighlights": [
    {
      "content": "适合写在简历上的项目亮点描述。使用STAR法则（情境-任务-行动-结果），突出你的技术贡献和项目成果。每条描述控制在50-100字"
    }
  ]
}

## 重要注意事项

1. 请认真阅读项目代码后再输出分析结果，确保所有信息准确反映实际代码
2. keyFiles 字段至少列出 5 个最重要的文件，最多 20 个，按重要性排序
3. interviewQuestions 字段至少生成 5 个有深度的问题，必须覆盖至少 3 个不同的分类
4. resumeHighlights 字段生成 3-5 个不同角度的亮点描述
5. directoryStructure 字段列出项目的主要目录（3-10个），准确解释每个目录的用途
6. 所有JSON字段都是必填的，不要省略任何字段或使用空数组代替有内容的数组
7. 请确保输出的是合法的JSON格式，可以直接被 JSON.parse 解析
8. 不要在JSON外层包裹 markdown 代码块标记（\`\`\`json），直接输出纯JSON
9. 所有文字内容使用中文，但技术术语（如框架名、库名）保持原文`;
