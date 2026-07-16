import { NextResponse } from 'next/server';
import * as analysisRepo from '@/lib/repositories/analysisRepository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysis = analysisRepo.getAnalysisById(id);
    if (!analysis) {
      return NextResponse.json({ error: '分析记录未找到' }, { status: 404 });
    }

    const keyFiles = analysisRepo.getKeyFilesByAnalysisId(id);
    const questions = analysisRepo.getQuestionsByAnalysisId(id);
    const highlights = analysisRepo.getHighlightsByAnalysisId(id);

    return NextResponse.json({
      ...analysis,
      keyFiles,
      interviewQuestions: questions,
      resumeHighlights: highlights,
    });
  } catch (error) {
    return NextResponse.json({ error: '获取分析数据失败' }, { status: 500 });
  }
}
