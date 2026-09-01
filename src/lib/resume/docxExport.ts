import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { dataUrlToBuffer } from './photo';
import type { ResumeDocument } from '@/types/resume';

export async function exportResumeDocx(resume: ResumeDocument): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: resume.name,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '说明：这是普通 Word 版，排版可能和 PDF 略有差异。',
          italics: true,
        }),
      ],
    }),
  ];

  const photo = dataUrlToBuffer(resume.photoDataUrl || '');
  if (photo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            type: photo.mimeType,
            data: photo.buffer,
            transformation: { width: 92, height: 120 },
          }),
        ],
      })
    );
  }

  if (resume.targetRole.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `求职目标：${resume.targetRole}`, bold: true })],
      })
    );
  }

  for (const section of resume.sections) {
    if (!section.enabled) continue;
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
    for (const line of section.content.split(/\r?\n/)) {
      children.push(new Paragraph({ text: line }));
    }
  }

  const document = new Document({ sections: [{ children }] });
  return Packer.toBuffer(document);
}
