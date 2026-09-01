import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import { normalizeRepoPath } from '@/lib/projects/repoPath';

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const project = projectRepo.updateProject(id, {
      name,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      repoPath: normalizeRepoPath(body.repoPath),
    });

    if (!project) {
      return NextResponse.json({ error: '项目未找到' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: '保存项目失败' }, { status: 500 });
  }
}
