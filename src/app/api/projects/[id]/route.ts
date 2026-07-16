import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';

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
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = projectRepo.deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ error: '项目未找到' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 });
  }
}
