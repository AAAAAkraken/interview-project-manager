import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import { generatePrompt } from '@/lib/prompt';

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
    const prompt = generatePrompt(project);
    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json({ error: '生成提示词失败' }, { status: 500 });
  }
}
