import JSZip from 'jszip';
import mammoth from 'mammoth';
import type { ResumeImportBlock, ResumeSection, ResumeSectionType } from '@/types/resume';

const SECTION_RULES: Array<{ type: ResumeSectionType; title: string; patterns: RegExp[] }> = [
  { type: 'basic', title: '基本信息', patterns: [/基本信息/i, /个人信息/i, /联系方式/i] },
  { type: 'target', title: '求职目标', patterns: [/求职目标/i, /求职意向/i, /应聘职位/i] },
  { type: 'education', title: '教育经历', patterns: [/教育经历/i, /教育背景/i] },
  { type: 'work', title: '工作经历', patterns: [/工作经历/i, /工作经验/i, /实习经历/i] },
  { type: 'projects', title: '项目经历', patterns: [/项目经历/i, /项目经验/i] },
  { type: 'skills', title: '技能清单', patterns: [/专业技能/i, /技能清单/i, /技术栈/i, /技能特长/i] },
  { type: 'summary', title: '自我评价', patterns: [/自我评价/i, /个人总结/i, /个人优势/i] },
];

export function detectSections(text: string): ResumeSection[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const found: ResumeSection[] = [];
  let current: ResumeSection | null = null;
  let sawHeading = false;
  let preamble: string[] = [];

  for (const line of lines) {
    const rule = SECTION_RULES.find(item => item.patterns.some(pattern => pattern.test(line)));
    if (rule) {
      sawHeading = true;
      if (!current && preamble.length > 0) {
        found.push({
          id: crypto.randomUUID(),
          type: 'basic',
          title: '基本信息',
          enabled: true,
          content: preamble.join('\n'),
        });
        preamble = [];
      }
      if (current) found.push(current);
      current = {
        id: crypto.randomUUID(),
        type: rule.type,
        title: rule.title,
        enabled: true,
        content: '',
      };
      continue;
    }

    if (!current && sawHeading) {
      current = {
        id: crypto.randomUUID(),
        type: 'basic',
        title: '基本信息',
        enabled: true,
        content: '',
      };
    }
    if (current) {
      current.content = current.content ? `${current.content}\n${line}` : line;
    } else {
      preamble.push(line);
    }
  }

  if (!sawHeading) {
    return [{
      id: crypto.randomUUID(),
      type: 'custom',
      title: '简历内容',
      enabled: true,
      content: text.trim(),
    }];
  }

  if (current) found.push(current);
  if (found.length === 0) {
    found.push({
      id: crypto.randomUUID(),
      type: 'custom',
      title: '简历内容',
      enabled: true,
      content: text.trim(),
    });
  }
  return found;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\u00a0/g, ' ');
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\u00a0/g, ' ');
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractTableRows(tableHtml: string): string[] {
  const rows: string[] = [];
  for (const rowMatch of tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(match => stripHtml(match[1]))
      .filter(Boolean);
    const text = cells.join(' | ').trim();
    if (text) rows.push(text);
  }
  return rows;
}

function normalizeXmlText(value: string) {
  return decodeXmlEntities(value)
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ \f\v]+/g, ' ')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\n[ ]+/g, '\n')
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractXmlText(xml: string) {
  const parts: string[] = [];
  const tokenPattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<w:cr\b[^>]*\/>/gi;

  for (const match of xml.matchAll(tokenPattern)) {
    const token = match[0];
    if (match[1] !== undefined) {
      parts.push(decodeXmlEntities(match[1]));
    } else if (/<w:tab\b/i.test(token)) {
      parts.push('\t');
    } else {
      parts.push('\n');
    }
  }

  return normalizeXmlText(parts.join(''));
}

function renderTextWithLineBreaks(text: string) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function stripAlternateFallbackXml(xml: string) {
  return xml.replace(/<mc:Fallback\b[^>]*>[\s\S]*?<\/mc:Fallback>/gi, '');
}

function getPositionOffset(xml: string, axis: 'H' | 'V') {
  const match = xml.match(new RegExp(`<wp:position${axis}\\b[^>]*>[\\s\\S]*?<wp:posOffset>(-?\\d+)<\\/wp:posOffset>[\\s\\S]*?<\\/wp:position${axis}>`, 'i'));
  return match ? Number(match[1]) : 0;
}

function extractTextBoxBlocksFromXml(xml: string): ResumeImportBlock[] {
  const blocks: Array<ResumeImportBlock & { x: number; y: number; order: number }> = [];
  let order = 0;

  for (const anchorMatch of xml.matchAll(/<wp:anchor\b[^>]*>[\s\S]*?<\/wp:anchor>/gi)) {
    const anchorXml = anchorMatch[0];
    const x = getPositionOffset(anchorXml, 'H');
    const y = getPositionOffset(anchorXml, 'V');

    for (const textBoxMatch of anchorXml.matchAll(/<w:txbxContent\b[^>]*>([\s\S]*?)<\/w:txbxContent>/gi)) {
      const textBoxXml = textBoxMatch[1];
      for (const paragraphMatch of textBoxXml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi)) {
        const text = extractXmlText(paragraphMatch[1]);
        if (!text) continue;
        blocks.push({
          id: crypto.randomUUID(),
          kind: 'paragraph',
          text,
          x,
          y,
          order: order++,
        });
      }
    }
  }

  return blocks
    .sort((a, b) => a.y - b.y || a.x - b.x || a.order - b.order)
    .map(({ x: _x, y: _y, order: _order, ...block }) => block);
}

