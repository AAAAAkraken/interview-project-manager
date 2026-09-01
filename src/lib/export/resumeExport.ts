import * as repo from '@/lib/repositories/analysisRepository';
import { getProjectById } from '@/lib/repositories/projectRepository';
import { formatTextExport } from './formatExport';
import type { Project } from '@/types/project';
import type { Analysis } from '@/types/analysis';

export interface ExportData {
  project: Project;
  analyses: Analysis[];
  analysis: Analysis | null;
  keyFiles: ReturnType<typeof repo.getKeyFilesByAnalysisId>;
  questions: ReturnType<typeof repo.getQuestionsByAnalysisId>;
  highlights: ReturnType<typeof repo.getHighlightsByAnalysisId>;
}

function getExportData(projectId: string, analysisId?: string): ExportData | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  const analyses = repo.getAnalysesByProjectId(projectId);
  const analysis = analysisId
    ? repo.getAnalysisById(analysisId)
    : repo.getLatestAnalysisByProjectId(projectId);

  if (!analysis) {
    return {
      project,
      analyses,
      analysis: null,
      keyFiles: [],
      questions: [],
      highlights: [],
    };
  }

  return {
    project,
    analyses,
    analysis,
    keyFiles: repo.getKeyFilesByAnalysisId(analysis.id),
    questions: repo.getQuestionsByAnalysisId(analysis.id),
    highlights: repo.getHighlightsByAnalysisId(analysis.id),
  };
}

export function generateTextExport(projectId: string, analysisId?: string): string {
  const data = getExportData(projectId, analysisId);
  if (!data) return '项目未找到';

  return formatTextExport(data);
}

export function generateJsonExport(projectId: string, analysisId?: string): ExportData | null {
  return getExportData(projectId, analysisId);
}
