import { NextResponse } from 'next/server';
import * as resumeRepo from '@/lib/repositories/resumeRepository';
import { normalizeResumePageCount } from '@/lib/resume/pageLayout';

export async function GET() {
  try {
    return NextResponse.json(resumeRepo.getAllResumes());
  } catch (error) {
    return NextResponse.json({ error: '获取简历列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: '简历名称不能为空' }, { status: 400 });

    const resume = resumeRepo.createResume({
      name,
      targetRole: String(body.targetRole || ''),
      sourceFileName: String(body.sourceFileName || ''),
      templateId: String(body.templateId || ''),
      pageCount: normalizeResumePageCount(body.pageCount),
      photoDataUrl: String(body.photoDataUrl || ''),
      sections: Array.isArray(body.sections) ? body.sections : [],
    });
    return NextResponse.json(resume, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建简历失败' }, { status: 500 });
  }
}
