import { NextResponse } from 'next/server';
import { parseImportBlocks, parseImportHtmlPreview, parseImportText } from '@/lib/resume/docxParser';

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请选择 Word 简历文件' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: '目前只支持 .docx 格式的 Word 文件' }, { status: 400 });
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return NextResponse.json({ error: 'Word 文件太大，请控制在 20MB 以内' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const [blocks, text, html] = await Promise.all([
      parseImportBlocks(buffer),
      parseImportText(buffer),
      parseImportHtmlPreview(buffer),
    ]);
    return NextResponse.json({
      sourceFileName: file.name,
      blocks,
      text,
      html,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: '解析 Word 简历失败', details }, { status: 400 });
  }
}
