import type { Project } from '@/types/project';
import type { SourceFile } from './sourceScanner';

export function buildAutoAnalysisPrompt(project: Project, files: SourceFile[], interviewRole = ''): string {
  const fileBlocks = files.map(file => [
    `## File: ${file.relativePath}`,
    '```',
    file.content,
    '```',
  ].join('\n')).join('\n\n');

  const roleLine = interviewRole.trim()
    ? `面试岗位：${interviewRole.trim()}\n请让面试问答 interviewQuestions 更贴近这个岗位，优先覆盖该岗位最常问的技术点。\n`
    : '';

  return `你是一位资深技术面试官和代码审查专家。请根据下面的项目元信息和源码片段，生成严格合法的 JSON，帮助我准备技术面试。
项目名称：${project.name}
项目描述：${project.description || '无'}
代码路径：${project.repoPath || '无'}
${roleLine}
请只输出 JSON，不要输出 markdown，不要解释。JSON schema 必须是：
{
  "overview": {
    "language": "主要编程语言",
    "summary": "2-3 句话概括项目",
    "architecture": "架构模式和设计说明",
    "directoryStructure": {
      "目录名": "目录作用"
    }
  },
  "techStack": {
    "frameworks": ["框架或主要技术"],
    "database": "数据库，没有则填无",
    "keyLibraries": ["关键第三方库"]
  },
  "keyFiles": [
    {
      "filePath": "相对路径",
      "role": "文件角色",
      "description": "为什么重要",
      "keyTechnologies": ["关键技术点"]
    }
  ],
  "interviewQuestions": [
    {
      "category": "架构设计/性能优化/技术难点/代码质量/安全/测试/数据库/部署运维",
      "question": "面试官可能问的问题",
      "suggestedAnswer": "建议回答"
    }
  ],
  "resumeHighlights": [
    {
      "content": "适合写进简历的项目亮点"
    }
  ]
}

要求：
1. keyFiles 至少 5 个，源码不足时列出你看到的关键文件。
2. interviewQuestions 至少 5 个，覆盖至少 3 个分类。
3. resumeHighlights 生成 3-5 个。
4. 所有内容使用中文，技术名词保留英文。
5. 输出必须能被 JSON.parse 直接解析。

源码片段：
${fileBlocks}`;
}
