import { NextRequest, NextResponse } from 'next/server';
import * as analysisRepo from '@/lib/repositories/analysisRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;
    const category = request.nextUrl.searchParams.get('category') || undefined;
    const questions = analysisRepo.getQuestionsByAnalysisId(analysisId, category);
    const categories = analysisRepo.getQuestionCategoriesByAnalysisId(analysisId);
    return NextResponse.json({ questions, categories });
  } catch (error) {
    return NextResponse.json({ error: '获取面试问题失败' }, { status: 500 });
  }
}
