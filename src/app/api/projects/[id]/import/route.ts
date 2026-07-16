import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import * as analysisRepo from '@/lib/repositories/analysisRepository';
import { parseAiResponse, ParseError } from '@/lib/parser/aiResponseParser';
import type { CreateAnalysisInput } from '@/types/analysis';

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

    const body = await request.json();
    if (!body.rawResponse?.trim()) {
      return NextResponse.json({ error: 'AI返回内容不能为空' }, { status: 400 });
    }

    // Parse the AI response
    let parsed;
    try {
      parsed = parseAiResponse(body.rawResponse);
    } catch (e) {
      if (e instanceof ParseError) {
        return NextResponse.json(
          { error: e.userMessage, details: e.details },
          { status: 400 }
        );
      }
      throw e;
    }

    // Create analysis with all nested data
    const input: CreateAnalysisInput = {
      projectId,
      language: parsed.overview.language,
      frameworks: parsed.techStack.frameworks,
      databaseUsed: parsed.techStack.database,
      architecture: parsed.overview.architecture,
      directoryStructure: parsed.overview.directoryStructure,
      rawAiResponse: body.rawResponse,
      keyFiles: parsed.keyFiles,
      interviewQuestions: parsed.interviewQuestions,
      resumeHighlights: parsed.resumeHighlights,
    };

    const analysis = analysisRepo.createAnalysis(input);

    // Return full analysis with nested data
    const keyFiles = analysisRepo.getKeyFilesByAnalysisId(analysis.id);
    const questions = analysisRepo.getQuestionsByAnalysisId(analysis.id);
    const highlights = analysisRepo.getHighlightsByAnalysisId(analysis.id);

    return NextResponse.json({
      ...analysis,
      keyFiles,
      interviewQuestions: questions,
      resumeHighlights: highlights,
    }, { status: 201 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: '导入分析数据失败' }, { status: 500 });
  }
}
