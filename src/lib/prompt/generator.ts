import { AI_ANALYSIS_PROMPT_TEMPLATE } from './templates';
import type { Project } from '@/types/project';

export function generatePrompt(project: Project): string {
  return AI_ANALYSIS_PROMPT_TEMPLATE
    .replace('{projectName}', project.name)
    .replace('{description}', project.description || '无')
    .replace('{repoPath}', project.repoPath || '无（请在分析前手动查看项目代码）');
}