function extractTableRowsFromXml(tableXml: string): string[] {
  const rows: string[] = [];
  for (const rowMatch of tableXml.matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/gi)) {
    const rowXml = rowMatch[1];
    const cells = [...rowXml.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/gi)]
      .map(match => {
        const cellXml = match[1];
        const text = [...cellXml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi)]
          .map(paragraph => extractXmlText(paragraph[1]))
          .filter(Boolean)
          .join('\n');
        return text;
      })
      .map(text => text.trim())
      .filter(Boolean);
    const text = cells.join(' | ').trim();
    if (text) rows.push(text);
  }
  return rows;
}

function renderBlocksAsHtml(blocks: ResumeImportBlock[]) {
  return blocks.map(block => {
    const safeText = block.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    if (block.kind === 'table-row') {
      return `<p>${safeText}</p>`;
    }
    if (block.kind === 'list-item') {
      return `<p>• ${safeText}</p>`;
    }
    return `<p>${safeText}</p>`;
  }).join('');
}

function renderTableFromXml(tableXml: string) {
  const rows: string[] = [];
  for (const rowMatch of tableXml.matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/gi)) {
    const rowXml = rowMatch[1];
    const cells = [...rowXml.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/gi)]
      .map(match => {
        const cellXml = match[1];
        const text = [...cellXml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi)]
          .map(paragraph => extractXmlText(paragraph[1]))
          .filter(Boolean)
          .join('\n');
        return `<td>${renderTextWithLineBreaks(text)}</td>`;
      });
    if (cells.length > 0) rows.push(`<tr>${cells.join('')}</tr>`);
  }
  return rows.length > 0 ? `<table><tbody>${rows.join('')}</tbody></table>` : '';
}

export function sanitizeImportHtml(html: string): string {
  const allowedTags = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  ]);

  return html
    .replace(/<\s*(script|style|iframe|object|embed)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*\/?\s*([a-z0-9]+)(?:\s[^>]*)?>/gi, (match, rawTag: string) => {
      const tag = rawTag.toLowerCase();
      if (!allowedTags.has(tag)) return '';
      const isClosing = /^<\s*\//.test(match);
      const selfClosing = /\/\s*>$/.test(match) || tag === 'br';
      if (isClosing) return `</${tag}>`;
      if (selfClosing) return `<${tag}>`;
      return `<${tag}>`;
    });
}

async function readDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) {
    throw new Error('Word 文档缺少 document.xml');
  }
  return file.async('string');
}

export function extractOrderedBlocksFromDocumentXml(xml: string): ResumeImportBlock[] {
  const cleanedXml = stripAlternateFallbackXml(xml);
  const textBoxBlocks = extractTextBoxBlocksFromXml(cleanedXml);
  if (textBoxBlocks.length > 0) return textBoxBlocks;

  const bodyMatch = cleanedXml.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i);
  const bodyXml = bodyMatch?.[1] || xml;
  const blocks: ResumeImportBlock[] = [];
  const nodePattern = /<w:(p|tbl)\b[^>]*>[\s\S]*?<\/w:\1>/gi;

  for (const match of bodyXml.matchAll(nodePattern)) {
    const nodeXml = match[0];
    const tag = match[1].toLowerCase();

    if (tag === 'tbl') {
      for (const rowText of extractTableRowsFromXml(nodeXml)) {
        blocks.push({
          id: crypto.randomUUID(),
          kind: 'table-row',
          text: rowText,
        });
      }
      continue;
    }

    const text = extractXmlText(nodeXml);
    if (!text) continue;
    blocks.push({
      id: crypto.randomUUID(),
      kind: 'paragraph',
      text,
    });
  }

  return blocks;
}

export function renderOrderedHtmlFromDocumentXml(xml: string): string {
  const cleanedXml = stripAlternateFallbackXml(xml);
  const textBoxBlocks = extractTextBoxBlocksFromXml(cleanedXml);
  if (textBoxBlocks.length > 0) {
    return sanitizeImportHtml(renderBlocksAsHtml(textBoxBlocks));
  }

  const bodyMatch = cleanedXml.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i);
  const bodyXml = bodyMatch?.[1] || cleanedXml;
  const html: string[] = [];
  const nodePattern = /<w:(p|tbl)\b[^>]*>[\s\S]*?<\/w:\1>/gi;

  for (const match of bodyXml.matchAll(nodePattern)) {
    const nodeXml = match[0];
    const tag = match[1].toLowerCase();

    if (tag === 'tbl') {
      const table = renderTableFromXml(nodeXml);
      if (table) html.push(table);
      continue;
    }

    const text = extractXmlText(nodeXml);
    if (!text) continue;
    html.push(`<p>${renderTextWithLineBreaks(text)}</p>`);
  }

  return sanitizeImportHtml(html.join(''));
}

export async function parseImportHtmlPreview(buffer: Buffer): Promise<string> {
  const xml = await readDocumentXml(buffer);
  return renderOrderedHtmlFromDocumentXml(xml);
}

export async function parseImportBlocks(buffer: Buffer): Promise<ResumeImportBlock[]> {
  const xml = await readDocumentXml(buffer);
  const blocks = extractOrderedBlocksFromDocumentXml(xml);
  if (blocks.length > 0) return blocks;

  const raw = await mammoth.extractRawText({ buffer });
  return raw.value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(text => ({
      id: crypto.randomUUID(),
      kind: 'paragraph' as const,
      text,
    }));
}

export async function parseImportText(buffer: Buffer): Promise<string> {
  const blocks = await parseImportBlocks(buffer);
  if (blocks.length > 0) {
    return blocks.map(block => block.text).join('\n').trim();
  }
  const raw = await mammoth.extractRawText({ buffer });
  return raw.value.split(/\r?\n/).map(line => line.trimEnd()).join('\n').trim();
}

export async function parseDocx(buffer: Buffer): Promise<ResumeSection[]> {
  const result = await mammoth.extractRawText({ buffer });
  return detectSections(result.value);
}
