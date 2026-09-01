import { NextResponse } from 'next/server';
import * as resumeRepo from '@/lib/repositories/resumeRepository';
import * as projectRepo from '@/lib/repositories/projectRepository';
import * as analysisRepo from '@/lib/repositories/analysisRepository';
import * as settingsRepo from '@/lib/repositories/aiSettingsRepository';
import { OpenAICompatibleProvider } from '@/lib/llm/openAICompatibleProvider';
import { buildProjectResumePrompt, parseGeneratedProjectResponse, type ProjectResumeContext } from '@/lib/resume/projectPrompt';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resume = resumeRepo.getResumeById(id);
    if (!resume) return NextResponse.json({ error: '简历未找到' }, { status: 404 });

    const body = await request.json();
    const targetRole = String(body.targetRole || resume.targetRole || '').trim();
    const jobKeywords = String(body.jobKeywords || '').trim();
    const projectIds = Array.isArray(body.projectIds) ? body.projectIds.filter((item: unknown): item is string => typeof item === 'string') : [];
    if (!targetRole) return NextResponse.json({ error: '请先填写目标岗位' }, { status: 400 });
    if (projectIds.length === 0) return NextResponse.json({ error: '请至少选择一个项目' }, { status: 400 });

    const settings = settingsRepo.getAiSettings();
    if (!settings?.baseUrl || !settings.apiKey || !settings.model) {
      return NextResponse.json({ error: '请先配置 AI API' }, { status: 400 });
    }

    const contexts: ProjectResumeContext[] = [];
    for (const projectId of projectIds) {
      const project = projectRepo.getProjectById(projectId);
      const analysis = project ? analysisRepo.getLatestAnalysisByProjectId(projectId) : undefined;
      if (!project || !analysis) continue;
      contexts.push({
        project,
        analysis,
        keyFiles: analysisRepo.getKeyFilesByAnalysisId(analysis.id),
        highlights: analysisRepo.getHighlightsByAnalysisId(analysis.id),
        questions: analysisRepo.getQuestionsByAnalysisId(analysis.id),
      });
    }
    if (contexts.length === 0) return NextResponse.json({ error: '所选项目没有可用的分析结果' }, { status: 400 });

    const provider = new OpenAICompatibleProvider({ baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model });
    const rawText = await provider.generateText(buildProjectResumePrompt(targetRole, jobKeywords, contexts));
    const generated = parseGeneratedProjectResponse(rawText);

    return NextResponse.json({ targetRole, jobKeywords, generated });
  } catch (error) {
    return NextResponse.json({
      error: '生成项目经历失败',
      details: error instanceof Error ? error.message : '',
    }, { status: 500 });
  }
}
