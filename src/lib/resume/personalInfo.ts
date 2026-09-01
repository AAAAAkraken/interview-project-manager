import type { ResumeSection } from '@/types/resume';

const PERSONAL_INFO_PATTERNS = [/个人信息/i, /基本信息/i, /联系方式/i];

export interface PersonalInfoRow {
  id: string;
  cells: string[];
}

export function isPersonalInfoSection(section: Pick<ResumeSection, 'type' | 'title'>): boolean {
  if (section.type === 'basic') return true;
  return PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(section.title));
}

export function parsePersonalInfoRows(content: string): PersonalInfoRow[] {
  return content
    .split(/\r?\n/)
    .map((line, index) => {
      const cells = line
        .split(/[|｜]/)
        .map(cell => cell.trim())
        .filter(Boolean);

      return {
        id: `${index}-${line}`,
        cells: cells.length > 0 ? cells : [line.trim()],
      };
    })
    .filter(row => row.cells.some(cell => cell.length > 0));
}
