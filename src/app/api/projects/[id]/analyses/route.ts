import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import * as analysisRepo from '@/lib/repositories/analysisRepository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = projectRepo.getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: '项目未找到' }, { status: 404 });
    }

    const analyses = analysisRepo.getAnalysisSummariesByProjectId(id);
    return NextResponse.json(analyses);
  } catch (error) {
    return NextResponse.json({ error: '获取分析历史失败' }, { status: 500 });
  }
}
