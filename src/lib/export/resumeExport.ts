import * as repo from '@/lib/repositories/analysisRepository';
import type { Project } from '@/types/project';
import type { Analysis } from '@/types/analysis';

export interface ExportData {
  project: Project;
  analyses: Analysis[];
  keyFiles: ReturnType<typeof repo.getKeyFilesByAnalysisId>;
  questions: ReturnType<typeof repo.getQuestionsByAnalysisId>;
  highlights: ReturnType<typeof repo.getHighlightsByAnalysisId>;
}

function getExportData(projectId: string, analysisId?: string): ExportData | null {
  const { getProjectById, getAllProjects } = require('@/lib/repositories/projectRepository');
  const project = getProjectById(projectId);
  if (!project) return null;

  const analyses = repo.getAnalysesByProjectId(projectId);
  const targetAnalysis = analysisId
    ? repo.getAnalysisById(analysisId)
    : repo.getLatestAnalysisByProjectId(projectId);

  if (!targetAnalysis) {
    return {
      project,
      analyses,
      keyFiles: [],
      questions: [],
      highlights: [],
    };
  }

  return {
    project,
    analyses,
    keyFiles: repo.getKeyFilesByAnalysisId(targetAnalysis.id),
    questions: repo.getQuestionsByAnalysisId(targetAnalysis.id),
    highlights: repo.getHighlightsByAnalysisId(targetAnalysis.id),
  };
}

export function generateTextExport(projectId: string, analysisId?: string): string {
  const data = getExportData(projectId, analysisId);
  if (!data) return '项目未找到';

  const analysis = data.analyses.length > 0 ? data.analyses[0] : null;
  const lines: string[] = [];

  lines.push(`# ${data.project.name} — 面试档案`);
  lines.push('');
  lines.push(`> 项目描述：${data.project.description || '无'}`);
  lines.push(`> 代码路径：${data.project.repoPath || '无'}`);
  lines.push('');

  if (analysis) {
    lines.push('## 📋 项目概述');
    lines.push('');
    lines.push(`**语言**：${analysis.language}`);
    lines.push(`**架构**：${analysis.architecture}`);
    lines.push('');

    lines.push('## 🛠 技术栈');
    lines.push('');
    lines.push(`- 框架：${analysis.frameworks.join('、')}`);
    lines.push(`- 数据库：${analysis.databaseUsed}`);

    if (Object.keys(analysis.directoryStructure).length > 0) {
      lines.push('');
      lines.push('## 📂 目录结构');
      lines.push('');
      for (const [dir, desc] of Object.entries(analysis.directoryStructure)) {
        lines.push(`- \`${dir}\` — ${desc as string}`);
      }
    }
  }

  if (data.keyFiles.length > 0) {
    lines.push('');
    lines.push('## 📄 关键文件');
    lines.push('');
    for (const kf of data.keyFiles) {
      lines.push(`### ${kf.filePath}`);
      lines.push(`- **角色**：${kf.role}`);
      lines.push(`- **说明**：${kf.description}`);
      lines.push(`- **关键技术**：${kf.keyTechnologies.join('、')}`);
      lines.push('');
    }
  }

  if (data.questions.length > 0) {
    lines.push('## 🎤 面试问答');
    lines.push('');
    const byCategory = new Map<string, typeof data.questions>();
    for (const q of data.questions) {
      const list = byCategory.get(q.category) || [];
      list.push(q);
      byCategory.set(q.category, list);
    }
    for (const [category, questions] of byCategory) {
      lines.push(`### ${category}`);
      lines.push('');
      for (const q of questions) {
        lines.push(`**Q: ${q.question}**`);
        lines.push('');
        lines.push(`A: ${q.suggestedAnswer}`);
        lines.push('');
      }
    }
  }

  if (data.highlights.length > 0) {
    lines.push('## ✨ 简历亮点');
    lines.push('');
    for (const h of data.highlights) {
      lines.push(`- ${h.content}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateJsonExport(projectId: string, analysisId?: string): ExportData | null {
  return getExportData(projectId, analysisId);
}
