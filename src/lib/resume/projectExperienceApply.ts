import type { ResumeSection } from '@/types/resume';

export interface ApplyProjectExperienceOptions {
  mode: 'append' | 'replace';
  content: string;
  targetSectionId?: string;
  newSectionTitle?: string;
}

export function applyProjectExperienceToSections(
  sections: ResumeSection[],
  options: ApplyProjectExperienceOptions
): ResumeSection[] {
  const content = options.content.trim();
  if (!content) return sections;

  const nextSections = sections.map(section => ({ ...section }));

  if (options.targetSectionId) {
    const index = nextSections.findIndex(section => section.id === options.targetSectionId);
    if (index >= 0) {
      const section = nextSections[index];
      nextSections[index] = {
        ...section,
        type: section.type === 'custom' ? 'projects' : section.type,
        title: section.title.trim() || options.newSectionTitle || '项目经历',
        enabled: true,
        content: options.mode === 'append'
          ? appendContent(section.content, content)
          : content,
      };
      return nextSections;
    }
  }

  nextSections.push({
    id: crypto.randomUUID(),
    type: 'projects',
    title: options.newSectionTitle?.trim() || '项目经历',
    enabled: true,
    content,
  });
  return nextSections;
}

function appendContent(existing: string, incoming: string): string {
  const current = existing.trim();
  const next = incoming.trim();
  if (!next) return current;
  if (!current) return next;
  return `${current}\n\n${next}`;
}
