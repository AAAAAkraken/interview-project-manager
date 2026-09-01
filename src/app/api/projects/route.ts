import { NextResponse } from 'next/server';
import * as projectRepo from '@/lib/repositories/projectRepository';
import { normalizeRepoPath } from '@/lib/projects/repoPath';

export async function GET() {
  try {
    const projects = projectRepo.getAllProjectsWithAnalysisStatus();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: '项目名称不能为空' },
        { status: 400 }
      );
    }
    const project = projectRepo.createProject({
      name: body.name.trim(),
      description: body.description?.trim() || '',
      repoPath: normalizeRepoPath(body.repoPath),
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    );
  }
}
