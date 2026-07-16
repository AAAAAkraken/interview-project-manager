import { NextRequest, NextResponse } from 'next/server';
import * as analysisRepo from '@/lib/repositories/analysisRepository';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: '缺少 projectId 参数' }, { status: 400 });
    }
    const analysis = analysisRepo.getLatestAnalysisByProjectId(projectId);
    if (!analysis) {
      return NextResponse.json(null);
    }
    const keyFiles = analysisRepo.getKeyFilesByAnalysisId(analysis.id);
    const questions = analysisRepo.getQuestionsByAnalysisId(analysis.id);
    const highlights = analysisRepo.getHighlightsByAnalysisId(analysis.id);
    return NextResponse.json({ ...analysis, keyFiles, interviewQuestions: questions, resumeHighlights: highlights });
  } catch (error) {
    return NextResponse.json({ error: '获取分析数据失败' }, { status: 500 });
  }
}
