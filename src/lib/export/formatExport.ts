import type { Project } from '@/types/project';
import type { Analysis, InterviewQuestion, KeyFile, ResumeHighlight } from '@/types/analysis';

export interface TextExportData {
  project: Project;
  analyses: Analysis[];
  analysis: Analysis | null;
  keyFiles: KeyFile[];
  questions: InterviewQuestion[];
  highlights: ResumeHighlight[];
}

export function formatTextExport(data: TextExportData): string {
  const lines: string[] = [];
  const analysis = data.analysis;

  lines.push(`# ${data.project.name} - 面试档案`);
  lines.push('');
  lines.push(`> 项目描述：${data.project.description || '无'}`);
  lines.push(`> 代码路径：${data.project.repoPath || '无'}`);
  lines.push('');

  if (analysis) {
    lines.push('## 项目概览');
    lines.push('');
    lines.push(`**语言**：${analysis.language || '无'}`);
    lines.push(`**架构**：${analysis.architecture || '无'}`);
    lines.push('');

    lines.push('## 技术栈');
    lines.push('');
    lines.push(`- 框架：${analysis.frameworks.join('、') || '无'}`);
    lines.push(`- 数据库：${analysis.databaseUsed || '无'}`);

    if (Object.keys(analysis.directoryStructure).length > 0) {
      lines.push('');
      lines.push('## 目录结构');
      lines.push('');
      for (const [dir, desc] of Object.entries(analysis.directoryStructure)) {
        lines.push(`- \`${dir}\` - ${desc}`);
      }
    }
  }

  if (data.keyFiles.length > 0) {
    lines.push('');
    lines.push('## 关键文件');
    lines.push('');
    for (const kf of data.keyFiles) {
      lines.push(`### ${kf.filePath}`);
      lines.push(`- **角色**：${kf.role}`);
      lines.push(`- **说明**：${kf.description}`);
      lines.push(`- **关键技术**：${kf.keyTechnologies.join('、') || '无'}`);
      lines.push('');
    }
  }

  if (data.questions.length > 0) {
    lines.push('## 面试问答');
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
    lines.push('## 简历亮点');
    lines.push('');
    for (const h of data.highlights) {
      lines.push(`- ${h.content}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
