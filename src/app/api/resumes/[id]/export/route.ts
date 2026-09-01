import { NextResponse } from 'next/server';
import * as resumeRepo from '@/lib/repositories/resumeRepository';
import { exportResumeDocx } from '@/lib/resume/docxExport';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resume = resumeRepo.getResumeById(id);
    if (!resume) return NextResponse.json({ error: '简历未找到' }, { status: 404 });
    const buffer = await exportResumeDocx(resume);
    return new NextResponse(buffer as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="resume-${resume.id}.docx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '导出 Word 简历失败' }, { status: 500 });
  }
}
