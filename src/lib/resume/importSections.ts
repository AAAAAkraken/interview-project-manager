import type { ResumeImportBlock, ResumeImportModule, ResumeSection, ResumeSectionType } from '@/types/resume';

const SECTION_TYPE_RULES: Array<{ type: ResumeSectionType; patterns: RegExp[] }> = [
  { type: 'basic', patterns: [/个人信息/i, /基本信息/i, /联系方式/i] },
  { type: 'target', patterns: [/求职意向/i, /求职目标/i, /应聘职位/i] },
  { type: 'education', patterns: [/教育经历/i, /教育背景/i] },
  { type: 'work', patterns: [/工作经历/i, /工作经验/i, /实习经历/i] },
  { type: 'projects', patterns: [/项目经历/i, /项目经验/i] },
  { type: 'skills', patterns: [/技能/i, /技术栈/i, /专业技能/i] },
  { type: 'summary', patterns: [/自我评价/i, /个人总结/i, /个人优势/i] },
];

function inferSectionType(title: string): ResumeSectionType {
  const rule = SECTION_TYPE_RULES.find(item => item.patterns.some(pattern => pattern.test(title)));
  return rule?.type ?? 'custom';
}

function cleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function joinBlocks(blocks: ResumeImportBlock[]) {
  return blocks.map(block => block.text).filter(Boolean).join('\n');
}

export function buildResumeSectionsFromImport(input: {
  modules: ResumeImportModule[];
  blocks: ResumeImportBlock[];
  assignments: Record<string, string[]>;
}): ResumeSection[] {
  const { modules, blocks, assignments } = input;
  const blockLookup = new Map(blocks.map(block => [block.id, block]));
  const usedBlockIds = new Set<string>();

  const sections = modules.map(module => {
    const blockIds = assignments[module.id] || [];
    const assignedBlocks = blockIds
      .map(blockId => blockLookup.get(blockId))
      .filter((block): block is ResumeImportBlock => Boolean(block));

    assignedBlocks.forEach(block => usedBlockIds.add(block.id));

    const content = joinBlocks(assignedBlocks);
    return {
      id: crypto.randomUUID(),
      type: inferSectionType(module.title),
      title: module.title.trim() || '自定义模块',
      enabled: true,
      content,
    } satisfies ResumeSection;
  }).filter(section => section.content.trim().length > 0 || section.title.trim().length > 0);

  const unassignedBlocks = blocks.filter(block => !usedBlockIds.has(block.id));
  if (unassignedBlocks.length > 0) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'custom',
      title: '未归类内容',
      enabled: true,
      content: joinBlocks(unassignedBlocks),
    });
  }

  const normalized = sections.map(section => ({
    ...section,
    title: section.title.trim(),
    content: cleanLines(section.content).join('\n'),
  }));

  return normalized.filter(section => section.content.length > 0 || section.title.length > 0);
}

