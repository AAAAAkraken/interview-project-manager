import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import * as settingsRepo from '@/lib/repositories/aiSettingsRepository';
import * as analysisRepo from '@/lib/repositories/analysisRepository';
import { scanSourceFiles } from '@/lib/analysis/sourceScanner';
import { buildAutoAnalysisPrompt } from '@/lib/analysis/autoPrompt';
import { OpenAICompatibleProvider } from '@/lib/llm/openAICompatibleProvider';
import { parseAiResponse, ParseError } from '@/lib/parser/aiResponseParser';
import { getAnalysisJob, startAnalysisJob } from '@/lib/analysis/analysisJobs';
import type { CreateAnalysisInput } from '@/types/analysis';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  return NextResponse.json(getAnalysisJob(projectId));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = projectRepo.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: '项目未找到' }, { status: 404 });
    }
    if (!project.repoPath.trim()) {
      return NextResponse.json({ error: '请先为项目填写代码路径' }, { status: 400 });
    }

    const settings = settingsRepo.getAiSettings();
    if (!settings?.baseUrl || !settings.apiKey || !settings.model) {
      return NextResponse.json({ error: '请先配置 AI API 的 Base URL、API Key 和模型名称' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const interviewRole = String(body.interviewRole || '').trim();

    const job = startAnalysisJob(projectId, async () => {
      const files = scanSourceFiles(project.repoPath);
      if (files.length === 0) {
        throw new Error('没有找到可分析的源码文件');
      }

      const prompt = buildAutoAnalysisPrompt(project, files, interviewRole);
      const provider = new OpenAICompatibleProvider({
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        timeoutMs: 300_000,
      });

      const aiText = await provider.generateText(prompt);
      let parsed;
      try {
        parsed = parseAiResponse(aiText);
      } catch (error) {
        if (error instanceof ParseError) {
          throw new Error(`${error.userMessage}${error.details ? `：${error.details}` : ''}`);
        }
        throw error;
      }

      const input: CreateAnalysisInput = {
        projectId,
        language: parsed.overview.language,
        frameworks: parsed.techStack.frameworks,
        databaseUsed: parsed.techStack.database,
        architecture: parsed.overview.architecture,
        directoryStructure: parsed.overview.directoryStructure,
        rawAiResponse: aiText,
        keyFiles: parsed.keyFiles,
        interviewQuestions: parsed.interviewQuestions,
        resumeHighlights: parsed.resumeHighlights,
      };

      const analysis = analysisRepo.createAnalysis(input);
      return { analysisId: analysis.id, scannedFiles: files.length };
    });

    return NextResponse.json(job, { status: job.status === 'running' ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 自动分析失败';
    return NextResponse.json({ error: 'AI 自动分析失败', details: message }, { status: 500 });
  }
}
