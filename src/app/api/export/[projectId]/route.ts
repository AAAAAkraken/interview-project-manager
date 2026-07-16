import { NextRequest, NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import { generateTextExport, generateJsonExport } from '@/lib/export/resumeExport';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = projectRepo.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: '项目未找到' }, { status: 404 });
    }

    const format = request.nextUrl.searchParams.get('format') || 'text';
    const analysisId = request.nextUrl.searchParams.get('analysisId') || undefined;

    if (format === 'json') {
      const data = generateJsonExport(projectId, analysisId);
      return NextResponse.json(data);
    }

    const text = generateTextExport(projectId, analysisId);
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
