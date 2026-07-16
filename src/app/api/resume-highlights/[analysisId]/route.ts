import { NextResponse } from 'next/server';
import * as analysisRepo from '@/lib/repositories/analysisRepository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;
    const highlights = analysisRepo.getHighlightsByAnalysisId(analysisId);
    return NextResponse.json(highlights);
  } catch (error) {
    return NextResponse.json({ error: '获取简历亮点失败' }, { status: 500 });
  }
}
