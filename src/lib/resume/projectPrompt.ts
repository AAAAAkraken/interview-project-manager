import type { Analysis, InterviewQuestion, KeyFile, ResumeHighlight } from '@/types/analysis';
import type { Project } from '@/types/project';

export interface ProjectResumeContext {
  project: Project;
  analysis: Analysis;
  keyFiles: KeyFile[];
  highlights: ResumeHighlight[];
  questions: InterviewQuestion[];
}

export interface GeneratedProjectExperience {
  projectId: string;
  projectName: string;
  role: string;
  duration: string;
  techStack: string[];
  content: string;
}

export interface GeneratedProjectResponse {
  projects: GeneratedProjectExperience[];
}

export function buildProjectResumePrompt(
  targetRole: string,
  jobKeywords: string,
  contexts: ProjectResumeContext[]
): string {
  const projectBlocks = contexts.map(context => JSON.stringify({
    projectId: context.project.id,
    projectName: context.project.name,
    projectDescription: context.project.description,
    language: context.analysis.language,
    frameworks: context.analysis.frameworks,
    database: context.analysis.databaseUsed,
    architecture: context.analysis.architecture,
    keyFiles: context.keyFiles.map(file => ({ path: file.filePath, role: file.role, description: file.description })),
    highlights: context.highlights.map(item => item.content),
    interviewTopics: context.questions.map(item => item.question),
  }, null, 2)).join('\n\n');

  return `你是一位专业简历顾问。请根据目标岗位和项目分析资料，生成适合放入简历“项目经历”模块的内容。

目标岗位：${targetRole}
岗位关键词：${jobKeywords || '无'}

请只输出严格合法的 JSON，不要输出 markdown 或解释，格式如下：
{
  "projects": [
    {
      "projectId": "项目 ID",
      "projectName": "项目名称",
      "role": "在项目中的角色",
      "duration": "项目周期，没有信息则填空字符串",
      "techStack": ["最相关的技术栈"],
      "content": "一段适合简历的项目经历，建议 3-5 条以换行分隔，突出个人动作、技术难点和结果，不要虚构没有资料支持的数字"
    }
  ]
}

要求：
1. 只处理提供的项目，不新增项目。
2. 根据目标岗位调整技术重点和表达顺序。
3. 内容使用 STAR 思路，突出“我做了什么”。
4. 没有明确结果时使用客观描述，不要编造性能提升百分比、用户数量或业务指标。
5. 每个项目都必须返回 projectId、projectName、role、duration、techStack、content。

项目资料：
${projectBlocks}`;
}

export function parseGeneratedProjectResponse(rawText: string): GeneratedProjectResponse {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('AI 返回中没有找到有效 JSON');

  const data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1)) as Partial<GeneratedProjectResponse>;
  if (!Array.isArray(data.projects)) throw new Error('AI 返回缺少 projects 数组');

  for (const [index, project] of data.projects.entries()) {
    if (!project || typeof project !== 'object') throw new Error(`projects[${index}] 格式错误`);
    if (typeof project.projectId !== 'string' || typeof project.projectName !== 'string') {
      throw new Error(`projects[${index}] 缺少项目标识`);
    }
    if (typeof project.role !== 'string' || typeof project.duration !== 'string' || typeof project.content !== 'string') {
      throw new Error(`projects[${index}] 缺少简历内容字段`);
    }
    if (!Array.isArray(project.techStack) || project.techStack.some(item => typeof item !== 'string')) {
      throw new Error(`projects[${index}].techStack 格式错误`);
    }
  }
  return data as GeneratedProjectResponse;
}
