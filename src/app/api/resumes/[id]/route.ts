import { NextResponse } from 'next/server';
import * as resumeRepo from '@/lib/repositories/resumeRepository';
import { normalizeResumePageCount } from '@/lib/resume/pageLayout';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resume = resumeRepo.getResumeById(id);
  if (!resume) return NextResponse.json({ error: '简历未找到' }, { status: 404 });
  return NextResponse.json(resume);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const resume = resumeRepo.updateResume(id, {
      name: body.name,
      targetRole: body.targetRole,
      templateId: body.templateId,
      pageCount: normalizeResumePageCount(body.pageCount),
      photoDataUrl: body.photoDataUrl,
      sections: body.sections,
    });
    if (!resume) return NextResponse.json({ error: '简历未找到' }, { status: 404 });
    return NextResponse.json(resume);
  } catch (error) {
    return NextResponse.json({ error: '保存简历失败' }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!resumeRepo.deleteResume(id)) return NextResponse.json({ error: '简历未找到' }, { status: 404 });
  return NextResponse.json({ success: true });
}
